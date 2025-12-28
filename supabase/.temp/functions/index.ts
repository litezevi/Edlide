import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-edlide-client, x-user-id, x-user-email',
	'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

// AES-256-CBC Decryption using Web Crypto API
async function decryptToken(encryptedToken: string, encryptionIv: string, key: string): Promise<string> {
	try {
		console.log('[Decrypt] Starting decryption process...');
		
		// Convert key from hex string to UInt8Array
		const keyBuffer = new Uint8Array(
			key.match(/[\da-f]{2}/gi)!.map((h) => parseInt(h, 16))
		);
		console.log('[Decrypt] Key buffer length:', keyBuffer.length);
		
		// Convert encrypted token from base64 to Uint8Array
		const encryptedBuffer = Uint8Array.from(
			atob(encryptedToken),
			(c) => c.charCodeAt(0)
		);
		console.log('[Decrypt] Encrypted buffer length:', encryptedBuffer.length);
		
		// Convert IV from base64 to Uint8Array
		const ivBuffer = Uint8Array.from(
			atob(encryptionIv),
			(c) => c.charCodeAt(0)
		);
		console.log('[Decrypt] IV buffer length:', ivBuffer.length);
		
		// Import the key
		const cryptoKey = await crypto.subtle.importKey(
			'raw',
			keyBuffer,
			{ name: 'AES-CBC', length: 256 },
			false,
			['decrypt']
		);
		console.log('[Decrypt] Key imported successfully');
		
		// Decrypt the token
		const decryptedBuffer = await crypto.subtle.decrypt(
			{
				name: 'AES-CBC',
				iv: ivBuffer
			},
			cryptoKey,
			encryptedBuffer
		);
		console.log('[Decrypt] Decryption successful, buffer length:', decryptedBuffer.byteLength);
		
		// Convert back to string
		const decryptedString = new TextDecoder().decode(decryptedBuffer);
		console.log('[Decrypt] Token decrypted successfully, length:', decryptedString.length);
		
		return decryptedString;
	} catch (error) {
		console.error('[Decrypt] Decryption error details:', {
			error,
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			encryptedTokenLength: encryptedToken.length,
			ivLength: encryptionIv.length,
			keyLength: key.length
		});
		throw new Error(`Failed to decrypt Chutes token: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', {
			headers: corsHeaders
		});
	}
	try {
		console.log('[AI Proxy] Received request:', {
			method: req.method,
			url: req.url,
			headers: Object.fromEntries(req.headers.entries())
		});
		
		const edlideClient = req.headers.get('x-edlide-client');
		if (edlideClient !== 'electron') {
			console.error('[AI Proxy] Unauthorized client:', edlideClient);
			return new Response(JSON.stringify({
				error: 'Unauthorized client'
			}), {
				status: 403,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}
		
		const userId = req.headers.get('x-user-id');
		const userEmail = req.headers.get('x-user-email');
		
		console.log('[AI Proxy] User context:', { userId, userEmail });
		
		if (!userId) {
			console.error('[AI Proxy] Missing user ID header');
			return new Response(JSON.stringify({
				error: 'Missing user ID'
			}), {
				status: 400,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}
		
		const supabaseUrl = Deno.env.get('SUPABASE_URL');
		const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
		const encryptionKey = Deno.env.get('CHUTES_ENCRYPTION_KEY');
		
		console.log('[AI Proxy] Environment check:', {
			hasProjectUrl: !!supabaseUrl,
			hasProjectAnonKey: !!supabaseAnonKey,
			hasEncryptionKey: !!encryptionKey,
			encryptionKeyLength: encryptionKey?.length
		});
		
		if (!encryptionKey) {
			console.error('[AI Proxy] Missing CHUTES_ENCRYPTION_KEY environment variable');
			return new Response(JSON.stringify({
				error: 'Server configuration error - missing encryption key'
			}), {
				status: 500,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}
		
		const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
		
		console.log('[AI Proxy] Fetching chutes_token for user:', userId);
		
		// Fetch encrypted Chutes token from database
		const { data: chutesData, error: chutesError } = await supabase
			.from('chutes_tokens')
			.select('*')
			.eq('user_id', userId)
			.single();
		
		if (chutesError) {
			console.error('[AI Proxy] Database error:', {
				error: chutesError.message,
				code: chutesError.code,
				details: chutesError.details,
				hint: chutesError.hint
			});
			return new Response(JSON.stringify({
				error: 'Database error while fetching Chutes token'
			}), {
				status: 500,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}
		
		if (!chutesData) {
			console.error('[AI Proxy] Chutes token not found for user:', userId);
			return new Response(JSON.stringify({
				error: 'Chutes account not linked. Please link your Chutes account first.'
			}), {
				status: 403,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}
		
		console.log('[AI Proxy] Chutes token data found:', {
			hasEncryptedToken: !!chutesData.encrypted_access_token,
			encryptedTokenLength: chutesData.encrypted_access_token?.length,
			encryptedTokenPreview: chutesData.encrypted_accessToken?.substring(0, 20),
			hasIv: !!chutesData.encryption_iv,
			ivLength: chutesData.encryption_iv?.length,
			ivValue: chutesData.encryption_iv ? `"${chutesData.encryption_iv}"` : 'null/empty',
			ivType: typeof chutesData.encryption_iv,
			allColumns: Object.keys(chutesData)
		});
		
		try {
			const decryptedToken = await decryptToken(
				chutesData.encrypted_access_token,
				chutesData.encryption_iv || '',
				encryptionKey
			);
			
			console.log('[AI Proxy] Token decryption successful');
			
			const aiBaseUrl = Deno.env.get('ai_base_url');
			if (!aiBaseUrl) {
				console.error('[AI Proxy] Missing ai_base_url environment variable');
				return new Response(JSON.stringify({
					error: 'Server configuration error'
				}), {
					status: 500,
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json'
					}
				});
			}
			
			const requestContext = {
				client: 'electron',
				timestamp: new Date().toISOString(),
				user_id: userId,
				user_email: userEmail
			};
			
			console.log('[AI Proxy] Processing request with context:', requestContext);
			
			const url = new URL(req.url);
			const pathname = url.pathname;
			
			if (req.method === 'POST' && (pathname.includes('/chat/completions') || pathname.endsWith('/ai-proxy'))) {
				return await handleChatCompletion(req, aiBaseUrl, decryptedToken, requestContext, corsHeaders);
			}
			
			if (req.method === 'GET' && (pathname.includes('/models') || pathname.includes('/v1/'))) {
				return await handleModelsList(aiBaseUrl, decryptedToken, requestContext, corsHeaders);
			}
			
			return new Response(JSON.stringify({
				error: 'Not found'
			}), {
				status: 404,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		} catch (decryptError) {
			console.error('[AI Proxy] Decryption failed:', decryptError);
			return new Response(JSON.stringify({
				error: 'Failed to decrypt Chutes token. Please re-link your Chutes account.'
			}), {
				status: 500,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}
	} catch (error) {
		console.error('[AI Proxy] Top-level error:', {
			error,
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		});
		return new Response(JSON.stringify({
			error: 'Internal server error'
		}), {
			status: 500,
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json'
			}
		});
	}
});

async function handleChatCompletion(req, aiBaseUrl, aiApiKey, requestContext, corsHeaders) {
	try {
		const requestBody = await req.json();
		console.log('[AI Proxy] Chat completion request:', {
			model: requestBody.model,
			stream: requestBody.stream,
			messageCount: requestBody.messages?.length,
			requestContext
		});
		
		const response = await fetch(`${aiBaseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${aiApiKey}`
			},
			body: JSON.stringify(requestBody)
		});
		
		if (!response.ok) {
			console.error('[AI Proxy] Chutes AI API error:', {
				status: response.status,
				statusText: response.statusText,
				requestContext
			});
			return new Response(JSON.stringify({
				error: `Chutes AI API error: ${response.status} ${response.statusText}`
			}), {
				status: response.status,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}
		
		if (requestBody.stream) {
			const reader = response.body?.getReader();
			const encoder = new TextEncoder();
			const decoder = new TextDecoder();
			const readableStream = new ReadableStream({
				async start(controller) {
					if (!reader) {
						controller.close();
						return;
					}
					try {
						while (true) {
							const { done, value } = await reader.read();
							if (done) break;
							const chunk = decoder.decode(value, {
								stream: true
							});
							controller.enqueue(encoder.encode(chunk));
						}
					} catch (error) {
						console.error('[AI Proxy] Streaming error:', error);
						controller.error(error);
					} finally {
						controller.close();
						reader.releaseLock();
					}
				}
			});
			return new Response(readableStream, {
				headers: {
					...corsHeaders,
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive'
				}
			});
		} else {
			const data = await response.json();
			console.log('[AI Proxy] Chat completion completed for Edlide client');
			return new Response(JSON.stringify(data), {
				status: 200,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}
	} catch (error) {
		console.error('[AI Proxy] Chat completion processing error:', error);
		return new Response(JSON.stringify({
			error: 'Failed to process chat completion'
		}), {
			status: 400,
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json'
			}
		});
	}
}

async function handleModelsList(aiBaseUrl, aiApiKey, requestContext, corsHeaders) {
	try {
		const response = await fetch(`${aiBaseUrl}/models`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${aiApiKey}`
			}
		});
		
		if (!response.ok) {
			return new Response(JSON.stringify({
				error: `Failed to fetch models: ${response.status}`
			}), {
				status: response.status,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}
		
		const data = await response.json();
		console.log('[AI Proxy] Models list retrieved for Edlide client');
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		console.error('[AI Proxy] Models fetch error:', error);
		return new Response(JSON.stringify({
			error: 'Failed to fetch models'
		}), {
			status: 500,
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json'
			}
		});
	}
}