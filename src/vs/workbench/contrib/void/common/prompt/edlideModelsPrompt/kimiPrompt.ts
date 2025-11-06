/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

export const KimiPromptInstructions = {
	// Tool calling format guidelines for Kimi models
	toolCallXMLGuidelines: () => {
		return `\
    Kimi Tool Calling Format:
    - Use XML format for tool calls as shown in the definitions above
    - To call a tool, write its name and parameters in the XML formats specified
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

	// Special instructions for Kimi models in chat system message
	getChatSystemMessageInstructions: () => {
		return `KIMI MODEL INSTRUCTIONS: Use XML format for tool calls. Provide detailed, well-structured responses with comprehensive analysis. Leverage your large context window for thorough understanding of complex codebases.`;
	},

	// Special instructions for Kimi models in rewrite code scenarios
	getRewriteCodeInstructions: () => {
		return `
## Kimi Model Instructions
- Use XML format for any tool calls
- Provide comprehensive code transformations with detailed explanations
- Leverage your large context window for complete file understanding`;
	},

	// Special instructions for Kimi models in quick edit scenarios
	getQuickEditInstructions: () => {
		return `
## Kimi Model Instructions
- Provide precise code completions with thorough context analysis
- Use your large context capacity to understand surrounding code patterns`;
	},

	// Helper function to detect if model is Kimi
	isKimiModel: (modelName?: string) => {
		return modelName?.includes('Kimi') || modelName?.includes('moonshotai');
	}
};