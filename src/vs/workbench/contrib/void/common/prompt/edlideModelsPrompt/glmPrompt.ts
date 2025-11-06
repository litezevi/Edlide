/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

export const GLMPromptInstructions = {
	// Tool calling format guidelines for GLM models
	toolCallXMLGuidelines: () => {
		return `\
    GLM Tool Calling Format:
    - CRITICAL: Use ONLY XML format for tool calls, NEVER use other formats
    - To call a tool, write its name and parameters in the XML formats specified above
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
		return `GLM MODEL INSTRUCTIONS: Use ONLY XML format for tool calls. CRITICAL: Always return valid strings for tool parameters, NEVER return undefined, null, or objects. For edit_file tool, search_replace_blocks MUST be a string containing SEARCH/REPLACE blocks. For rewrite_file tool, new_content MUST be a string with file content. Provide balanced, well-reasoned responses with attention to detail and systematic problem-solving approach.`;
	},

	// Special instructions for GLM models in rewrite code scenarios
	getRewriteCodeInstructions: () => {
		return `
## GLM Model Instructions
- CRITICAL: Use XML format for any tool calls, NEVER use other formats
- ALWAYS return valid strings for all parameters, NEVER undefined, null, or objects
- For edit_file tool: search_replace_blocks MUST be a string with SEARCH/REPLACE blocks
- For rewrite_file tool: new_content MUST be a string containing complete file content
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