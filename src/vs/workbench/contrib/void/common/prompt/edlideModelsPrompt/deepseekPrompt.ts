/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

export const DeepSeekPromptInstructions = {
	// Tool calling format guidelines for DeepSeek models
	toolCallXMLGuidelines: () => {
		return `\
    Tool calling details:
    - To call a tool, write its name and parameters in the XML format: <tool_name>parameters</tool_name>
    - After you write the tool call, you must STOP and WAIT for the result.
    - All parameters are REQUIRED unless noted otherwise.
    - You are only allowed to output ONE tool call, and it must be at the END of your response.
    - Your tool call will be executed immediately, and the results will appear in the following user message.
    - For MCP tools, always consult the tool's documentation first and follow the exact parameter format specified. Execute MCP tools with the same precision and care as built-in tools.`;
	},

	// Special instructions for DeepSeek models in chat system message
	getChatSystemMessageInstructions: () => {
		return `DEEPSEEK MODEL INSTRUCTIONS: Use ONLY standard XML format for tool calls: <tool_name>parameters</tool_name>. CRITICAL: Always return valid strings for tool parameters, NEVER return undefined, null, or objects. For edit_file tool, search_replace_blocks MUST be a string containing SEARCH/REPLACE blocks. For rewrite_file tool, new_content MUST be a string with file content.`;
	},

	// Special instructions for DeepSeek models in rewrite code scenarios
	getRewriteCodeInstructions: () => {
		return `
## DeepSeek Model Instructions
- Use standard XML format: <tool_name>parameters</tool_name>
- CRITICAL: Always return valid strings for all parameters, NEVER undefined, null, or objects
- For edit_file tool: search_replace_blocks MUST be a string with SEARCH/REPLACE blocks
- For rewrite_file tool: new_content MUST be a string containing complete file content`;
	},

	// Special instructions for DeepSeek models in quick edit scenarios
	getQuickEditInstructions: () => {
		return `
## DeepSeek Model Instructions
- Use standard XML format: <tool_name>parameters</tool_name>
- CRITICAL: Always return valid strings for all parameters, NEVER undefined, null, or objects
- For edit_file tool: search_replace_blocks MUST be a string with SEARCH/REPLACE blocks
- For rewrite_file tool: new_content MUST be a string containing complete file content`;
	},

	// Helper function to detect if model is DeepSeek
	isDeepSeekModel: (modelName?: string) => {
		return modelName?.includes('DeepSeek') || modelName?.includes('deepseek-ai');
	}
};