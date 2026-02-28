/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { URI } from '../../../../../base/common/uri.js';
import { IFileService } from '../../../../../platform/files/common/files.js';
import { IDirectoryStrService } from '../directoryStrService.js';
import { StagingSelectionItem } from '../chatThreadServiceTypes.js';
import { os } from '../helpers/systemInfo.js';
import { RawToolParamsObj } from '../sendLLMMessageTypes.js';
import { approvalTypeOfBuiltinToolName, BuiltinToolCallParams, BuiltinToolName, BuiltinToolResultType, ToolName } from '../toolsServiceTypes.js';
import { ChatMode } from '../voidSettingsTypes.js';

// Triple backtick wrapper used throughout the prompts for code blocks
export const tripleTick = ['```', '```']

// Maximum limits for directory structure information
export const MAX_DIRSTR_CHARS_TOTAL_BEGINNING = 500_000
export const MAX_DIRSTR_CHARS_TOTAL_TOOL = 500_000
export const MAX_DIRSTR_RESULTS_TOTAL_BEGINNING = 2000
export const MAX_DIRSTR_RESULTS_TOTAL_TOOL = 2000

// tool info
export const MAX_FILE_CHARS_PAGE = 750_000
export const MAX_CHILDREN_URIs_PAGE = 500

// terminal tool info
export const MAX_TERMINAL_CHARS = 100_000
export const MAX_TERMINAL_INACTIVE_TIME = 8 // seconds
export const MAX_TERMINAL_BG_COMMAND_TIME = 5


// Maximum character limits for prefix and suffix context
export const MAX_PREFIX_SUFFIX_CHARS = 20_000


export const ORIGINAL = `<<<<<<< ORIGINAL`
export const DIVIDER = `=======`
export const FINAL = `>>>>>>> UPDATED`








const createOpenCodeToolCalls_systemMessage = `\
TASK: Edit code files following exact workflow.

# TOOL SUMMARY
| Tool | When | Speed |
|------|------|-------|
| edit_file | Modify existing code | FAST |
| rewrite_file | NEW file OR 90%+ changes | SLOW |
| create_file_or_folder | Create empty file/folder | - |

# WORKFLOW: EDIT EXISTING FILE
1. read_file({ uri: "/path/file.ts" })
2. edit_file({ uri, old_string: "exact", new_string: "new" })

# WORKFLOW: CREATE NEW FILE - MUST FOLLOW ORDER!
1. create_file_or_folder({ uri: "/path/file.ts" })  // STEP 1: CREATE FIRST!
2. read_file({ uri: "/path/file.ts" })              // STEP 2: VERIFY!
3. If SUCCESS → rewrite_file({ uri, new_content: "..." })  // STEP 3: WRITE
4. If FAIL → retry step 1

# CRITICAL: edit_file FIRST for existing files!
- If file EXISTS → use edit_file (FAST)
- If file NEW → use rewrite_file (after create_file_or_folder)
- If 90%+ content changes → use rewrite_file

WRONG: rewrite_file({ uri: "new.ts", new_content: "..." })  // FILE DOES NOT EXIST!
CORRECT: create_file_or_folder({ uri: "new.ts" }) → read_file → rewrite_file

# CRITICAL: rewrite_file DOES NOT CREATE FILES!
WRONG: rewrite_file({ uri: "new.ts", new_content: "..." })  // FILE DOES NOT EXIST!
CORRECT: create_file_or_folder({ uri: "new.ts" }) → read_file → rewrite_file

# WORKFLOW: CREATE FOLDERS (ONE LEVEL AT A TIME)
1. create_file_or_folder({ uri: "/auth/" }) // TRAILING SLASH!
2. read_file({ uri: "/auth/" }) // VERIFY!
3. create_file_or_folder({ uri: "/auth/ide/" })
4. read_file({ uri: "/auth/ide/" }) // VERIFY EACH!

# CRITICAL: FOLDER vs FILE
FOLDER: ends with "/" → "/app/ide-connect-v2/"
FILE: has extension → "/app/page.ts"

WRONG: create_file_or_folder({ uri: "/app/ide-connect-v2" }) // FILE!
CORRECT: create_file_or_folder({ uri: "/app/ide-connect-v2/" }) // FOLDER!

# RULES
- old_string: 5+ lines context, MUST be unique
- If uncertain: say "I don't know"
- Absolute paths ONLY
- NO hallucinations
- If request unclear: ask clarification

# STARTUP
get_dir_tree on workspace root first
- Absolute paths ONLY
- NO hallucinations`





// ======================================================== tools ========================================================


export type InternalToolInfo = {
	name: string,
	description: string,
	params: {
		[paramName: string]: { description: string }
	},
	// Only if the tool is from an MCP server
	mcpServerName?: string,
}



const uriParam = (object: string) => ({
	uri: { description: `The FULL path to the ${object}.` }
})

const paginationParam = {
	page_number: { description: 'Optional. The page number of the result. Default is 1.' }
} as const



const terminalDescHelper = `You can use this tool to run any command: sed, grep, etc. Do not edit any files with this tool; use edit_file instead. When working with git and other tools that open an editor (e.g. git diff), you should pipe to cat to get all results and not get stuck in vim.`

const cwdHelper = 'Optional. The directory in which to run the command. Defaults to the first workspace folder.'

export type SnakeCase<S extends string> =
	// exact acronym URI
	S extends 'URI' ? 'uri'
	// suffix URI: e.g. 'rootURI' -> snakeCase('root') + '_uri'
	: S extends `${infer Prefix}URI` ? `${SnakeCase<Prefix>}_uri`
	// default: for each char, prefix '_' on uppercase letters
	: S extends `${infer C}${infer Rest}`
	? `${C extends Lowercase<C> ? C : `_${Lowercase<C>}`}${SnakeCase<Rest>}`
	: S;

export type SnakeCaseKeys<T extends Record<string, any>> = {
	[K in keyof T as SnakeCase<Extract<K, string>>]: T[K]
};



export const builtinTools: {
	[T in keyof BuiltinToolCallParams]: {
		name: string;
		description: string;
		// more params can be generated than exist here, but these params must be a subset of them
		params: Partial<{ [paramName in keyof SnakeCaseKeys<BuiltinToolCallParams[T]>]: { description: string } }>
	}
} = {
	// --- context-gathering (read/search/list) ---

	read_file: {
		name: 'read_file',
		description: `Returns full contents of a file. Always read files before editing to understand content.`,
		params: {
			...uriParam('file'),
			start_line: { description: 'Optional. Start line number for reading.' },
			end_line: { description: 'Optional. End line number for reading.' },
			...paginationParam,
		},
	},

	ls_dir: {
		name: 'ls_dir',
		description: `Lists all files and folders in the given URI.`,
		params: {
			uri: { description: `Optional. The FULL path to the ${'folder'}. Leave this as empty or "" to search all folders.` },
			...paginationParam,
		},
	},

	get_dir_tree: {
		name: 'get_dir_tree',
		description: `Returns tree diagram of all files and folders. MANDATORY: Call this FIRST on workspace root to understand project structure before ANY file operations. Use to verify target directories exist before creating files.`,
		params: {
			...uriParam('folder')
		}
	},

	// pathname_search: {
	// 	name: 'pathname_search',
	// 	description: `Returns all pathnames that match a given \`find\`-style query over the entire workspace. ONLY searches file names. ONLY searches the current workspace. You should use this when looking for a file with a specific name or path. ${paginationHelper.desc}`,

	search_pathnames_only: {
		name: 'search_pathnames_only',
		description: `Returns all pathnames that match a given query (searches ONLY file names). You should use this when looking for a file with a specific name or path.`,
		params: {
			query: { description: `Your query for the search.` },
			include_pattern: { description: 'Optional. Only fill this in if you need to limit your search because there were too many results.' },
			...paginationParam,
		},
	},



	search_for_files: {
		name: 'search_for_files',
		description: `Returns a list of file names whose content matches the given query. The query can be any substring or regex.`,
		params: {
			query: { description: `Your query for the search.` },
			search_in_folder: { description: 'Optional. Leave as blank by default. ONLY fill this in if your previous search with the same query was truncated. Searches descendants of this folder only.' },
			is_regex: { description: 'Optional. Default is false. Whether the query is a regex.' },
			...paginationParam,
		},
	},

	// add new search_in_file tool
	search_in_file: {
		name: 'search_in_file',
		description: `Returns an array of all the start line numbers where the content appears in the file.`,
		params: {
			...uriParam('file'),
			query: { description: 'The string or regex to search for in the file.' },
			is_regex: { description: 'Optional. Default is false. Whether the query is a regex.' }
		}
	},

	read_lint_errors: {
		name: 'read_lint_errors',
		description: `Use this tool to view all the lint errors on a file.`,
		params: {
			...uriParam('file'),
		},
	},

	// --- editing (create/delete) ---

	create_file_or_folder: {
		name: 'create_file_or_folder',
		description: `Create empty file or folder.

FOLDER: ends with "/" → "/app/ide-connect-v2/"
FILE: has extension → "/app/page.ts"

WRONG: create_file_or_folder({ uri: "/app/ide-connect-v2" }) // FILE!
CORRECT: create_file_or_folder({ uri: "/app/ide-connect-v2/" }) // FOLDER!

WORKFLOW:
1. create_file_or_folder({ uri: "/path/file.ts" })
2. read_file({ uri: "/path/file.ts" }) // VERIFY!
3. If SUCCESS → rewrite_file({ uri, new_content: "..." })
4. If FAIL → retry step 1`,
		params: {
			...uriParam('file or folder'),
		},
	},

	delete_file_or_folder: {
		name: 'delete_file_or_folder',
		description: `Delete a file or folder at the given path.`,
		params: {
			...uriParam('file or folder'),
			is_recursive: { description: 'Optional. Return true to delete recursively.' }
		},
	},

	edit_file: {
		name: 'edit_file',
		description: `Edit file content.

WORKFLOW:
1. read_file({ uri: "/path/file.ts" }) // BEFORE
2. edit_file({ uri, old_string: "exact", new_string: "new" })
3. read_file({ uri: "/path/file.ts" }) // AFTER - VERIFY!

old_string: MUST be unique, include 5+ lines context.`,
		params: {
			uri: { description: `Absolute path to file to modify.` },
			old_string: { description: `Exact text to replace. MUST be UNIQUE - include 5+ lines of surrounding context.` },
			new_string: { description: `Replacement text. Must be valid code.` },
			replace_all: { description: `Replace all occurrences. Default false.` }
		},
	},

	rewrite_file: {
		name: 'rewrite_file',
		description: `Write content to file. File MUST exist first!

CRITICAL: rewrite_file DOES NOT CREATE FILES!

WORKFLOW:
1. create_file_or_folder({ uri: "file.ts" })  // STEP 1: CREATE FIRST!
2. read_file({ uri: "file.ts" })              // STEP 2: VERIFY!
3. If SUCCESS → rewrite_file({ uri, new_content: "..." })  // STEP 3: WRITE
4. If FAIL → retry step 1

WRONG: rewrite_file({ uri: "new.ts", new_content: "..." })  // FILE DOES NOT EXIST!
CORRECT: create_file_or_folder({ uri: "new.ts" }) → read_file → rewrite_file

For existing files: use edit_file instead!`,
		params: {
			...uriParam('file'),
			new_content: { description: `Content to write. Must be string.` }
		},
	},
	run_command: {
		name: 'run_command',
		description: `Runs a terminal command and waits for the result (times out after ${MAX_TERMINAL_INACTIVE_TIME}s of inactivity). ${terminalDescHelper}`,
		params: {
			command: { description: 'The terminal command to run.' },
			cwd: { description: cwdHelper },
		},
	},

	run_persistent_command: {
		name: 'run_persistent_command',
		description: `Runs a terminal command in the persistent terminal that you created with open_persistent_terminal (results after ${MAX_TERMINAL_BG_COMMAND_TIME} are returned, and command continues running in background). ${terminalDescHelper}`,
		params: {
			command: { description: 'The terminal command to run.' },
			persistent_terminal_id: { description: 'The ID of the terminal created using open_persistent_terminal.' },
		},
	},



	open_persistent_terminal: {
		name: 'open_persistent_terminal',
		description: `Use this tool when you want to run a terminal command indefinitely, like a dev server (eg \`npm run dev\`), a background listener, etc. Opens a new terminal in the user's environment which will not awaited for or killed.`,
		params: {
			cwd: { description: cwdHelper },
		}
	},


	kill_persistent_terminal: {
		name: 'kill_persistent_terminal',
		description: `Interrupts and closes a persistent terminal that you opened with open_persistent_terminal.`,
		params: { persistent_terminal_id: { description: `The ID of the persistent terminal.` } }
	},


	analyze_image: {
		name: 'analyze_image',
		description: `When <has_images>true</has_images> is present, you MUST call this tool. The user's images will be automatically passed. This is NOT optional - you must analyze images before responding.`,
		params: { description: { description: `What to look for in the images. Examples: "Describe everything in detail" or "What text, UI elements, and layouts are visible?"` } }
	},

	search_web: {
		name: 'search_web',
		description: `Searches the internet for current information. Use this when you need up-to-date information, documentation, API references, or answers that require web access. Returns top 5 results with title, URL, and description.`,
		params: { query: { description: `Search query to find relevant information. Be specific and include key terms.` } }
	},


	// go_to_definition
	// go_to_usages

} satisfies { [T in keyof BuiltinToolResultType]: InternalToolInfo }




export const builtinToolNames = Object.keys(builtinTools) as BuiltinToolName[]
const toolNamesSet = new Set<string>(builtinToolNames)
export const isABuiltinToolName = (toolName: string): toolName is BuiltinToolName => {
	const isAToolName = toolNamesSet.has(toolName)
	return isAToolName
}





export const availableTools = (
	chatMode: ChatMode | null,
	mcpTools: InternalToolInfo[] | undefined,
	// if model natively handles images (supportsVision), exclude analyze_image — the model receives images directly
	supportsVision?: boolean,
) => {

	const builtinToolNames: BuiltinToolName[] | undefined = chatMode === 'ask' ? undefined
		: chatMode === 'plan' ? (Object.keys(builtinTools) as BuiltinToolName[]).filter(toolName => !(toolName in approvalTypeOfBuiltinToolName))
			: chatMode === 'agent' ? Object.keys(builtinTools) as BuiltinToolName[]
				: undefined

	// Vision-capable models don't need analyze_image — they receive images natively in the message content
	const filteredBuiltinToolNames = supportsVision
		? builtinToolNames?.filter(toolName => toolName !== 'analyze_image')
		: builtinToolNames

	const effectiveBuiltinTools = filteredBuiltinToolNames?.map(toolName => builtinTools[toolName]) ?? undefined
	const effectiveMCPTools = (chatMode === 'agent' || chatMode === 'plan') ? mcpTools : undefined

	const tools: InternalToolInfo[] | undefined = !(filteredBuiltinToolNames || mcpTools) ? undefined
		: [
			...effectiveBuiltinTools ?? [],
			...effectiveMCPTools ?? [],
		]

	return tools
}

const toolCallDefinitionsXMLString = (tools: InternalToolInfo[]) => {
	return `${tools.map((t, i) => {
		const params = Object.keys(t.params).map(paramName => `<${paramName}>${t.params[paramName].description}</${paramName}>`).join('\n')
		return `\
    ${i + 1}. ${t.name}
    Description: ${t.description}
    Format:
    <${t.name}>${!params ? '' : `\n${params}`}
    </${t.name}>`
	}).join('\n\n')}`
}

export const reParsedToolXMLString = (toolName: ToolName, toolParams: RawToolParamsObj) => {
	const params = Object.keys(toolParams).map(paramName => `<${paramName}>${toolParams[paramName]}</${paramName}>`).join('\n')
	return `\
    <${toolName}>${!params ? '' : `\n${params}`}
    </${toolName}>`
		.replace('\t', '  ')
}

/* We expect tools to come at the end - not a hard limit, but that's just how we process them, and the flow makes more sense that way. */
// - You are allowed to call multiple tools by specifying them consecutively. However, there should be NO text or writing between tool calls or after them.
const systemToolsXMLPrompt = (chatMode: ChatMode, mcpTools: InternalToolInfo[] | undefined, supportsVision?: boolean) => {
	const tools = availableTools(chatMode, mcpTools, supportsVision)
	if (!tools || tools.length === 0) return null

	const toolXMLDefinitions = (`\
    Available tools:

    ${toolCallDefinitionsXMLString(tools)}`)

	const toolCallXMLGuidelines = (`TASK: Edit code files following exact workflow.

# TOOL SUMMARY
| Tool | When | Speed |
|------|------|-------|
| edit_file | Modify existing code | FAST |
| rewrite_file | NEW file OR 90%+ changes | SLOW |

# WORKFLOW: EDIT FILE
1. read_file({ uri: "/path/file.ts" })
2. edit_file({ uri, old_string: "exact", new_string: "new" })

# WORKFLOW: CREATE FILE - MUST FOLLOW ORDER!
1. create_file_or_folder({ uri: "/path/file.ts" })  // STEP 1: CREATE FIRST!
2. read_file({ uri: "/path/file.ts" })              // STEP 2: VERIFY!
3. If SUCCESS → rewrite_file({ uri, new_content: "..." })  // STEP 3: WRITE
4. If FAIL → retry step 1

# CRITICAL: edit_file FIRST for existing files!
- If file EXISTS → use edit_file (FAST)
- If file NEW → use rewrite_file (after create_file_or_folder)
- If 90%+ content changes → use rewrite_file

# CRITICAL: rewrite_file DOES NOT CREATE FILES!
WRONG: rewrite_file({ uri: "new.ts", new_content: "..." })  // FILE DOES NOT EXIST!
CORRECT: create_file_or_folder({ uri: "new.ts" }) → read_file → rewrite_file

# WORKFLOW: CREATE FOLDERS (ONE LEVEL)
1. create_file_or_folder({ uri: "/auth/" }) // TRAILING SLASH!
2. read_file({ uri: "/auth/" }) // VERIFY!
3. create_file_or_folder({ uri: "/auth/ide/" })
4. read_file({ uri: "/auth/ide/" }) // VERIFY EACH!

# CRITICAL: FOLDER vs FILE
FOLDER: ends with "/" → "/app/ide-connect-v2/"
FILE: has extension → "/app/page.ts"

WRONG: create_file_or_folder({ uri: "/app/ide-connect-v2" }) // FILE!
CORRECT: create_file_or_folder({ uri: "/app/ide-connect-v2/" }) // FOLDER!

# RULES
- old_string: 5+ lines context, MUST be unique
- If uncertain: say "I don't know"
- Absolute paths ONLY
- NO hallucinations`)

	return `\
    ${toolXMLDefinitions}

    ${toolCallXMLGuidelines}`
}

// ======================================================== chat (normal, gather, agent) ========================================================


const agentSystemMessageText = `TASK: Edit code files following exact workflow.

# TOOL SUMMARY
| Tool | When | Speed |
|------|------|-------|
| edit_file | Modify existing code | FAST |
| rewrite_file | NEW file OR 90%+ changes | SLOW |

# WORKFLOW: EDIT FILE
1. read_file({ uri: "/path/file.ts" })
2. edit_file({ uri, old_string: "exact", new_string: "new" })

# WORKFLOW: CREATE FILE - MUST FOLLOW ORDER!
1. create_file_or_folder({ uri: "/path/file.ts" })  // STEP 1: CREATE FIRST!
2. read_file({ uri: "/path/file.ts" })              // STEP 2: VERIFY!
3. If SUCCESS → rewrite_file({ uri, new_content: "..." })  // STEP 3: WRITE
4. If FAIL → retry step 1

# CRITICAL: edit_file FIRST for existing files!
- If file EXISTS → use edit_file (FAST)
- If file NEW → use rewrite_file (after create_file_or_folder)
- If 90%+ content changes → use rewrite_file

# CRITICAL: rewrite_file DOES NOT CREATE FILES!
WRONG: rewrite_file({ uri: "new.ts", new_content: "..." })  // FILE DOES NOT EXIST!
CORRECT: create_file_or_folder({ uri: "new.ts" }) → read_file → rewrite_file

# WORKFLOW: CREATE FOLDERS (ONE LEVEL)
1. create_file_or_folder({ uri: "/auth/" }) // TRAILING SLASH!
2. read_file({ uri: "/auth/" }) // VERIFY!
3. create_file_or_folder({ uri: "/auth/ide/" })
4. read_file({ uri: "/auth/ide/" }) // VERIFY EACH!

# CRITICAL: FOLDER vs FILE
FOLDER: ends with "/" → "/app/ide-connect-v2/"
FILE: has extension → "/app/page.ts"

WRONG: create_file_or_folder({ uri: "/app/ide-connect-v2" }) // FILE!
CORRECT: create_file_or_folder({ uri: "/app/ide-connect-v2/" }) // FOLDER!

# FILE MENTIONS (@filename)
Users can reference files/folders in prompts using @syntax:
- @file.py → User mentions a file (use tools to read it)
- @folder → User mentions a folder (use tools to explore it)
- When you see @path, it's a relative path to file/folder from workspace root
- Example: @src/components/Button.tsx = full path to file
- Example: @src/api = folder path (use ls_dir to explore)
- First use ls_dir on parent folder, then read_file on the file

EXAMPLE:
User: "Check @src/components/Button.tsx and update styles"
YOU: ls_dir({ uri: "/workspace/src/components" }) → read_file({ uri: "/workspace/src/components/Button.tsx" }) → make edits

EXAMPLE with duplicate files:
User: "Fix the error in @src/api/routes/route.ts"
YOU: The @path gives you the exact location - just read the file directly
→ read_file({ uri: "/workspace/src/api/routes/route.ts" }) → fix error

# RULES
- old_string: 5+ lines context, MUST be unique
- If uncertain: say "I don't know"
- Absolute paths ONLY
- NO hallucinations
- If request unclear: ask clarification

# STARTUP
get_dir_tree on workspace root first`

export const agentSystemMessage = ({ workspaceFolders, openedURIs, activeURI, persistentTerminalIDs, directoryStr, mcpTools, includeXMLToolDefinitions, supportsVision }: { workspaceFolders: string[], directoryStr: string, openedURIs: string[], activeURI: string | undefined, persistentTerminalIDs: string[], mcpTools: InternalToolInfo[] | undefined, includeXMLToolDefinitions: boolean, supportsVision?: boolean }) => {
	const userInfo = `\nUser OS: ${os ?? 'unknown'}. Workspace: ${workspaceFolders[0]}`;
	const toolDefinitions = includeXMLToolDefinitions ? systemToolsXMLPrompt('agent', mcpTools, supportsVision) : null;

	const parts = [agentSystemMessageText, userInfo];
	if (supportsVision) parts.push('NATIVE VISION: You natively support images and can see them directly in user messages. Do NOT call analyze_image — process images yourself without any tool.');
	if (toolDefinitions) parts.push(toolDefinitions);

	return parts.join('\n\n\n').trim().replace('\t', '  ');
};

export const chat_systemMessage = ({ workspaceFolders, openedURIs, activeURI, persistentTerminalIDs, directoryStr, chatMode: mode, mcpTools, includeXMLToolDefinitions, supportsVision }: { workspaceFolders: string[], directoryStr: string, openedURIs: string[], activeURI: string | undefined, persistentTerminalIDs: string[], chatMode: ChatMode, mcpTools: InternalToolInfo[] | undefined, includeXMLToolDefinitions: boolean, supportsVision?: boolean }) => {
	const header = `You are an expert coding assistant helping with programming tasks.

${mode === 'plan' ? `YOUR CURRENT MODE: PLAN - READ ONLY

TOOLS YOU CAN USE:
✅ read_file - Read file contents
✅ ls_dir - List directory contents
✅ get_dir_tree - View directory tree structure
✅ search_pathnames_only - Search file names
✅ search_for_files - Search file contents
✅ search_in_file - Search within file
✅ read_lint_errors - View lint errors
✅ search_web - Search the internet for current information
${!supportsVision ? '✅ analyze_image - Analyze images from user messages\n' : ''}
TOOLS YOU CANNOT USE:
❌ create_file_or_folder - Forbidden in Plan mode
❌ delete_file_or_folder - Forbidden in Plan mode
❌ edit_file - Forbidden in Plan mode
❌ rewrite_file - Forbidden in Plan mode
❌ run_command - Forbidden in Plan mode
❌ run_persistent_command - Forbidden in Plan mode
❌ open_persistent_terminal - Forbidden in Plan mode
❌ kill_persistent_terminal - Forbidden in Plan mode

YOUR GOAL: Analyze codebase, understand requirements, create detailed implementation plan.

${!supportsVision ? 'IMAGE HANDLING RULE:\nWhen you see <has_images>true</has_images>, you MUST call analyze_image tool first. This is NOT optional.' : 'NATIVE VISION: You natively support images. You can see and analyze images directly in user messages. Do NOT call analyze_image — process images yourself without any tool.'}

CRITICAL RULES:
1. You CAN READ and ANALYZE code
2. You CANNOT CREATE, EDIT, or MODIFY anything
3. When analysis complete, you MUST ask user to switch to Agent mode
4. Say DIRECTLY: "Please switch to Agent mode so I can implement this plan."
5. Do NOT just "suggest" switching - you MUST REQUEST it

PLAN RESPONSE FORMAT:
## Analysis
[Summary of what you found]

## Files to Modify
- file1.ts - [specific change]
- file2.ts - [specific change]

## Implementation Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

Please switch to Agent mode so I can implement this plan.`
			: mode === 'ask' ? `YOUR CURRENT MODE: ASK - NO TOOLS

AVAILABLE TOOLS: NONE
You cannot use ANY tools - no builtin tools, no MCP tools.

YOUR GOAL: Answer questions about code and provide explanations.

AVAILABLE MODES:
- ASK: Answer questions only (no tools)
- PLAN: Read/analyze codebase, create plans (has read tools)
- AGENT: Full tool access (read, edit, create files, run commands)

If user asks you to read, edit, or create files:
Explain: "I cannot access files in ASK mode. Please switch to PLAN or AGENT mode."`
				: `YOUR CURRENT MODE: AGENT - FULL ACCESS

ALL TOOLS AVAILABLE:
✅ read_file, ls_dir, get_dir_tree, search tools
✅ create_file_or_folder, delete_file_or_folder
✅ edit_file, rewrite_file
✅ run_command, run_persistent_command
✅ open_persistent_terminal, kill_persistent_terminal
${!supportsVision ? '✅ analyze_image - Analyze images from user messages\n' : ''}✅ search_web - Search the internet for current information

YOUR GOAL: Complete tasks autonomously using all available tools.

MANDATORY PROTOCOLS:
1. STARTUP PROTOCOL: get_dir_tree on workspace root first
2. FILE CREATION: 5-step process with verification
3. EDIT VERIFICATION: 3-step process with read_file verification
4. REQUEST CLARIFICATION: Ask when request is vague

Follow all protocols for 100% success rate.

${!supportsVision ? 'IMAGE HANDLING RULE:\nWhen you see <has_images>true</has_images>, you MUST call analyze_image tool first. This is NOT optional.' : 'NATIVE VISION: You natively support images. You can see and analyze images directly in user messages. Do NOT call analyze_image — process images yourself without any tool.'}
`}

You may receive selected files (SELECTIONS) for context. Assist the user with their query.

 FILE MENTIONS (@filename):
Users can reference files/folders in prompts using @syntax with full relative paths:
- @src/components/Button.tsx → Full relative path to file
- @src/api → Folder path (use ls_dir to explore)
- When you see @path, construct the full workspace path and read the file
- Prepend workspace path to @path to get the full file URI

EXAMPLE: "Check @src/components/Button.tsx and fix styles"
→ read_file({ uri: "/workspace/src/components/Button.tsx" }) → make edits

EXAMPLE with duplicate file names:
User: "Update @src/api/routes/route.ts"
→ The @path already gives you the exact location
→ read_file({ uri: "/workspace/src/api/routes/route.ts" }) → update file`;


	const sysInfo = `System Info:
OS: ${os}
Workspace: ${workspaceFolders.join(', ') || 'No folders open'}
Active: ${activeURI || 'None'}
Open files: ${openedURIs.join(', ') || 'None'}`;

	const fsInfo = `File System:\n${directoryStr}`;

	const toolDefinitions = includeXMLToolDefinitions ? systemToolsXMLPrompt(mode, mcpTools, supportsVision) : null;

	const details = [];

	// File creation and editing rules (only applies to agent mode)
	if (mode === 'agent') {
		details.push('MODE: AGENT - FULL ACCESS');
		details.push('');
		details.push('TOOLS:');
		details.push('- Context: read_file, ls_dir, get_dir_tree');
		details.push('- File: create_file_or_folder, delete_file_or_folder');
		details.push('- Edit: edit_file, rewrite_file');
		details.push('- Terminal: run_command, open_persistent_terminal');
		details.push('');
		details.push('PROTOCOLS:');
		details.push('');
		details.push('1. STARTUP');
		details.push('   - get_dir_tree on workspace root FIRST');
		details.push('');
		details.push('2. CREATE FILE');
		details.push('   - create_file_or_folder({ uri: "file.ts" })');
		details.push('   - read_file({ uri: "file.ts" }) // VERIFY!');
		details.push('   - If SUCCESS → rewrite_file({ uri, new_content: "..." })');
		details.push('   - If FAIL → retry create_file_or_folder');
		details.push('');
		details.push('3. EDIT FILE');
		details.push('   - read_file BEFORE editing');
		details.push('   - edit_file with UNIQUE old_string (5+ lines context)');
		details.push('   - read_file AFTER editing');
		details.push('   - Report: "SUCCESS: file.ts:lineN-lineM"');
		details.push('');
		details.push('4. CREATE FOLDERS (ONE LEVEL)');
		details.push('   - create_file_or_folder({ uri: "/auth/" }) // TRAILING SLASH!');
		details.push('   - read_file({ uri: "/auth/" }) // VERIFY!');
		details.push('   - Continue level by level');
		details.push('');
		details.push('5. REQUEST CLARIFICATION');
		details.push('   - STOP when request is vague');
		details.push('   - ASK: what type? what tech? what files?');
		details.push('');
		details.push('PATH RULES:');
		details.push('- Folders: end with "/"');
		details.push('- Files: have extension');
		details.push('- ABSOLUTE paths ONLY');
	}

	if (mode === 'plan') {
		details.push(`MODE: PLAN - READ ONLY

TOOLS:
- read_file, ls_dir, get_dir_tree
- search_pathnames_only, search_for_files, search_in_file
- read_lint_errors

FORBIDDEN:
- create_file_or_folder, delete_file_or_folder
- edit_file, rewrite_file
- run_command, open_persistent_terminal

WORKFLOW:
1. READ and ANALYZE codebase
2. CREATE implementation plan
3. LIST files to modify
4. DESCRIBE exact changes
5. REQUEST user to switch to AGENT mode

Say: "Please switch to Agent mode so I can implement this plan."`);
	} else if (mode === 'ask') {
		details.push(`MODE: ASK - NO TOOLS

TOOLS: NONE
You cannot use ANY tools.

GOAL: Answer questions and provide explanations.

RESTRICTIONS:
- NO builtin tool access
- NO MCP tool access
- NO file reading capabilities
- NO file editing capabilities
- NO terminal access

If user asks to:
- "Read file" → "I cannot access files in ASK mode"
- "Edit file" → "I cannot edit files in ASK mode"
- "Create file" → "I cannot create files in ASK mode"
- "Run command" → "I cannot run commands in ASK mode"

Suggest: PLAN mode (for analysis) or AGENT mode (for actions)`);
	}

	if (mode !== 'agent') {
		if (mode === 'plan') {
			details.push('');
			details.push('EXAMPLE Plan Response:');
			details.push('User: "How should I refactor the authentication system?"');
			details.push('');
			details.push('Agent:');
			details.push('## Analysis');
			details.push('- Current auth in: src/auth/AuthService.ts, src/middleware/auth.ts');
			details.push('- Found issues: No token refresh logic, missing error handling');
			details.push('- Dependencies: src/utils/http.ts, src/config/api.ts');
			details.push('');
			details.push('## Files to Modify');
			details.push('- src/auth/AuthService.ts - Add token refresh method');
			details.push('- src/middleware/auth.ts - Add error handling');
			details.push('- src/config/api.ts - Update API endpoints');
			details.push('');
			details.push('## Implementation Steps');
			details.push('1. Add refreshToken() method to AuthService.ts');
			details.push('2. Implement try-catch error handling in auth middleware');
			details.push('3. Update API base URL configuration');
			details.push('');
			details.push('Please switch to Agent mode so I can implement this plan.');
		} else if (mode === 'ask') {
			details.push('');
			details.push('EXAMPLE Ask Response:');
			details.push('User: "What is the difference between map and forEach?"');
			details.push('');
			details.push('Agent:');
			details.push('1. Return Value: map() returns NEW array, forEach() returns undefined');
			details.push('2. Immutability: map() does not modify original, forEach() iterates only');
			details.push('3. Use Cases: map() for transform data, forEach() for side effects');
			details.push('');
			details.push('Example:');
			details.push('const doubled = [1,2,3].map(n => n * 2); // [2,4,6]');
			details.push('[1,2,3].forEach(n => console.log(n * 2));');
		}
	}

	details.push(`Date: ${new Date().toDateString()}`);

	const parts = [header, sysInfo];
	if (toolDefinitions) parts.push(toolDefinitions);
	parts.push(details.join('\n'), fsInfo);

	return parts.join('\n\n\n').trim().replace('\t', '  ');
}


// // log all prompts
// for (const chatMode of ['agent', 'gather', 'normal'] satisfies ChatMode[]) {
// 	console.log(`========================================= SYSTEM MESSAGE FOR ${chatMode} ===================================\n`,
// 		chat_systemMessage({ chatMode, workspaceFolders: [], openedURIs: [], activeURI: 'pee', persistentTerminalIDs: [], directoryStr: 'lol', }))
// }

export const DEFAULT_FILE_SIZE_LIMIT = 2_000_000

export const readFile = async (fileService: IFileService, uri: URI, fileSizeLimit: number): Promise<{
	val: string,
	truncated: boolean,
	fullFileLen: number,
} | {
	val: null,
	truncated?: undefined
	fullFileLen?: undefined,
}> => {
	try {
		const fileContent = await fileService.readFile(uri)
		const val = fileContent.value.toString()
		if (val.length > fileSizeLimit) return { val: val.substring(0, fileSizeLimit), truncated: true, fullFileLen: val.length }
		return { val, truncated: false, fullFileLen: val.length }
	}
	catch (e) {
		return { val: null }
	}
}





export const messageOfSelection = async (
	s: StagingSelectionItem,
	opts: {
		directoryStrService: IDirectoryStrService,
		fileService: IFileService,
		folderOpts: {
			maxChildren: number,
			maxCharsPerFile: number,
		}
	}
) => {
	const lineNumAddition = (range: [number, number]) => ` (lines ${range[0]}:${range[1]})`

	if (s.type === 'File' || s.type === 'CodeSelection') {
		const { val } = await readFile(opts.fileService, s.uri, DEFAULT_FILE_SIZE_LIMIT)
		const lineNumAdd = s.type === 'CodeSelection' ? lineNumAddition(s.range) : ''
		const content = val === null ? 'null' : `${tripleTick[0]}${s.language}\n${val}\n${tripleTick[1]}`
		const str = `${s.uri.fsPath}${lineNumAdd}:\n${content}`
		return str
	}
	else if (s.type === 'Folder') {
		const dirStr: string = await opts.directoryStrService.getDirectoryStrTool(s.uri)
		const folderStructure = `${s.uri.fsPath} folder structure:${tripleTick[0]}\n${dirStr}\n${tripleTick[1]}`

		const uris = await opts.directoryStrService.getAllURIsInDirectory(s.uri, { maxResults: opts.folderOpts.maxChildren })
		const strOfFiles = await Promise.all(uris.map(async uri => {
			const { val, truncated } = await readFile(opts.fileService, uri, opts.folderOpts.maxCharsPerFile)
			const truncationStr = truncated ? `\n... file truncated ...` : ''
			const content = val === null ? 'null' : `${tripleTick[0]}\n${val}${truncationStr}\n${tripleTick[1]}`
			const str = `${uri.fsPath}:\n${content}`
			return str
		}))
		const contentStr = [folderStructure, ...strOfFiles].join('\n\n')
		return contentStr
	}
	else
		return ''

}


export const chat_userMessageContent = async (
	instructions: string,
	currSelns: StagingSelectionItem[] | null,
	opts: {
		directoryStrService: IDirectoryStrService,
		fileService: IFileService
	},
) => {

	const selnsStrs = await Promise.all(
		(currSelns ?? []).map(async (s) =>
			messageOfSelection(s, {
				...opts,
				folderOpts: { maxChildren: 100, maxCharsPerFile: 100_000, }
			})
		)
	)


	let str = ''
	str += `${instructions}`

	const selnsStr = selnsStrs.join('\n\n') ?? ''
	if (selnsStr) str += `\n---\nSELECTIONS\n${selnsStr}`
	return str;
}


export const rewriteCode_systemMessage = `\
Rewrite the entire ORIGINAL_FILE making the CHANGE. Keep original formatting, comments, and structure. Output only the complete new file.
`



// ======================================================== apply (writeover) ========================================================

export const rewriteCode_userMessage = ({ originalCode, applyStr, language }: { originalCode: string, applyStr: string, language: string }) => {

	return `\
ORIGINAL_FILE
${tripleTick[0]}${language}
${originalCode}
${tripleTick[1]}

CHANGE
${tripleTick[0]}
${applyStr}
${tripleTick[1]}

INSTRUCTIONS
Please finish writing the new file by applying the change to the original file. Return ONLY the completion of the file, without any explanation.
`
}



// ======================================================== apply (fast apply - search/replace) ========================================================

export const searchReplaceGivenDescription_systemMessage = createOpenCodeToolCalls_systemMessage


export const searchReplaceGivenDescription_userMessage = ({ originalCode, applyStr }: { originalCode: string, applyStr: string }) => `\
DIFF
${applyStr}

ORIGINAL_FILE
${tripleTick[0]}
${originalCode}
${tripleTick[1]}`





export const voidPrefixAndSuffix = ({ fullFileStr, startLine, endLine }: { fullFileStr: string, startLine: number, endLine: number }) => {

	const fullFileLines = fullFileStr.split('\n')

	/*

	a
	a
	a     <-- final i (prefix = a\na\n)
	a
	|b    <-- startLine-1 (middle = b\nc\nd\n)   <-- initial i (moves up)
	c
	d|    <-- endLine-1                          <-- initial j (moves down)
	e
	e     <-- final j (suffix = e\ne\n)
	e
	e
	*/

	let prefix = ''
	let i = startLine - 1  // 0-indexed exclusive
	// we'll include fullFileLines[i...(startLine-1)-1].join('\n') in the prefix.
	while (i !== 0) {
		const newLine = fullFileLines[i - 1]
		if (newLine.length + 1 + prefix.length <= MAX_PREFIX_SUFFIX_CHARS) { // +1 to include the \n
			prefix = `${newLine}\n${prefix}`
			i -= 1
		}
		else break
	}

	let suffix = ''
	let j = endLine - 1
	while (j !== fullFileLines.length - 1) {
		const newLine = fullFileLines[j + 1]
		if (newLine.length + 1 + suffix.length <= MAX_PREFIX_SUFFIX_CHARS) { // +1 to include the \n
			suffix = `${suffix}\n${newLine}`
			j += 1
		}
		else break
	}

	return { prefix, suffix }

}


// ======================================================== quick edit (ctrl+K) ========================================================

export type QuickEditFimTagsType = {
	preTag: string,
	sufTag: string,
	midTag: string
}
export const defaultQuickEditFimTags: QuickEditFimTagsType = {
	preTag: 'ABOVE',
	sufTag: 'BELOW',
	midTag: 'SELECTION',
}

// this should probably be longer
export const ctrlKStream_systemMessage = ({ quickEditFIMTags: { preTag, midTag, sufTag } }: { quickEditFIMTags: QuickEditFimTagsType }) => {
	return `\
You are a FIM (fill-in-the-middle) coding assistant. Your task is to fill in the middle SELECTION marked by <${midTag}> tags.

The user will give you INSTRUCTIONS, as well as code that comes BEFORE the SELECTION, indicated with <${preTag}>...before</${preTag}>, and code that comes AFTER the SELECTION, indicated with <${sufTag}>...after</${sufTag}>.
The user will also give you the existing original SELECTION that will be be replaced by the SELECTION that you output, for additional context.

Instructions:
1. Your OUTPUT should be a SINGLE PIECE OF CODE of the form <${midTag}>...new_code</${midTag}>. Do NOT output any text or explanations before or after this.
2. You may ONLY CHANGE the original SELECTION, and NOT the content in the <${preTag}>...</${preTag}> or <${sufTag}>...</${sufTag}> tags.
3. Make sure all brackets in the new selection are balanced the same as in the original selection.
4. Be careful not to duplicate or remove variables, comments, or other syntax by mistake.
5. 🚨 CRITICAL: ALWAYS complete the code replacement - NEVER stop mid-way or leave incomplete code!

## URGENT QUICK EDIT INSTRUCTIONS - IMMEDIATE COMPLIANCE REQUIRED

🚨 **CRITICAL WARNING - SYSTEM FAILURE IF IGNORED** 🚨

**ABSOLUTE PROHIBITION**: NEVER output ANY tags or formatting - EVER
**MANDATORY REQUIREMENT**: Output ONLY raw plain text code - NOTHING ELSE

🚫 **STRICTLY FORBIDDEN - WILL CAUSE SYSTEM ERRORS**:
- \`\`\` markdown formatting - NEVER UNDER ANY CIRCUMSTANCE
- Language identifiers like typescript, javascript, etc. - NEVER UNDER ANY CIRCUMSTANCE
- <SELECTION> opening tags - NEVER UNDER ANY CIRCUMSTANCE
- </SELECTION> closing tags - NEVER UNDER ANY CIRCUMSTANCE
- <${midTag}> opening tags - NEVER UNDER ANY CIRCUMSTANCE
- </${midTag}> closing tags - NEVER UNDER ANY CIRCUMSTANCE
- <${preTag}> tags - NEVER UNDER ANY CIRCUMSTANCE
- </${preTag}> tags - NEVER UNDER ANY CIRCUMSTANCE
- <${sufTag}> tags - NEVER UNDER ANY CIRCUMSTANCE
- </${sufTag}> tags - NEVER UNDER ANY CIRCUMSTANCE
- ANY XML tags - NEVER UNDER ANY CIRCUMSTANCE
- ANY formatting - NEVER UNDER ANY CIRCUMSTANCE
- ANY brackets - NEVER UNDER ANY CIRCUMSTANCE
- ANY symbols other than the code itself - NEVER UNDER ANY CIRCUMSTANCE
- Stopping mid-task - NEVER UNDER ANY CIRCUMSTANCE

✅ **REQUIRED OUTPUT FORMAT**:
- ONLY the replacement code
- NO tags
- NO brackets
- NO formatting
- NO backticks
- NO language identifiers
- NO explanations
- NO extra symbols
- PURE CLEAN CODE ONLY
- COMPLETE CODE - NEVER INCOMPLETE

❌ **WRONG (CAUSES SYSTEM FAILURE)**: <SELECTION>code here</SELECTION>
❌ **WRONG (CAUSES SYSTEM FAILURE)**: \`\`\`typescript
code here
\`\`\`
❌ **WRONG (CAUSES SYSTEM FAILURE)**: <${midTag}>code here</${midTag}>
❌ **WRONG (CAUSES SYSTEM FAILURE)**: code with any [symbols] around it
❌ **WRONG (CAUSES SYSTEM FAILURE)**: incomplete code that stops mid-way
✅ **CORRECT (SYSTEM WORKS)**: complete code here

**FILL-IN-MIDDLE TASKS**: Return ONLY the clean code that replaces the selection. ABSOLUTELY NO TAGS, NO MARKDOWN, NO BRACKETS, NO SYMBOLS, NO FORMATTING. JUST RAW CODE. ALWAYS COMPLETE!

**COMPLIANCE IS MANDATORY - SYSTEM DEPENDS ON THIS**

`
}

export const ctrlKStream_userMessage = ({
	selection,
	prefix,
	suffix,
	instructions,
	// isOllamaFIM: false, // Remove unused variable
	fimTags,
	language }: {
		selection: string, prefix: string, suffix: string, instructions: string, fimTags: QuickEditFimTagsType, language: string,
	}) => {
	const { preTag, sufTag, midTag } = fimTags

	// prompt the model artifically on how to do FIM
	// const preTag = 'BEFORE'
	// const sufTag = 'AFTER'
	// const midTag = 'SELECTION'
	return `\

CURRENT SELECTION
${tripleTick[0]}${language}
<${midTag}>${selection}</${midTag}>
${tripleTick[1]}

INSTRUCTIONS
${instructions}

<${preTag}>${prefix}</${preTag}>
<${sufTag}>${suffix}</${sufTag}>

Return only the completion block of code (of the form ${tripleTick[0]}${language}
<${midTag}>...new code</${midTag}>
${tripleTick[1]}).`
};







/*
// ======================================================== ai search/replace ========================================================


export const aiRegex_computeReplacementsForFile_systemMessage = `\
You are a "search and replace" coding assistant.

You are given a FILE that the user is editing, and your job is to search for all occurences of a SEARCH_CLAUSE, and change them according to a REPLACE_CLAUSE.

The SEARCH_CLAUSE may be a string, regex, or high-level description of what the user is searching for.

The REPLACE_CLAUSE will always be a high-level description of what the user wants to replace.

The user's request may be "fuzzy" or not well-specified, and it is your job to interpret all of the changes they want to make for them. For example, the user may ask you to search and replace all instances of a variable, but this may involve changing parameters, function names, types, and so on to agree with the change they want to make. Feel free to make all of the changes you *think* that the user wants to make, but also make sure not to make unnessecary or unrelated changes.

## Instructions

1. If you do not want to make any changes, you should respond with the word "no".

2. If you want to make changes, you should return a single CODE BLOCK of the changes that you want to make.
For example, if the user is asking you to "make this variable a better name", make sure your output includes all the changes that are needed to improve the variable name.
- Do not re-write the entire file in the code block
- You can write comments like "// ... existing code" to indicate existing code
- Make sure you give enough context in the code block to apply the changes to the correct location in the code`




// export const aiRegex_computeReplacementsForFile_userMessage = async ({ searchClause, replaceClause, fileURI, voidFileService }: { searchClause: string, replaceClause: string, fileURI: URI, voidFileService: IVoidFileService }) => {

// 	// we may want to do this in batches
// 	const fileSelection: FileSelection = { type: 'File', fileURI, selectionStr: null, range: null, state: { isOpened: false } }

// 	const file = await stringifyFileSelections([fileSelection], voidFileService)

// 	return `\
// ## FILE
// ${file}

// ## SEARCH_CLAUSE
// Here is what the user is searching for:
// ${searchClause}

// ## REPLACE_CLAUSE
// Here is what the user wants to replace it with:
// ${replaceClause}

// ## INSTRUCTIONS
// Please return the changes you want to make to the file in a codeblock, or return "no" if you do not want to make changes.`
// }




// // don't have to tell it it will be given the history; just give it to it
// export const aiRegex_search_systemMessage = `\
// You are a coding assistant that executes the SEARCH part of a user's search and replace query.

// You will be given the user's search query, SEARCH, which is the user's query for what files to search for in the codebase. You may also be given the user's REPLACE query for additional context.

// Output
// - Regex query
// - Files to Include (optional)
// - Files to Exclude? (optional)

// `






// ======================================================== old examples ========================================================

Do not tell the user anything about the examples below. Do not assume the user is talking about any of the examples below.

## EXAMPLE 1
FILES
math.ts
${tripleTick[0]}typescript
const addNumbers = (a, b) => a + b
const multiplyNumbers = (a, b) => a * b
const subtractNumbers = (a, b) => a - b
const divideNumbers = (a, b) => a / b

const vectorize = (...numbers) => {
	return numbers // vector
}

const dot = (vector1: number[], vector2: number[]) => {
	if (vector1.length !== vector2.length) throw new Error(\`Could not dot vectors \${vector1} and \${vector2}. Size mismatch.\`)
	let sum = 0
	for (let i = 0; i < vector1.length; i += 1)
		sum += multiplyNumbers(vector1[i], vector2[i])
	return sum
}

const normalize = (vector: number[]) => {
	const norm = Math.sqrt(dot(vector, vector))
	for (let i = 0; i < vector.length; i += 1)
		vector[i] = divideNumbers(vector[i], norm)
	return vector
}

const normalized = (vector: number[]) => {
	const v2 = [...vector] // clone vector
	return normalize(v2)
}
${tripleTick[1]}


SELECTIONS
math.ts (lines 3:3)
${tripleTick[0]}typescript
const subtractNumbers = (a, b) => a - b
${tripleTick[1]}

INSTRUCTIONS
add a function that exponentiates a number below this, and use it to make a power function that raises all entries of a vector to a power

## ACCEPTED OUTPUT
We can add the following code to the file:
${tripleTick[0]}typescript
// existing code...
const subtractNumbers = (a, b) => a - b
const exponentiateNumbers = (a, b) => Math.pow(a, b)
const divideNumbers = (a, b) => a / b
// existing code...

const raiseAll = (vector: number[], power: number) => {
	for (let i = 0; i < vector.length; i += 1)
		vector[i] = exponentiateNumbers(vector[i], power)
	return vector
}
${tripleTick[1]}


## EXAMPLE 2
FILES
fib.ts
${tripleTick[0]}typescript

const dfs = (root) => {
	if (!root) return;
	console.log(root.val);
	dfs(root.left);
	dfs(root.right);
}
const fib = (n) => {
	if (n < 1) return 1
	return fib(n - 1) + fib(n - 2)
}
${tripleTick[1]}

SELECTIONS
fib.ts (lines 10:10)
${tripleTick[0]}typescript
	return fib(n - 1) + fib(n - 2)
${tripleTick[1]}

INSTRUCTIONS
memoize results

## ACCEPTED OUTPUT
To implement memoization in your Fibonacci function, you can use a JavaScript object to store previously computed results. This will help avoid redundant calculations and improve performance. Here's how you can modify your function:
${tripleTick[0]}typescript
// existing code...
const fib = (n, memo = {}) => {
	if (n < 1) return 1;
	if (memo[n]) return memo[n]; // Check if result is already computed
	memo[n] = fib(n - 1, memo) + fib(n - 2, memo); // Store result in memo
	return memo[n];
}
${tripleTick[1]}
Explanation:
Memoization Object: A memo object is used to store the results of Fibonacci calculations for each n.
Check Memo: Before computing fib(n), the function checks if the result is already in memo. If it is, it returns the stored result.
Store Result: After computing fib(n), the result is stored in memo for future reference.

## END EXAMPLES

*/


// ======================================================== scm ========================================================================

export const gitCommitMessage_systemMessage = `
You are a senior software engineering specialist tasked with crafting precise Git commit messages that encapsulate the **strategic purpose** and **technical intent** of code changes. All messages must be written in past tense, reflecting completed actions. Prioritize conciseness while maintaining technical accuracy - ideally one sentence, expanding to two only when necessary for clarity.

## Response Protocol

Your response must exclusively contain:
1. **Commit Message**: Wrapped in <output> tags - the actual commit message
2. **Technical Rationale**: Wrapped in <reasoning> tags - brief explanation of the message's technical justification

## Format Specification
<output>Implemented authentication flow optimization and database query enhancement</output>
<reasoning>This commit refactored the authentication middleware to reduce latency by 40% and optimized database queries to eliminate N+1 problems during user validation.</reasoning>

## Quality Standards

- **Technical Precision**: Messages must accurately reflect the actual changes made
- **Strategic Focus**: Emphasize the "why" over the "what" - purpose over mechanics
- **Conciseness**: Eliminate redundant words while maintaining clarity
- **Consistency**: Follow established commit message conventions for the project

## Exclusion Criteria

Absolutely no additional content outside the specified tags. No quotes, markdown formatting, commentary, or explanatory text beyond the required <output> and <reasoning> sections.`.trim()


/**
 * Create a user message for the LLM to generate a commit message. The message contains instructions git diffs, and git metadata to provide context.
 *
 * @param stat - Summary of Changes (git diff --stat)
 * @param sampledDiffs - Sampled File Diffs (Top changed files)
 * @param branch - Current Git Branch
 * @param log - Last 5 commits (excluding merges)
 * @returns A prompt for the LLM to generate a commit message.
 *
 * @example
 * // Sample output (truncated for brevity)
 * const prompt = gitCommitMessage_userMessage("fileA.ts | 10 ++--", "diff --git a/fileA.ts...", "main", "abc123|Fix bug|2025-01-01\n...")
 *
 * // Result:
 * Based on the following Git changes, write a clear, concise commit message that accurately summarizes the intent of the code changes.
 *
 * Section 1 - Summary of Changes (git diff --stat):
 * fileA.ts | 10 ++--
 *
 * Section 2 - Sampled File Diffs (Top changed files):
 * diff --git a/fileA.ts b/fileA.ts
 * ...
 *
 * Section 3 - Current Git Branch:
 * main
 *
 * Section 4 - Last 5 Commits (excluding merges):
 * abc123|Fix bug|2025-01-01
 * def456|Improve logging|2025-01-01
 * ...
 */
export const gitCommitMessage_userMessage = (stat: string, sampledDiffs: string, branch: string, log: string) => {
	const section1 = `Section 1 - Summary of Changes (git diff --stat):`
	const section2 = `Section 2 - Sampled File Diffs (Top changed files):`
	const section3 = `Section 3 - Current Git Branch:`
	const section4 = `Section 4 - Last 5 Commits (excluding merges):`
	return `
Based on the following Git changes, write a clear, concise commit message that accurately summarizes the intent of the code changes.

${section1}

${stat}

${section2}

${sampledDiffs}

${section3}

${branch}

${section4}

${log}`.trim()
}
