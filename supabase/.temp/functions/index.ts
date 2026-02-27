import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-edlide-client, x-user-id, x-user-email, x-chutes-api-key',
	'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', {
			headers: corsHeaders
		});
	}

	try {
		console.log('[AI Proxy] Received request:', {
			method: req.method,
			url: req.url
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
		const chutesApiKey = req.headers.get('x-chutes-api-key');

		console.log('[AI Proxy] User context:', { userId, userEmail, hasApiKey: !!chutesApiKey });

		if (!userId || !chutesApiKey) {
			console.error('[AI Proxy] Missing user ID or Chutes API key');
			return new Response(JSON.stringify({
				error: 'Missing required headers'
			}), {
				status: 400,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}

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
			return await handleChatCompletion(req, aiBaseUrl, chutesApiKey, requestContext, corsHeaders);
		}

		if (req.method === 'GET' && (pathname.includes('/models') || pathname.includes('/v1/'))) {
			return await handleModelsList(aiBaseUrl, chutesApiKey, requestContext, corsHeaders);
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
	} catch (error) {
		console.error('[AI Proxy] Error:', {
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
			console.log('[AI Proxy] Chat completion completed');
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
		console.log('[AI Proxy] Models list retrieved');
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
