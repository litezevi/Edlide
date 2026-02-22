import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function addCorsHeaders(response: NextResponse) {
	response.headers.set("Access-Control-Allow-Origin", "*");
	response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
	response.headers.set(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization",
	);
	return response;
}

function generateApiKey(): string {
	return `edlide_${randomBytes(32).toString("hex")}`;
}

export async function POST(request: NextRequest) {
	try {
		const authHeader = request.headers.get("Authorization");
		if (!authHeader) {
			return addCorsHeaders(
				NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
			);
		}

		const body = await request.json().catch(() => ({}));
		const stateId: string | undefined = body.state_id;

		const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
		const accessToken = authHeader.substring(7);

		const {
			data: { user },
			error: userError,
		} = await adminSupabase.auth.getUser(accessToken);

		if (userError || !user) {
			console.log(
				"[CLI Create API Key] Invalid access token:",
				userError?.message,
			);
			return addCorsHeaders(
				NextResponse.json({ error: "Invalid token" }, { status: 401 }),
			);
		}

		const apiKey = generateApiKey();
		const expiresAt = new Date(
			Date.now() + 30 * 24 * 60 * 60 * 1000,
		).toISOString();

		console.log("[CLI Create API Key] Creating CLI key for user:", user.id);

		const { error: upsertError } = await adminSupabase
			.from("user_sessions")
			.upsert(
				{
					user_id: user.id,
					user_email: user.email ?? null,
					cli_api_key: apiKey,
					cli_api_key_expires_at: expiresAt,
					status: "active",
					updated_at: new Date().toISOString(),
				},
				{ onConflict: "user_id", ignoreDuplicates: false },
			);

		if (upsertError) {
			console.error("[CLI Create API Key] Upsert error:", upsertError);
			return addCorsHeaders(
				NextResponse.json(
					{ error: "Failed to create API key" },
					{ status: 500 },
				),
			);
		}

		// Insert into cli_pending_tokens so CLI can poll and retrieve the key
		if (stateId) {
			const { error: insertError } = await adminSupabase
				.from("cli_pending_tokens")
				.insert({
					state_id: stateId,
					access_token: apiKey,
					refresh_token: apiKey,
					expires_at: expiresAt,
					user_id: user.id,
					user_email: user.email ?? "",
				});

			if (insertError) {
				console.error(
					"[CLI Create API Key] Failed to insert pending token:",
					insertError,
				);
				return addCorsHeaders(
					NextResponse.json(
						{ error: "Failed to save pending token" },
						{ status: 500 },
					),
				);
			}
		}

		console.log(
			"[CLI Create API Key] Key created successfully for user:",
			user.id,
		);

		return addCorsHeaders(
			NextResponse.json({
				success: true,
				api_key: apiKey,
				expires_at: expiresAt,
				user_id: user.id,
				user_email: user.email ?? null,
			}),
		);
	} catch (error: any) {
		console.error("[CLI Create API Key] Error:", error);
		return addCorsHeaders(
			NextResponse.json({ error: "Internal server error" }, { status: 500 }),
		);
	}
}

export async function OPTIONS() {
	return addCorsHeaders(new NextResponse(null, { status: 200 }));
}
