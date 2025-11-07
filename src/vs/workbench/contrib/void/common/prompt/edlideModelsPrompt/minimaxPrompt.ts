/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

export const MiniMaxPromptInstructions = {
	// Tool calling format guidelines for MiniMax models
	toolCallXMLGuidelines: () => {
		return `\
    MiniMax-M2 Tool Calling Format:
    - CRITICAL: Use ONLY the MiniMax-specific XML format: <minimax:tool_call> with <invoke> tags
    - NEVER use standard <tool_name> format or [TOOL_CALL] format
    - After you write the tool call, you must STOP and WAIT for the result
    - All parameters are REQUIRED unless noted otherwise
    - You are only allowed to output ONE tool call, and it must be at the END of your response
    - Your tool call will be executed immediately, and the results will appear in the following user message
    - For MCP tools, always consult the tool's documentation first and follow the exact parameter format specified
    
    FORBIDDEN FORMATS (NEVER USE):
    - [TOOL_CALL] {tool => "...", args => {...}} [/TOOL_CALL]
    - <tool_name>...</tool_name>
    - Any bracket-based tool calling format
    
    MINIMAX-SPECIFIC REQUIRED FORMAT:
    <minimax:tool_call>
    <invoke name="tool_name">
    <parameter name="param_name">param_value</parameter>
    <parameter name="param2_name">param2_value</parameter>
    </invoke>
    </minimax:tool_call>
    
    CRITICAL: MiniMax-M2 requires <minimax:tool_call> wrapper!`;
	},

	// Special instructions for MiniMax models in chat system message
	getChatSystemMessageInstructions: () => {
		return `MINIMAX-M2 MODEL INSTRUCTIONS: You MUST use <minimax:tool_call><invoke name="tool_name"> format. NEVER use [TOOL_CALL] or <tool_name> formats. CRITICAL: Always return valid strings for tool parameters, NEVER return undefined, null, or objects. For edit_file tool, search_replace_blocks MUST be a string containing SEARCH/REPLACE blocks. For rewrite_file tool, new_content MUST be a string with file content. Always complete your tool calls with proper closing tags.`;
	},

	// Special instructions for MiniMax models in rewrite code scenarios
	getRewriteCodeInstructions: () => {
		return `
## MiniMax-M2 Model Instructions
- CRITICAL: Use <minimax:tool_call><invoke name="tool_name"> format for any tool calls
- NEVER use [TOOL_CALL] format or <tool_name> format
- ALWAYS return valid strings for all parameters, NEVER undefined, null, or objects
- For edit_file tool: search_replace_blocks MUST be a string with SEARCH/REPLACE blocks
- For rewrite_file tool: new_content MUST be a string containing complete file content
- Always complete tool calls with </invoke></minimax:tool_call> closing tags
- Always respond with the actual file content, not tool call formats`;
	},

	// Special instructions for MiniMax models in quick edit scenarios
	getQuickEditInstructions: () => {
		return `
## MiniMax-M2 Model Instructions
- CRITICAL: Never use [TOOL_CALL] or <tool_name> format for any responses
- ALWAYS return valid strings for all parameters, NEVER undefined, null, or objects
- For edit_file tool: search_replace_blocks MUST be a string with SEARCH/REPLACE blocks
- For rewrite_file tool: new_content MUST be a string containing complete file content
- Always provide direct code output in the specified format
- Use only <minimax:tool_call><invoke> structure when making tool calls`;
	},

	// Helper function to detect if model is MiniMax
	isMiniMaxModel: (modelName?: string) => {
		return modelName?.includes('MiniMax') || modelName?.includes('MiniMaxAI');
	}
};