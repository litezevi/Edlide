import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_KEY_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

function addCorsHeaders(response: NextResponse) {
	response.headers.set("Access-Control-Allow-Origin", "*");
	response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
	response.headers.set(
		"Access-Control-Allow-Headers",
		"Content-Type, X-API-Key",
	);
	return response;
}

export async function POST(request: NextRequest) {
	try {
		const apiKey = request.headers.get("X-API-Key");

		if (!apiKey || !apiKey.startsWith("edlide_")) {
			return addCorsHeaders(
				NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
			);
		}

		const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

		const { data: session, error: sessionError } = await adminSupabase
			.from("user_sessions")
			.select("user_id, user_email, cli_api_key_expires_at, status")
			.eq("cli_api_key", apiKey)
			.eq("status", "active")
			.single();

		if (sessionError || !session) {
			console.log("[CLI Get Access Token] Invalid or revoked key");
			return addCorsHeaders(
				NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
			);
		}

		if (
			session.cli_api_key_expires_at &&
			new Date(session.cli_api_key_expires_at) < new Date()
		) {
			return addCorsHeaders(
				NextResponse.json(
					{
						error: "API key expired",
						code: "RECONNECT_REQUIRED",
					},
					{ status: 401 },
				),
			);
		}

		// Verify user still exists
		const { data: userData, error: userError } =
			await adminSupabase.auth.admin.getUserById(session.user_id);
		if (userError || !userData?.user) {
			await adminSupabase
				.from("user_sessions")
				.update({ status: "revoked", updated_at: new Date().toISOString() })
				.eq("cli_api_key", apiKey);
			return addCorsHeaders(
				NextResponse.json({ error: "User not found" }, { status: 401 }),
			);
		}

		const newExpiresAt = new Date(
			Date.now() + API_KEY_LIFETIME_MS,
		).toISOString();

		await adminSupabase
			.from("user_sessions")
			.update({
				cli_api_key_expires_at: newExpiresAt,
				updated_at: new Date().toISOString(),
			})
			.eq("cli_api_key", apiKey);

		return addCorsHeaders(
			NextResponse.json({
				success: true,
				tokens: {
					access_token: apiKey,
					refresh_token: apiKey,
					expires_at: newExpiresAt,
					user_id: session.user_id,
					user_email: session.user_email,
				},
			}),
		);
	} catch (error: any) {
		console.error("[CLI Get Access Token] Error:", error);
		return addCorsHeaders(
			NextResponse.json({ error: "Internal server error" }, { status: 500 }),
		);
	}
}

export async function OPTIONS() {
	return addCorsHeaders(new NextResponse(null, { status: 200 }));
}
