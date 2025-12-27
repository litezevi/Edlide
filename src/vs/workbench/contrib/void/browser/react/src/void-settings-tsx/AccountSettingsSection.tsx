/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState, useEffect } from 'react';
import { useAccessor } from '../util/services.js';
import { VoidButtonBgDarken } from '../util/inputs.js';
import { Loader2, Check, X } from 'lucide-react';
import { URI } from '../../../../../../../base/common/uri.js';

export const AccountSettingsSection = () => {
	const accessor = useAccessor();
	const [isConnecting, setIsConnecting] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const [userEmail, setUserEmail] = useState<string | null>(null);

	const supabaseAuthService: any = accessor.get('ISupabaseAuthService');
	const openerService: any = accessor.get('IOpenerService');

	useEffect(() => {
		const checkAuthState = async () => {
			try {
				const authState = await supabaseAuthService.getAuthState();
				setIsConnected(authState.connected);
				setUserEmail(authState.user_email || null);
			} catch (error) {
				console.error('[AccountSettings] Error checking auth state:', error);
			}
		};
		checkAuthState();
	}, [supabaseAuthService]);

	const handleConnect = async () => {
		try {
			setIsConnecting(true);

			// Generate unique state_id for OAuth flow
			const stateId = crypto.randomUUID();
			console.log('[AccountSettings] Starting connection with state_id:', stateId);

			// Open browser with authorization URL
			const ideConnectUrl = `http://localhost:3000/ide-connect?state=${encodeURIComponent(stateId)}`;
			console.log('[AccountSettings] Opening browser:', ideConnectUrl);
			await openerService.open(URI.parse(ideConnectUrl), { openExternal: true });

			// Poll for tokens from website
			const pollTokens = async (attempts = 0): Promise<boolean> => {
				if (attempts >= 60) { // 2 minutes timeout
					console.error('[AccountSettings] Timeout after 60 attempts');
					return false;
				}

				try {
					console.log(`[AccountSettings] Polling attempt ${attempts + 1}/60...`);
					const response = await fetch(`http://localhost:3000/api/ide/tokens?state=${encodeURIComponent(stateId)}`);
					console.log('[AccountSettings] Response status:', response.status);

					const data = await response.json();
					console.log('[AccountSettings] Response data:', data);

					if (data.ready && data.tokens) {
						console.log('[AccountSettings] Tokens received, saving...', {
							user_email: data.tokens.user_email,
							user_id: data.tokens.user_id
						});

						// Save tokens securely
						await supabaseAuthService.saveTokens(data.tokens);
						setIsConnected(true);
						setUserEmail(data.tokens.user_email);
						console.log('[AccountSettings] Tokens saved successfully!');
						return true;
					}

					// Tokens not ready yet, wait 2 seconds
					console.log('[AccountSettings] Tokens not ready yet, waiting 2 seconds...');
					await new Promise(resolve => setTimeout(resolve, 2000));
					return pollTokens(attempts + 1);
				} catch (error) {
					console.error('[AccountSettings] Error polling tokens:', error);
					return false;
				}
			};

			const success = await pollTokens();
			if (!success) {
				console.error('[AccountSettings] Failed to get tokens after timeout');
			}
		} catch (error) {
			console.error('[AccountSettings] Connect error:', error);
		} finally {
			setIsConnecting(false);
		}
	};

	const handleDisconnect = async () => {
		try {
			await supabaseAuthService.removeTokens();
			setIsConnected(false);
			setUserEmail(null);
		} catch (error) {
			console.error('[AccountSettings] Disconnect error:', error);
		}
	};

	return (
		<div className='w-full'>
			<h4 className={`text-base mb-2`}>Account Settings</h4>

			<div className='my-2'>
				{isConnected ? (
					<div className='flex items-center justify-between p-3 bg-void-bg-2 rounded-lg border border-void-border-1'>
						<div>
							<span className='text-void-fg-1 font-medium block flex items-center gap-2'>
								<Check className='stroke-green-500 size-4' />
								Connected as {userEmail || 'Unknown'}
							</span>
							<span className='text-void-fg-2 text-sm'>
								Your Edlide account is synced
							</span>
						</div>
						<VoidButtonBgDarken
							className="bg-void-bg-3 text-void-fg-1 px-4 py-2 rounded-md hover:bg-void-bg-4"
							onClick={handleDisconnect}
						>
							Disconnect
						</VoidButtonBgDarken>
					</div>
				) : (
					<VoidButtonBgDarken
						className="bg-[#0e70c0] text-white px-4 py-2 rounded-md"
						onClick={handleConnect}
						disabled={isConnecting}
					>
						{isConnecting ? (
							<>
								<Loader2 className='size-4 animate-spin inline-block mr-2' />
								Connecting...
							</>
						) : (
							'Connect to your Account'
						)}
					</VoidButtonBgDarken>
				)}
			</div>
		</div>
	);
};