/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/


// register inline diffs
import './editCodeService.js'

// register Sidebar pane, state, actions (keybinds, menus) (Ctrl+L)
import './sidebarActions.js'
import './sidebarPane.js'

// register quick edit (Ctrl+K)
import './quickEditActions.js'


// register Autocomplete
import './autocompleteService.js'

// register Context services
// import './contextGatheringService.js'
// import './contextUserChangesService.js'

// settings pane
import './voidSettingsPane.js'

// register css
import './media/void.css'

// update (frontend part, also see platform/)
import './voidUpdateActions.js'

import './convertToLLMMessageWorkbenchContrib.js'

// tools
import './toolsService.js'
import './terminalToolService.js'

// register Thread History
import './chatThreadService.js'

// register Compacting service
import './compactingService.js'

// ping
import './metricsPollService.js'

// helper services
import './helperServices/consistentItemService.js'

// register selection helper
import './voidSelectionHelperWidget.js'

// register tooltip service
import './tooltipService.js'

// register onboarding service
import './voidOnboardingService.js'

// register misc service
import './miscWokrbenchContrib.js'

// register file service (for explorer context menu)
import './fileService.js'

// register source control management
import './voidSCMService.js'

// register Supabase authentication service
import './interfaces/supabaseAuthService.js'
import './supabaseAuthService.js'
import { ISupabaseAuthService } from './interfaces/supabaseAuthService.js';
import { SupabaseAuthHelper } from '../common/supabaseAuthHelper.js';

// Start auto-refresh for existing tokens on IDE startup
console.log('[void.contribution] ===== INITIALIZING SUPABASE AUTH =====');
setTimeout(() => {
	console.log('[void.contribution] 🔍 Timeout fired, checking container...');
	const container = (window as any).__edlideServiceContainer;
	console.log('[void.contribution] Container exists:', !!container);

	if (container) {
		try {
			console.log('[void.contribution] 📦 Getting ISupabaseAuthService...');
			const authService = container.get(ISupabaseAuthService);
			console.log('[void.contribution] AuthService exists:', !!authService);

			if (authService) {
				console.log('[void.contribution] 🚀 Initializing tokens...');
				console.log('[void.contribution] ⏱️ Current time:', new Date().toISOString());

				// Load tokens into cache on startup
				authService.getOrRefreshToken().then((token: string | null) => {
					console.log('[void.contribution] ✅ Token result:', token ? 'FOUND' : 'NULL');

					// Check cache state
					const cachedToken = SupabaseAuthHelper.getAccessTokenSync();
					console.log('[void.contribution] 🎯 Cache state:', cachedToken ? 'POPULATED' : 'EMPTY');
					console.log('[void.contribution] ⏱️ Token loaded at:', new Date().toISOString());
				}).catch((e: Error) => {
					console.error('[void.contribution] ❌ getOrRefreshToken error:', e);
				});

				// Start auto-refresh timer
				authService.startAutoRefresh();
				console.log('[void.contribution] ⏰ Auto-refresh timer started');
			} else {
				console.error('[void.contribution] ❌ AuthService is null!');
			}
		} catch (e: unknown) {
			console.log('[void.contribution] ❌ Could not start auto-refresh:', e);
		}
	} else {
		console.error('[void.contribution] ❌ Container not found!');
	}
}, 5000); // Increased to 5 seconds to ensure all services are ready

// ---------- common (unclear if these actually need to be imported, because they're already imported wherever they're used) ----------

// llmMessage
import '../common/sendLLMMessageService.js'

// voidSettings
import '../common/voidSettingsService.js'

// refreshModel
import '../common/refreshModelService.js'

// metrics
import '../common/metricsService.js'

// updates
import '../common/voidUpdateService.js'

// model service
import '../common/voidModelService.js'
