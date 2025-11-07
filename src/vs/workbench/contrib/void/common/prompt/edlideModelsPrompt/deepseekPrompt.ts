/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

export const DeepSeekPromptInstructions = {
	// Tool calling format guidelines for DeepSeek models
	toolCallXMLGuidelines: () => {
		return `\
    DeepSeek Tool Calling Format:
    - Use standard OpenAI-compatible function calling format
    - DeepSeek supports strict mode with JSON Schema validation
    - To call a tool, use standard function calling with proper JSON parameters
    - After writing the tool call, STOP and WAIT for the result
    - All parameters are REQUIRED unless noted otherwise
    - You are only allowed to output ONE tool call, and it must be at the END of your response
    - Your tool call will be executed immediately, and results will appear in the following user message
    - For MCP tools, consult the tool's documentation first and follow exact parameter format
    
    DEEPSEEK-SPECIFIC FORMAT:
    Use standard OpenAI function calling format with JSON parameters
    DeepSeek supports strict mode for enhanced parameter validation
    
    CRITICAL: Ensure all JSON parameters are valid and properly typed`;
	},

	// Special instructions for DeepSeek models in chat system message
	getChatSystemMessageInstructions: () => {
		return `DEEPSEEK MODEL INSTRUCTIONS: Use standard OpenAI function calling format. CRITICAL: Always return valid strings for tool parameters, NEVER return undefined, null, or objects. For edit_file tool, search_replace_blocks MUST be a string containing SEARCH/REPLACE blocks. For rewrite_file tool, new_content MUST be a string with file content. DeepSeek supports strict mode - ensure JSON Schema compliance. Provide precise, analytical responses with strong reasoning capabilities. Focus on efficient problem-solving and optimal code solutions.`;
	},

	// Special instructions for DeepSeek models in rewrite code scenarios
	getRewriteCodeInstructions: () => {
		return `
## DeepSeek Model Instructions
- Use standard OpenAI function calling format for any tool calls
- DeepSeek supports strict mode - ensure JSON Schema compliance
- ALWAYS return valid strings for all parameters, NEVER undefined, null, or objects
- For edit_file tool: search_replace_blocks MUST be a string with SEARCH/REPLACE blocks
- For rewrite_file tool: new_content MUST be a string containing complete file content
- Apply analytical approach to code transformations
- Focus on optimization and efficiency in code changes
- Ensure all function parameters match JSON Schema requirements`;
	},

	// Special instructions for DeepSeek models in quick edit scenarios
	getQuickEditInstructions: () => {
		return `
## DeepSeek Model Instructions
- Provide analytically sound code completions
- Focus on efficient and optimal solutions
- Apply strong reasoning to context understanding
- Use standard function calling format when making tool calls`;
	},

	// Helper function to detect if model is DeepSeek
	isDeepSeekModel: (modelName?: string) => {
		return modelName?.includes('DeepSeek') || modelName?.includes('deepseek-ai');
	}
};