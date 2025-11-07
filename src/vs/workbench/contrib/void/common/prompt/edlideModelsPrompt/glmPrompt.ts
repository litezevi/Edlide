/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

export const GLMPromptInstructions = {
	// Tool calling format guidelines for GLM models
	toolCallXMLGuidelines: () => {
		return `\
    GLM-4.6 Tool Calling Format:
    - CRITICAL: Use ONLY the special GLM XML format: <invoke> and <parameter> tags
    - NEVER use standard <tool_name> format - GLM requires specific <invoke> structure
    - After writing the tool call, STOP and WAIT for the result
    - All parameters are REQUIRED unless noted otherwise
    - You are only allowed to output ONE tool call at the END of your response
    - Your tool call will be executed immediately, and results will be provided in the next user message
    - For MCP tools, always consult the tool's documentation first and follow exact parameter format
    
    GLM-SPECIFIC REQUIRED FORMAT:
    <invoke name="tool_name">
    <parameter name="param_name">param_value</parameter>
    <parameter name="param2_name">param2_value</parameter>
    </invoke>
    
    CRITICAL: GLM-4.6 uses <invoke> NOT <tool_name>!`;
	},

	// Special instructions for GLM models in chat system message
	getChatSystemMessageInstructions: () => {
		return `GLM-4.6 MODEL INSTRUCTIONS: Use ONLY <invoke name="tool_name"> format for tool calls, NEVER <tool_name>. CRITICAL: Always return valid strings for tool parameters, NEVER return undefined, null, or objects. For edit_file tool, search_replace_blocks MUST be a string containing SEARCH/REPLACE blocks. For rewrite_file tool, new_content MUST be a string with file content. NEVER stop mid-response - always complete your tool calls. Provide balanced, well-reasoned responses with attention to detail and systematic problem-solving approach.`;
	},

	// Special instructions for GLM models in rewrite code scenarios
	getRewriteCodeInstructions: () => {
		return `
## GLM-4.6 Model Instructions
- CRITICAL: Use <invoke name="tool_name"> format for any tool calls, NEVER <tool_name>
- ALWAYS return valid strings for all parameters, NEVER undefined, null, or objects
- For edit_file tool: search_replace_blocks MUST be a string with SEARCH/REPLACE blocks
- For rewrite_file tool: new_content MUST be a string containing complete file content
- NEVER stop mid-response - always complete your tool calls with proper closing tags
- Approach code transformations systematically with careful analysis
- Maintain structural integrity while implementing changes`;
	},

	// Special instructions for GLM models in quick edit scenarios
	getQuickEditInstructions: () => {
		return `
## GLM-4.6 Model Instructions
- Provide thoughtful code completions with systematic approach
- Focus on maintaining code consistency and logical flow
- NEVER use <tool_name> format - only <invoke name="tool_name"> for GLM-4.6`;
	},

	// Helper function to detect if model is GLM
	isGLMModel: (modelName?: string) => {
		return modelName?.includes('GLM') || modelName?.includes('zai-org');
	}
};