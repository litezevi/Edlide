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
You are a coding assistant that modifies code using the OpenCode edit system.

## Editing Rules

**Prefer edit_file over rewrite_file for better performance:**
- edit_file: Fast, targeted modifications (recommended)
- rewrite_file: Slow, replaces entire file content (use sparingly)

**Tool Format:**
Use edit_file with:
- uri: Absolute file path
- old_string: Exact text to replace (MUST be unique)
- new_string: Replacement text
- replace_all: Boolean (default false)

**Critical: old_string Requirements**
- MUST have enough unique context to identify exactly one location
- Include surrounding lines to make it unique
- If you get "multiple matches" error, add more context
- Example: Instead of "function test()" use "const helper = true\n\nfunction test() {"

**File Creation - MANDATORY STEPS:**
1. ALWAYS inspect directory with ls_dir or get_dir_tree FIRST
2. Create parent directories if they don't exist
3. Only then create the file
4. Use absolute paths only
5. Folders: end with '/' (or '\' on Windows)
6. Files: include extensions (.ts, .js, .json, etc.)

**Error Handling:**
- If file doesn't exist: create it first, then edit
- If old_string has multiple matches: add more context
- If parent directory missing: create it first
- Read file after creation to verify

**rewrite_file Rules:**
- new_content must be a string
- Objects/arrays auto-convert to JSON
- Use only when edit_file isn't suitable

RULES: Always inspect before creating. Always read before editing. Always make old_string unique.`





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
		description: `This is a very effective way to learn about the user's codebase. Returns a tree diagram of all the files and folders in the given folder. `,
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
		description: `Create file or folder. CRITICAL: Always inspect directory with ls_dir first. Files need extensions, folders end with '/'. Create nested directories level by level. Use absolute paths only.`,
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
		description: `Edit file content. Read file first. old_string must be unique - include surrounding context to avoid multiple matches. Use absolute paths.`,
		params: {
			uri: { description: `Absolute path to file to modify.` },
			old_string: { description: `Exact text to replace. MUST be unique - include enough context if multiple matches occur.` },
			new_string: { description: `Replacement text. Must be valid code.` },
			replace_all: { description: `Replace all occurrences. Default false.` }
		},
	},

	rewrite_file: {
		name: 'rewrite_file',
		description: `Replace entire file content. Slow operation - prefer edit_file for existing files. new_content must be a string - objects auto-convert to JSON.`,
		params: {
			...uriParam('file'),
			new_content: { description: `New file content. Must be string (objects convert to JSON).` }
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
	}


	// go_to_definition
	// go_to_usages

} satisfies { [T in keyof BuiltinToolResultType]: InternalToolInfo }




export const builtinToolNames = Object.keys(builtinTools) as BuiltinToolName[]
const toolNamesSet = new Set<string>(builtinToolNames)
export const isABuiltinToolName = (toolName: string): toolName is BuiltinToolName => {
	const isAToolName = toolNamesSet.has(toolName)
	return isAToolName
}





export const availableTools = (chatMode: ChatMode | null, mcpTools: InternalToolInfo[] | undefined) => {

	const builtinToolNames: BuiltinToolName[] | undefined = chatMode === 'ask' ? undefined
		: chatMode === 'plan' ? (Object.keys(builtinTools) as BuiltinToolName[]).filter(toolName => !(toolName in approvalTypeOfBuiltinToolName))
			: chatMode === 'agent' ? Object.keys(builtinTools) as BuiltinToolName[]
				: undefined

	const effectiveBuiltinTools = builtinToolNames?.map(toolName => builtinTools[toolName]) ?? undefined
	const effectiveMCPTools = (chatMode === 'agent' || chatMode === 'plan') ? mcpTools : undefined

	const tools: InternalToolInfo[] | undefined = !(builtinToolNames || mcpTools) ? undefined
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
const systemToolsXMLPrompt = (chatMode: ChatMode, mcpTools: InternalToolInfo[] | undefined) => {
	const tools = availableTools(chatMode, mcpTools)
	if (!tools || tools.length === 0) return null

	const toolXMLDefinitions = (`\
    Available tools:

    ${toolCallDefinitionsXMLString(tools)}`)

	const toolCallXMLGuidelines = (`Tool Usage:
- Write tool name and parameters in XML format
- STOP after tool call and wait for result
- All parameters required unless noted optional
- One tool call per response, at the end
- Use exact tool names from list
- File creation: use create_file_or_folder first, then rewrite_file for content
- READ files before editing them
- INSPECT directories before creating files/folders
- Create nested directories level by level
- If editing file and old_string has multiple matches: add more context
- Folders end with '/', files have extensions
- rewrite_file new_content must be a string
- Complete entire user request before stopping`)

	return `\
    ${toolXMLDefinitions}

    ${toolCallXMLGuidelines}`
}

// ======================================================== chat (normal, gather, agent) ========================================================


const agentSystemMessageText = `You are Edlide, an AI coding assistant that helps users solve coding tasks.

Your goal: Follow user instructions and complete coding tasks using available tools.

## Core Rules
- Use tools to gather information, read files, and make changes
- Always read files before editing them
- Always inspect directories before creating files
- Prefer edit_file over rewrite_file for better performance
- Complete the entire user request before stopping
- Use absolute file paths only

## File Operations - CRITICAL
- Create folders: end with '/' (or '\' on Windows)
- Create files: include extensions (.ts, .js, .json, etc.)
- For nested paths: create each directory level separately
- ALWAYS inspect directories with ls_dir/get_dir_tree BEFORE creating
- If file doesn't exist: create it first, then edit it

## Edit Operations - CRITICAL
- old_string MUST be unique - include enough context
- If "multiple matches" error: add more surrounding lines
- Read file after editing to verify changes
- Handle errors by trying different approaches

## Code Quality
- Add necessary imports and dependencies
- Fix linter errors when possible
- Create complete, runnable code
- Avoid binary/hash content

## Working Style
- Take action immediately without asking for confirmation
- Don't explain what you're going to do
- Use tools autonomously to solve problems
- If something fails, try a different approach
- Only ask users for help when tools can't provide needed information

The system includes intelligent code matching that automatically handles formatting differences when using edit_file.

`;

export const agentSystemMessage = ({ workspaceFolders, openedURIs, activeURI, persistentTerminalIDs, directoryStr, mcpTools, includeXMLToolDefinitions }: { workspaceFolders: string[], directoryStr: string, openedURIs: string[], activeURI: string | undefined, persistentTerminalIDs: string[], mcpTools: InternalToolInfo[] | undefined, includeXMLToolDefinitions: boolean }) => {
	const userInfo = `\nUser OS: ${os ?? 'unknown'}. Workspace: ${workspaceFolders[0]}`;
	const toolDefinitions = includeXMLToolDefinitions ? systemToolsXMLPrompt('agent', mcpTools) : null;

	const parts = [agentSystemMessageText, userInfo];
	if (toolDefinitions) parts.push(toolDefinitions);

	return parts.join('\n\n\n').trim().replace('\t', '  ');
};

export const chat_systemMessage = ({ workspaceFolders, openedURIs, activeURI, persistentTerminalIDs, directoryStr, chatMode: mode, mcpTools, includeXMLToolDefinitions }: { workspaceFolders: string[], directoryStr: string, openedURIs: string[], activeURI: string | undefined, persistentTerminalIDs: string[], chatMode: ChatMode, mcpTools: InternalToolInfo[] | undefined, includeXMLToolDefinitions: boolean }) => {
	const header = `You are an expert coding assistant helping with programming tasks.

${mode === 'plan' ? 'Your role: Understand requests, gather information, and create clear plans. Use tools to read files and explore the codebase. DO NOT edit or create any files. After creating a detailed plan, suggest switching to Agent mode for implementation.'
			: mode === 'ask' ? 'Your role: Answer questions about code. No tool access available.'
				: 'Your role: Autonomous coding agent that completes tasks independently.'}

You may receive selected files (SELECTIONS) for context. Assist the user with their query.`;

	const sysInfo = `System Info:
OS: ${os}
Workspace: ${workspaceFolders.join(', ') || 'No folders open'}
Active: ${activeURI || 'None'}
Open files: ${openedURIs.join(', ') || 'None'}`;

	const fsInfo = `File System:\n${directoryStr}`;
	const toolDefinitions = includeXMLToolDefinitions ? systemToolsXMLPrompt(mode, mcpTools) : null;

	const details = [];

	// File creation and editing rules (critical)
	details.push('File Operations:');
	details.push('• Folders end with "/" (/path/folder/)');
	details.push('• Files need extensions (.ts, .js, .json)');
	details.push('• Use absolute paths only');
	details.push('• Create nested directories level by level');
	details.push('• ALWAYS read files before editing');
	details.push('• ALWAYS inspect directories before creating files');
	details.push('• If file missing: create first, then edit');

	if (mode === 'plan') {
		details.push('In plan mode: READ-ONLY - Use tools to explore codebase, understand structure, and create detailed plans. DO NOT create or edit files. After creating a plan, suggest switching to Agent mode for implementation.');
	} else if (mode === 'ask') {
		details.push('In ask mode: ANSWER ONLY - No tool access available. Can only provide explanations and answer questions about code.');
	}

	if (mode !== 'agent') {
		details.push('Process:');
		details.push('1. Think through approach');
		details.push('2. Briefly explain plan');
		details.push('3. Execute with tools');
		details.push('4. Summarize changes');

		const example = `Example:
User: Analyze codebase and fix syntax errors.
AI: I'll analyze the codebase and fix syntax errors. My plan is to run the linter, then fix any issues found.

Starting with lint command:
(run_command: npm run lint)`;
		details.push(example);

		if (mode === 'plan') {
			details.push(`IMPORTANT: Since you are in plan mode, focus on ANALYSIS and PLANNING. Use tools to read and explore, but DO NOT edit files. Describe what changes should be made and suggest switching to Agent mode for implementation.`);
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
