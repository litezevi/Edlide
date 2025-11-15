import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const corsHeaders = {
	'Access-Control-Allow-Origin': 'app://localhost',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-edlide-client',
	'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};
Deno.serve(async (req) => {
	// Handle CORS preflight
	if (req.method === 'OPTIONS') {
		return new Response('ok', {
			headers: corsHeaders
		});
	}
	try {
		// Verify Edlide client
		const edlideClient = req.headers.get('x-edlide-client');
		if (edlideClient !== 'electron') {
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
		// Get secrets from environment
		const aiBaseUrl = Deno.env.get('ai_base_url');
		const aiApiKey = Deno.env.get('ai_api_key');
		if (!aiBaseUrl || !aiApiKey) {
			console.error('Missing secrets: ai_base_url or ai_api_key');
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
		// Verify Supabase anon key (simpler approach)
		const authHeader = req.headers.get('authorization');
		const expectedAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiYnp2aWpra3JyanFnY2Z0bnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTM0MzksImV4cCI6MjA3ODc2OTQzOX0.t-FOS0UQfO9Zsq75sEolVpOoYJS-UyDojMVa83OHBms';
		if (!authHeader || !authHeader.includes(expectedAnonKey)) {
			console.error('Invalid or missing authorization header');
			return new Response(JSON.stringify({
				error: 'Invalid authorization token'
			}), {
				status: 401,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}
		// Create simple request context
		const requestContext = {
			client: 'electron',
			timestamp: new Date().toISOString()
		};
		console.log('Request from Edlide client:', requestContext);
		// Extract path and handle routing
		const url = new URL(req.url);
		const pathname = url.pathname;
		// Chat completions endpoint
		if (req.method === 'POST' && (pathname.includes('/chat/completions') || pathname.endsWith('/ai-proxy'))) {
			return await handleChatCompletion(req, aiBaseUrl, aiApiKey, requestContext, corsHeaders);
		}
		// Models list endpoint
		if (req.method === 'GET' && (pathname.includes('/models') || pathname.includes('/v1/'))) {
			return await handleModelsList(aiBaseUrl, aiApiKey, requestContext, corsHeaders);
		}
		// Return 404 for other endpoints
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
		console.error('Unexpected error:', error);
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
		// Add request context metadata (not to AI)
		console.log('Chat completion request:', {
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
			console.error('Chutes AI API error:', {
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
		// Handle streaming responses
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
						console.error('Streaming error:', error);
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
			// Handle non-streaming responses
			const data = await response.json();
			console.log('Chat completion completed for Edlide client');
			return new Response(JSON.stringify(data), {
				status: 200,
				headers: {
					...corsHeaders,
					'Content-Type': 'application/json'
				}
			});
		}
	} catch (error) {
		console.error('Chat completion processing error:', error);
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
		console.log('Models list retrieved for Edlide client');
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: {
				...corsHeaders,
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		console.error('Models fetch error:', error);
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
