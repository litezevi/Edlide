import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function addCorsHeaders(response: NextResponse) {
	response.headers.set("Access-Control-Allow-Origin", "*");
	response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
	response.headers.set(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization",
	);
	return response;
}

// GET /api/cli/tokens?state={state_id}
export async function GET(request: NextRequest) {
	try {
		const stateId = request.nextUrl.searchParams.get("state");

		if (!stateId) {
			return addCorsHeaders(
				NextResponse.json(
					{ error: "Missing state parameter" },
					{ status: 400 },
				),
			);
		}

		const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

		// Clean up expired tokens
		await adminSupabase
			.from("cli_pending_tokens")
			.delete()
			.lt("expires_at", new Date().toISOString());

		const { data, error } = await adminSupabase
			.from("cli_pending_tokens")
			.select("*")
			.eq("state_id", stateId)
			.single();

		if (error || !data) {
			return addCorsHeaders(
				NextResponse.json({ ready: false }, { status: 404 }),
			);
		}

		// Delete after retrieval — one-time use
		await adminSupabase
			.from("cli_pending_tokens")
			.delete()
			.eq("state_id", stateId);

		return addCorsHeaders(
			NextResponse.json({
				ready: true,
				tokens: {
					access_token: data.access_token,
					refresh_token: data.refresh_token,
					expires_at: data.expires_at,
					user_id: data.user_id,
					user_email: data.user_email,
				},
			}),
		);
	} catch (error: any) {
		console.error("[CLI Tokens] Error:", error);
		return addCorsHeaders(
			NextResponse.json({ error: "Internal server error" }, { status: 500 }),
		);
	}
}

export async function OPTIONS() {
	return addCorsHeaders(new NextResponse(null, { status: 200 }));
}
