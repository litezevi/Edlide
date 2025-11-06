/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

export const GLMPromptInstructions = {
	// Tool calling format guidelines for GLM models
	toolCallXMLGuidelines: () => {
		return `\
    GLM Tool Calling Format:
    - Use standard XML format for tool calls as defined above
    - To call a tool, write its name and parameters in the XML formats specified
    - After writing the tool call, STOP and WAIT for the result
    - All parameters are REQUIRED unless noted otherwise
    - You are only allowed to output ONE tool call at the END of your response
    - Your tool call will be executed immediately, and results will be provided in the next user message
    - For MCP tools, always consult the tool's documentation first and follow exact parameter format
    
    REQUIRED FORMAT:
    <tool_name>
    <parameter>value</parameter>
    </tool_name>`;
	},

	// Special instructions for GLM models in chat system message
	getChatSystemMessageInstructions: () => {
		return `GLM MODEL INSTRUCTIONS: Use XML format for tool calls. Provide balanced, well-reasoned responses with attention to detail and systematic problem-solving approach.`;
	},

	// Special instructions for GLM models in rewrite code scenarios
	getRewriteCodeInstructions: () => {
		return `
## GLM Model Instructions
- Use XML format for any tool calls
- Approach code transformations systematically with careful analysis
- Maintain structural integrity while implementing changes`;
	},

	// Special instructions for GLM models in quick edit scenarios
	getQuickEditInstructions: () => {
		return `
## GLM Model Instructions
- Provide thoughtful code completions with systematic approach
- Focus on maintaining code consistency and logical flow`;
	},

	// Helper function to detect if model is GLM
	isGLMModel: (modelName?: string) => {
		return modelName?.includes('GLM') || modelName?.includes('zai-org');
	}
};