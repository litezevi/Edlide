/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

export const MiniMaxPromptInstructions = {
	// Tool calling format guidelines for MiniMax models
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

	// Special instructions for MiniMax models in chat system message
	getChatSystemMessageInstructions: () => {
		return `MINIMAX MODEL INSTRUCTIONS: Use ONLY standard XML format for tool calls: <tool_name>parameters</tool_name>. CRITICAL: Always return valid strings for tool parameters, NEVER return undefined, null, or objects. For edit_file tool, search_replace_blocks MUST be a string containing SEARCH/REPLACE blocks. For rewrite_file tool: new_content MUST be a string with file content.

**CRITICAL FILE EDITING PROTOCOL FOR MINIMAX MODELS:**
1. **ALWAYS READ FIRST**: Use read_file tool to read the file before any editing attempt
2. **CONFIRM MATCH**: Verify ORIGINAL section matches EXACTLY the content you just read
3. **TYPE SAFETY**: Ensure all tool parameters are valid strings, not undefined/null/objects
4. **BLOCK ACCURACY**: Double-check SEARCH/REPLACE blocks for correct format and content
5. **ABSOLUTE CERTAINTY**: Only proceed when 100% confident in file content accuracy`;
	},

	// Special instructions for MiniMax models in rewrite code scenarios
	getRewriteCodeInstructions: () => {
		return `
## MiniMax Model Instructions
- Use standard XML format: <tool_name>parameters</tool_name>
- CRITICAL: Always return valid strings for all parameters, NEVER undefined, null, or objects
- For edit_file tool: search_replace_blocks MUST be a string with SEARCH/REPLACE blocks
- For rewrite_file tool: new_content MUST be a string containing complete file content

**CRITICAL FILE EDITING PROTOCOL:**
1. **MANDATORY FILE READING**: Never edit without first confirming current file content via read_file
2. **100% CONFIDENCE THRESHOLD**: Only proceed when absolutely certain ORIGINAL matches
3. **PARAMETER VALIDATION**: Check that all tool parameters are valid strings before sending
4. **ZERO GUESSWORK**: If uncertain, re-read the file - never guess or assume content`;
	},

	// Special instructions for MiniMax models in quick edit scenarios
	getQuickEditInstructions: () => {
		return `

## URGENT MINIMAX QUICK EDIT INSTRUCTIONS - IMMEDIATE COMPLIANCE REQUIRED

🚨 **CRITICAL WARNING - SYSTEM FAILURE IF IGNORED** 🚨

**ABSOLUTE PROHIBITION**: NEVER output <SELECTION> tags in ANY circumstance
**MANDATORY REQUIREMENT**: Output ONLY raw replacement code content

🚫 **STRICTLY FORBIDDEN - WILL CAUSE SYSTEM ERRORS**:
- <SELECTION> opening tags - NEVER UNDER ANY CIRCUMSTANCE
- </SELECTION> closing tags - NEVER UNDER ANY CIRCUMSTANCE  
- ANY XML tags - NEVER UNDER ANY CIRCUMSTANCE
- ANY formatting - NEVER UNDER ANY CIRCUMSTANCE
- \`\`\` markdown formatting - NEVER UNDER ANY CIRCUMSTANCE
- Language identifiers like typescript - NEVER UNDER ANY CIRCUMSTANCE

✅ **REQUIRED OUTPUT FORMAT**:
- ONLY the replacement code
- NO tags whatsoever
- NO formatting
- NO explanations
- NO markdown

❌ **WRONG (CAUSES SYSTEM FAILURE)**: <SELECTION>code here</SELECTION>
❌ **WRONG (CAUSES SYSTEM FAILURE)**: \`\`\`typescript
code here
\`\`\`
✅ **CORRECT (SYSTEM WORKS)**: code here

**FILL-IN-MIDDLE TASKS**: Return ONLY the code that replaces the selection. ABSOLUTELY NO TAGS, NO MARKDOWN.

**COMPLIANCE IS MANDATORY - SYSTEM DEPENDS ON THIS**`;
	},

	// Helper function to detect if model is MiniMax
	isMiniMaxModel: (modelName?: string) => {
		return modelName?.includes('MiniMax') || modelName?.includes('MiniMaxAI');
	}
};