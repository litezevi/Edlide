/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

export const MiniMaxPromptInstructions = {
	// Tool calling format guidelines for MiniMax models
	toolCallXMLGuidelines: () => {
		return `\
    MiniMax Tool Calling Format:
    - CRITICAL: Use ONLY the XML format shown below. NEVER use [TOOL_CALL] format.
    - To call a tool, write its name and parameters in the XML formats specified above.
    - After you write the tool call, you must STOP and WAIT for the result.
    - All parameters are REQUIRED unless noted otherwise.
    - You are only allowed to output ONE tool call, and it must be at the END of your response.
    - Your tool call will be executed immediately, and the results will appear in the following user message.
    - For MCP tools, always consult the tool's documentation first and follow the exact parameter format specified.
    
    FORBIDDEN FORMATS (NEVER USE):
    - [TOOL_CALL] {tool => "...", args => {...}} [/TOOL_CALL]
    - Any bracket-based tool calling format
    
    REQUIRED FORMAT:
    <tool_name>
    <parameter>value</parameter>
    </tool_name>`;
	},

	// Special instructions for MiniMax models in chat system message
	getChatSystemMessageInstructions: () => {
		return `MINIMAX MODEL INSTRUCTIONS: You MUST use XML format for tool calls. NEVER use [TOOL_CALL] format. Always use <tool_name> with XML tags, never bracket-based formats.`;
	},

	// Special instructions for MiniMax models in rewrite code scenarios
	getRewriteCodeInstructions: () => {
		return `
## MiniMax Model Instructions
- CRITICAL: Use XML format for any tool calls, NEVER use [TOOL_CALL] format
- Always respond with the actual file content, not tool call formats`;
	},

	// Special instructions for MiniMax models in quick edit scenarios
	getQuickEditInstructions: () => {
		return `
## MiniMax Model Instructions
- CRITICAL: Never use [TOOL_CALL] format for any responses
- Always provide direct code output in the specified format`;
	},

	// Helper function to detect if model is MiniMax
	isMiniMaxModel: (modelName?: string) => {
		return modelName?.includes('MiniMax') || modelName?.includes('MiniMaxAI');
	}
};