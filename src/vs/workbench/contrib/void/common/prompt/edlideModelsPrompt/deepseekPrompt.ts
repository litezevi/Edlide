/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

export const DeepSeekPromptInstructions = {
	// Tool calling format guidelines for DeepSeek models
	toolCallXMLGuidelines: () => {
		return `\
    DeepSeek Tool Calling Format:
    - Use XML format for tool calls as specified in the definitions above
    - To call a tool, write its name and parameters in the XML formats provided
    - After writing the tool call, STOP and WAIT for the result
    - All parameters are REQUIRED unless noted otherwise
    - You are only allowed to output ONE tool call, and it must be at the END of your response
    - Your tool call will be executed immediately, and results will appear in the following user message
    - For MCP tools, consult the tool's documentation first and follow exact parameter format
    
    REQUIRED FORMAT:
    <tool_name>
    <parameter>value</parameter>
    </tool_name>`;
	},

	// Special instructions for DeepSeek models in chat system message
	getChatSystemMessageInstructions: () => {
		return `DEEPSEEK MODEL INSTRUCTIONS: Use XML format for tool calls. Provide precise, analytical responses with strong reasoning capabilities. Focus on efficient problem-solving and optimal code solutions.`;
	},

	// Special instructions for DeepSeek models in rewrite code scenarios
	getRewriteCodeInstructions: () => {
		return `
## DeepSeek Model Instructions
- Use XML format for any tool calls
- Apply analytical approach to code transformations
- Focus on optimization and efficiency in code changes`;
	},

	// Special instructions for DeepSeek models in quick edit scenarios
	getQuickEditInstructions: () => {
		return `
## DeepSeek Model Instructions
- Provide analytically sound code completions
- Focus on efficient and optimal solutions
- Apply strong reasoning to context understanding`;
	},

	// Helper function to detect if model is DeepSeek
	isDeepSeekModel: (modelName?: string) => {
		return modelName?.includes('DeepSeek') || modelName?.includes('deepseek-ai');
	}
};