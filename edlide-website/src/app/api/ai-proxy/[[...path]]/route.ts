import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TokenEncryption } from "@/lib/token-encryption";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Request limits per plan tier (per day)
const TIER_REQUEST_LIMITS: Record<string, number> = {
	base: 300,
	plus: 2000,
	pro: 5000,
};

// Get today's date in UTC as YYYY-MM-DD
function getTodayUTC(): string {
	const now = new Date();
	return now.toISOString().split("T")[0];
}

export async function POST(request: NextRequest) {
	try {
		// 1. Получаем токен из Authorization header
		const authHeader = request.headers.get("Authorization");
		const apiKeyHeader = request.headers.get("X-API-Key");

		if (!authHeader && !apiKeyHeader) {
			return NextResponse.json(
				{ error: "Missing authentication" },
				{ status: 401 },
			);
		}

		let user: any = null;

		// Helper function to authenticate via API key (IDE or CLI)
		const authenticateViaApiKey = async (key: string) => {
			console.log(
				"[AI Proxy] Authenticating via API key:",
				key.substring(0, 20) + "...",
			);
			const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

			// Try IDE api_key first
			let sessionData: {
				user_id: string;
				user_email: string;
				status: string;
			} | null = null;

			const { data: ideSession, error: ideError } = await adminSupabase
				.from("user_sessions")
				.select("user_id, user_email, status")
				.eq("api_key", key)
				.eq("is_ide_device", true)
				.eq("status", "active")
				.maybeSingle();

			if (!ideError && ideSession) {
				sessionData = ideSession;
			} else {
				// Try CLI cli_api_key
				const { data: cliSession, error: cliError } = await adminSupabase
					.from("user_sessions")
					.select("user_id, user_email, status")
					.eq("cli_api_key", key)
					.eq("status", "active")
					.maybeSingle();

				if (!cliError && cliSession) {
					sessionData = cliSession;
				}
			}

			if (!sessionData) {
				console.error("[AI Proxy] API key not found in database");
				return null;
			}

			const { data: userData } = await adminSupabase.auth.admin.getUserById(
				sessionData.user_id,
			);
			if (!userData?.user) {
				console.error("[AI Proxy] User not found for API key");
				return null;
			}

			console.log("[AI Proxy] User authenticated via API key:", {
				user_id: userData.user.id,
				email: userData.user.email,
			});
			return userData.user;
		};

		// 2. Проверяем API key или JWT токен
		console.log("[AI Proxy] Auth check:", {
			authHeader: authHeader?.substring(0, 30) + "...",
			apiKeyHeader: apiKeyHeader?.substring(0, 30) + "...",
		});

		if (authHeader?.startsWith("Bearer edlide_")) {
			// Authorization: Bearer edlide_xxx... -> API key
			const apiKey = authHeader.substring(7);
			user = await authenticateViaApiKey(apiKey);
			if (!user) {
				return NextResponse.json(
					{
						error:
							"Invalid or expired token. Please connect to your Edlide account.",
					},
					{ status: 401 },
				);
			}
		} else if (apiKeyHeader) {
			// X-API-Key: edlide_xxx... -> API key
			user = await authenticateViaApiKey(apiKeyHeader);
			if (!user) {
				return NextResponse.json(
					{
						error:
							"Invalid or expired token. Please connect to your Edlide account.",
					},
					{ status: 401 },
				);
			}
		} else if (authHeader?.startsWith("Bearer ")) {
			// Authorization: Bearer jwt_xxx... -> JWT токен
			const userToken = authHeader.substring(7);
			const supabase = createClient(
				supabaseUrl,
				process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			);
			const {
				data: { user: jwtUser },
				error: userError,
			} = await supabase.auth.getUser(userToken);

			if (userError || !jwtUser) {
				console.error("[AI Proxy] Invalid JWT token:", userError?.message);
				return NextResponse.json(
					{
						error:
							"Invalid or expired token. Please connect to your Edlide account.",
					},
					{ status: 401 },
				);
			}

			user = jwtUser;
			console.log("[AI Proxy] User authenticated via JWT:", {
				user_id: user.id,
				email: user.email,
			});
		} else {
			return NextResponse.json(
				{ error: "Missing or invalid authentication" },
				{ status: 401 },
			);
		}

		// 3. Получаем зашифрованный Chutes API ключ из подписки
		console.log(
			"[AI Proxy] Getting encrypted Chutes API key from subscription...",
		);
		const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

		const { data: subscription, error: subError } = await adminSupabase
			.from("subscriptions")
			.select("chutes_api_key_encrypted, chutes_api_key_iv, plan_tier")
			.eq("user_id", user.id)
			.eq("status", "active")
			.single();

		if (subError || !subscription?.chutes_api_key_encrypted) {
			console.error("[AI Proxy] No active subscription for user:", user.id);
			return NextResponse.json(
				{
					error: "No active subscription. Please subscribe to use AI features.",
				},
				{ status: 403 },
			);
		}

		const chutesApiKey = TokenEncryption.decrypt(
			subscription.chutes_api_key_encrypted,
			subscription.chutes_api_key_iv,
		);

		if (!chutesApiKey) {
			console.error(
				"[AI Proxy] Failed to decrypt Chutes API key for user:",
				user.id,
			);
			return NextResponse.json(
				{ error: "Failed to decrypt API key. Please contact support." },
				{ status: 500 },
			);
		}

		const planTier = subscription.plan_tier;
		console.log(`[AI Proxy] Using Chutes API key for plan: ${planTier}`);

		// 3.5 Check daily request limit BEFORE making the AI call
		const dailyLimit = TIER_REQUEST_LIMITS[planTier] || 300;
		const todayUTC = getTodayUTC();

		const { data: usageData } = await adminSupabase
			.from("request_usage")
			.select("request_count")
			.eq("user_id", user.id)
			.eq("request_date", todayUTC)
			.maybeSingle();

		const currentUsage = usageData?.request_count || 0;

		if (currentUsage >= dailyLimit) {
			console.log(
				`[AI Proxy] Daily limit reached for user ${user.id}: ${currentUsage}/${dailyLimit}`,
			);
			return NextResponse.json(
				{
					error: `Daily request limit reached (${currentUsage}/${dailyLimit}). Resets at 00:00 UTC.`,
					code: "DAILY_LIMIT_REACHED",
					usage: { used: currentUsage, limit: dailyLimit },
				},
				{ status: 429 },
			);
		}

		// 4. Получаем тело запроса от IDE (OpenAI-compatible формат)
		const requestBody = await request.json();

		// 5. Логирование запроса
		console.log("[AI Proxy] AI request from user:", {
			user_id: user.id,
			model: requestBody.model,
			provider: "edlide",
			plan: planTier,
		});

		// 6. Increment request counter BEFORE making the AI call
		try {
			const { data: newCount } = await adminSupabase.rpc(
				"increment_request_count",
				{
					p_user_id: user.id,
					p_date: todayUTC,
				},
			);
			console.log(
				`[AI Proxy] Request count incremented for user ${user.id}: ${newCount}/${dailyLimit}`,
			);
		} catch (incrementError) {
			console.error(
				"[AI Proxy] Failed to increment request count:",
				incrementError,
			);
		}

		// 7. Проксируем напрямую к Chutes.ai API (без Supabase Edge Function)
		// Убираем лишний хоп через Supabase EF — он вызывал shutdown/stream truncation
		const chutesBaseUrl = process.env.CHUTES_BASE_URL;
		if (!chutesBaseUrl) {
			console.error("[AI Proxy] Missing CHUTES_BASE_URL environment variable");
			return NextResponse.json(
				{ error: "Server configuration error" },
				{ status: 500 },
			);
		}

		const response = await fetch(`${chutesBaseUrl}/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${chutesApiKey}`,
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("[AI Proxy] Chutes AI API error:", {
				status: response.status,
				error: errorText,
				user_id: user.id,
			});

			return NextResponse.json(
				{ error: "AI service error. Please try again later." },
				{ status: response.status },
			);
		}

		// 8. Возвращаем ответ — passthrough body напрямую от Chutes.ai
		const responseHeaders = new Headers();
		const isStreaming = requestBody.stream === true;
		if (isStreaming) {
			responseHeaders.set("Content-Type", "text/event-stream");
			responseHeaders.set("Cache-Control", "no-cache, no-transform");
			responseHeaders.set("Connection", "keep-alive");
			responseHeaders.set("X-Accel-Buffering", "no");
		} else {
			responseHeaders.set("Content-Type", "application/json");
		}
		responseHeaders.set("x-edlide-proxy", "v2");

		return new NextResponse(response.body, {
			status: response.status,
			headers: responseHeaders,
		});
	} catch (error) {
		console.error("[AI Proxy] Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function OPTIONS() {
	const response = new NextResponse(null, { status: 200 });
	response.headers.set("Access-Control-Allow-Origin", "*");
	response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
	response.headers.set(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization",
	);
	return response;
}
