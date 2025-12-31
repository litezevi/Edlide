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
	const container = (window as any).__edlideServiceContainer;
	if (container) {
		try {
			const authService = container.get(ISupabaseAuthService);
			if (authService) {
				// Tokens are already loaded in constructor via Eager instantiation
				const token = SupabaseAuthHelper.getAccessTokenSync();
				console.log('[void.contribution] ✅ Auth ready:', token ? 'token loaded' : 'no token');

				// Start auto-refresh timer
				authService.startAutoRefresh();
				console.log('[void.contribution] ⏰ Auto-refresh timer started');
			}
		} catch (e) {
			console.warn('[void.contribution] Could not start auth:', e);
		}
	}
}, 100); // Short delay to let services initialize

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
