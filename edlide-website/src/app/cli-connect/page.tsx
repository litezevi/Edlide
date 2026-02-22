"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { SupabaseSignInForm } from "@/components/auth/supabase-signin-button";

export default function CLIConnectPage() {
	const [loading, setLoading] = useState(true);
	const [session, setSession] = useState<any>(null);
	const [inserted, setInserted] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const connectingRef = useRef(false);
	const stateRef = useRef<string | null>(null);

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const state = urlParams.get("state");
		stateRef.current = state;

		if (!state) {
			setError("No state parameter provided");
			setLoading(false);
			return;
		}

		const doConnect = async (s: any) => {
			if (connectingRef.current) return;
			connectingRef.current = true;

			try {
				// create-api-key also inserts into cli_pending_tokens using service role
				const response = await fetch("/api/cli/create-api-key", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${s.access_token}`,
					},
					body: JSON.stringify({ state_id: stateRef.current }),
				});

				const data = await response.json();

				if (!response.ok || !data.success) {
					setError(`Failed: ${data.error || "Unknown error"}`);
					setLoading(false);
					connectingRef.current = false;
					return;
				}

				setInserted(true);
				setTimeout(() => window.close(), 1000);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Connection failed");
				setLoading(false);
				connectingRef.current = false;
			}
		};

		const initAuth = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			setSession(session);
			setLoading(false);

			if (session && state && !connectingRef.current) {
				doConnect(session);
			}
		};

		initAuth();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			if (
				event === "SIGNED_IN" &&
				session &&
				stateRef.current &&
				!connectingRef.current &&
				!inserted
			) {
				setSession(session);
				setLoading(false);
				doConnect(session);
			}
		});

		return () => subscription.unsubscribe();
	}, []);

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<Card className="w-full max-w-md bg-card">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl text-red-500">
							Connection Failed
						</CardTitle>
						<CardDescription>{error}</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						<Button
							onClick={() => {
								connectingRef.current = false;
								setError(null);
								setLoading(true);
								window.location.reload();
							}}
							className="w-full"
						>
							Try Again
						</Button>
						<Button
							onClick={() => window.close()}
							variant="outline"
							className="w-full"
						>
							Close Window
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (inserted) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<Card className="p-8 max-w-md w-full text-center bg-card">
					<h1 className="text-2xl font-bold text-foreground mb-4">
						Connected Successfully!
					</h1>
					<p className="text-muted-foreground">
						You can close this window and return to the terminal.
					</p>
				</Card>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<Card className="p-8 max-w-md w-full text-center bg-card">
					<p className="text-muted-foreground">Connecting...</p>
				</Card>
			</div>
		);
	}

	if (!session) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<Card className="w-full max-w-md bg-card">
					<CardHeader className="text-center pb-2">
						<CardTitle className="text-2xl">Sign In Required</CardTitle>
						<CardDescription>
							Sign in to connect your Edlide account with the CLI
						</CardDescription>
					</CardHeader>
					<CardContent>
						<SupabaseSignInForm />
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<Card className="p-8 max-w-md w-full bg-card">
				<h1 className="text-2xl font-bold text-foreground mb-2">
					Authorize Edlide CLI
				</h1>
				<p className="text-muted-foreground mb-6">{session.user?.email}</p>
				<Button
					onClick={async () => {
						if (connectingRef.current) return;
						connectingRef.current = true;

						const response = await fetch("/api/cli/create-api-key", {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${session.access_token}`,
							},
							body: JSON.stringify({ state_id: stateRef.current }),
						});

						const data = await response.json();

						if (!response.ok || !data.success) {
							setError(`Failed: ${data.error || "Unknown error"}`);
							connectingRef.current = false;
							return;
						}

						setInserted(true);
						setTimeout(() => window.close(), 1000);
					}}
					className="w-full"
				>
					Authorize
				</Button>
				<Button
					onClick={() => window.close()}
					variant="outline"
					className="w-full mt-4"
				>
					Cancel
				</Button>
			</Card>
		</div>
	);
}
