import { CancellationToken } from '../../../../base/common/cancellation.js'
import { URI } from '../../../../base/common/uri.js'
import { IFileService } from '../../../../platform/files/common/files.js'
import * as resources from '../../../../base/common/resources.js'
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js'
import { createDecorator, IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js'
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js'
import { QueryBuilder } from '../../../services/search/common/queryBuilder.js'
import { ISearchService } from '../../../services/search/common/search.js'
import { IEditCodeService } from './editCodeServiceInterface.js'
import { ITerminalToolService } from './terminalToolService.js'
import { ILLMMessageService } from '../common/sendLLMMessageService.js'
import { LintErrorItem, BuiltinToolCallParams, BuiltinToolResultType, BuiltinToolName } from '../common/toolsServiceTypes.js'
import { IVoidModelService } from '../common/voidModelService.js'
import { EndOfLinePreference } from '../../../../editor/common/model.js'
import { IVoidCommandBarService } from './voidCommandBarService.js'
import { computeDirectoryTree1Deep, IDirectoryStrService, stringifyDirectoryTree1Deep } from '../common/directoryStrService.js'
import { IMarkerService, MarkerSeverity } from '../../../../platform/markers/common/markers.js'
import { timeout } from '../../../../base/common/async.js'
import { RawToolParamsObj } from '../common/sendLLMMessageTypes.js'
import { MAX_CHILDREN_URIs_PAGE, MAX_FILE_CHARS_PAGE, MAX_TERMINAL_BG_COMMAND_TIME, MAX_TERMINAL_INACTIVE_TIME } from '../common/prompt/prompts.js'
import { annotateWithHashes } from '../common/hashlineService.js'
import { IVoidSettingsService } from '../common/voidSettingsService.js'
import { generateUuid } from '../../../../base/common/uuid.js'
import { IChatThreadService } from './chatThreadService.js'
import { SupabaseAuthHelper } from '../common/supabaseAuthHelper.js'



// tool use for AI
type ValidateBuiltinParams = { [T in BuiltinToolName]: (p: RawToolParamsObj) => BuiltinToolCallParams[T] }
type CallBuiltinTool = { [T in BuiltinToolName]: (p: BuiltinToolCallParams[T]) => Promise<{ result: BuiltinToolResultType[T] | Promise<BuiltinToolResultType[T]>, interruptTool?: () => void }> }
type BuiltinToolResultToString = { [T in BuiltinToolName]: (p: BuiltinToolCallParams[T], result: Awaited<BuiltinToolResultType[T]>) => string }


const isFalsy = (u: unknown) => {
	return !u || u === 'null' || u === 'undefined'
}

const validateStr = (argName: string, value: unknown) => {
	if (value === null) throw new Error(`Invalid LLM output: ${argName} was null.`)
	if (typeof value !== 'string') throw new Error(`Invalid LLM output format: ${argName} must be a string, but its type is "${typeof value}". Full value: ${JSON.stringify(value)}.`)
	return value
}


// Remove trailing slashes from file paths to prevent Windows file editing errors
const normalizeFilePath = (path: string): string => {
	// Remove trailing slash if path has a file extension (but keep directory trailing slashes allowed)
	const hasExtension = /\.\w+$/.test(path)
	if (hasExtension && (path.endsWith('/') || path.endsWith('\\'))) {
		return path.slice(0, -1)
	}
	return path
}

// We are NOT checking to make sure in workspace
const validateURI = (uriStr: unknown) => {
	if (uriStr === null) throw new Error(`Invalid LLM output: uri was null.`)
	if (typeof uriStr !== 'string') throw new Error(`Invalid LLM output format: Provided uri must be a string, but it's a(n) ${typeof uriStr}. Full value: ${JSON.stringify(uriStr)}.`)

	// Check if it's already a full URI with scheme (e.g., vscode-remote://, file://, etc.)
	// Look for :// pattern which indicates a scheme is present
	// Examples of supported URIs:
	// - vscode-remote://wsl+Ubuntu/home/user/file.txt (WSL)
	// - vscode-remote://ssh-remote+myserver/home/user/file.txt (SSH)
	// - file:///home/user/file.txt (local file with scheme)
	// - /home/user/file.txt (local file path, will be converted to file://)
	// - C:\\Users\\file.txt (Windows local path, will be converted to file://)
	if (uriStr.includes('://')) {
		try {
			// Normalize the path before parsing to remove trailing slashes from filenames
			const normalizedUriStr = normalizeFilePath(uriStr)
			const uri = URI.parse(normalizedUriStr)
			return uri
		} catch (e) {
			// If parsing fails, it's a malformed URI
			throw new Error(`Invalid URI format: ${uriStr}. Error: ${e}`)
		}
} else {
// No scheme present, treat as file path
		// This handles regular file paths like /home/user/file.txt or C:\\\\Users\\\\file.txt
		// Normalize the path to remove trailing slashes from filenames
		const normalizedPath = normalizeFilePath(uriStr)
		const uri = URI.file(normalizedPath)
		return uri
	}
}

const validateOptionalURI = (uriStr: unknown) => {
	if (isFalsy(uriStr)) return null
	return validateURI(uriStr)
}

const validateOptionalStr = (argName: string, str: unknown) => {
	if (isFalsy(str)) return null
	return validateStr(argName, str)
}

const validateNewContent = (value: unknown): string => {
	if (value === null || value === undefined) {
		throw new Error(`Invalid LLM output: new_content cannot be null or undefined.`)
	}
	
	// If it's already a string, return it
	if (typeof value === 'string') {
		return value
	}
	
	// If it's an object or array, convert to JSON string
	if (typeof value === 'object') {
		try {
			return JSON.stringify(value, null, 2)
		} catch (e) {
			throw new Error(`Invalid LLM output: new_content is an object but cannot be stringified to JSON. Error: ${e}`)
		}
	}
	
	// For other types (number, boolean, etc.), convert to string
	return String(value)
}


const validatePageNum = (pageNumberUnknown: unknown) => {
	if (!pageNumberUnknown) return 1
	const parsedInt = Number.parseInt(pageNumberUnknown + '')
	if (!Number.isInteger(parsedInt)) throw new Error(`Page number was not an integer: "${pageNumberUnknown}".`)
	if (parsedInt < 1) throw new Error(`Invalid LLM output format: Specified page number must be 1 or greater: "${pageNumberUnknown}".`)
	return parsedInt
}

const validateNumber = (numStr: unknown, opts: { default: number | null }) => {
	if (typeof numStr === 'number')
		return numStr
	if (isFalsy(numStr)) return opts.default

	if (typeof numStr === 'string') {
		const parsedInt = Number.parseInt(numStr + '')
		if (!Number.isInteger(parsedInt)) return opts.default
		return parsedInt
	}

	return opts.default
}

const validateProposedTerminalId = (terminalIdUnknown: unknown) => {
	if (!terminalIdUnknown) throw new Error(`A value for terminalID must be specified, but the value was "${terminalIdUnknown}"`)
	const terminalId = terminalIdUnknown + ''
	return terminalId
}

const validateBoolean = (b: unknown, opts: { default: boolean }) => {
	if (typeof b === 'string') {
		if (b === 'true') return true
		if (b === 'false') return false
	}
	if (typeof b === 'boolean') {
		return b
	}
	return opts.default
}


const checkIfIsFolder = (uriStr: string) => {
	uriStr = uriStr.trim()
	if (uriStr.endsWith('/') || uriStr.endsWith('\\')) return true
	return false
}

const validatePathAndExtension = (uriStr: string, isFolder: boolean) => {
	uriStr = uriStr.trim()
	
	// Check for empty path
	if (!uriStr) {
		throw new Error(`Invalid path: Path cannot be empty.`)
	}
	
	// Check for folder path ending
	if (isFolder && !uriStr.endsWith('/') && !uriStr.endsWith('\\')) {
		throw new Error(`Invalid folder path: Folder paths MUST end with '/' or '\\'. Example: /path/to/folder/ or C:\\path\\to\\folder\\`)
	}
	
	// Check for file extension (basic check)
	if (!isFolder) {
		const lastDotIndex = uriStr.lastIndexOf('.')
		const lastSlashIndex = Math.max(uriStr.lastIndexOf('/'), uriStr.lastIndexOf('\\'))
		
		// If there's a dot after the last slash and it's not the last character
		if (lastDotIndex > lastSlashIndex && lastDotIndex < uriStr.length - 1) {
			// Has extension, check if it looks like a valid file extension
			const extension = uriStr.substring(lastDotIndex + 1)
			if (!/^[a-zA-Z0-9_\-]+$/.test(extension)) {
				throw new Error(`Invalid file extension: Extension "${extension}" contains invalid characters. Use standard extensions like .ts, .tsx, .js, .json, .md, etc.`)
			}
		} else {
			// No extension found - warn but don't fail (some files like .env, .gitignore don't have extensions)
			console.warn(`Warning: File path "${uriStr}" doesn't have a clear extension. Make sure this is intentional.`)
		}
	}
	
	return uriStr
}

export interface IToolsService {
	readonly _serviceBrand: undefined;
	validateParams: ValidateBuiltinParams;
	callTool: CallBuiltinTool;
	stringOfResult: BuiltinToolResultToString;
}

export const IToolsService = createDecorator<IToolsService>('ToolsService');

export class ToolsService implements IToolsService {

	readonly _serviceBrand: undefined;

	public validateParams: ValidateBuiltinParams;
	public callTool: CallBuiltinTool;
	public stringOfResult: BuiltinToolResultToString;

	constructor(
		@IFileService fileService: IFileService,
		@IWorkspaceContextService workspaceContextService: IWorkspaceContextService,
		@ISearchService searchService: ISearchService,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@IVoidModelService voidModelService: IVoidModelService,
		@IEditCodeService editCodeService: IEditCodeService,
		@ITerminalToolService private readonly terminalToolService: ITerminalToolService,
		@IVoidCommandBarService private readonly commandBarService: IVoidCommandBarService,
		@IDirectoryStrService private readonly directoryStrService: IDirectoryStrService,
		@IMarkerService private readonly markerService: IMarkerService,
		@IVoidSettingsService private readonly voidSettingsService: IVoidSettingsService,
		@ILLMMessageService private readonly llmMessageService: ILLMMessageService,
	) {
		const queryBuilder = instantiationService.createInstance(QueryBuilder);

		this.validateParams = {
			read_file: (params: RawToolParamsObj) => {
				const { uri: uriStr, start_line: startLineUnknown, end_line: endLineUnknown, page_number: pageNumberUnknown } = params
				const uri = validateURI(uriStr)
				const pageNumber = validatePageNum(pageNumberUnknown)

				let startLine = validateNumber(startLineUnknown, { default: null })
				let endLine = validateNumber(endLineUnknown, { default: null })

				if (startLine !== null && startLine < 1) startLine = null
				if (endLine !== null && endLine < 1) endLine = null

				return { uri, startLine, endLine, pageNumber }
			},
			ls_dir: (params: RawToolParamsObj) => {
				const { uri: uriStr, page_number: pageNumberUnknown } = params

				const uri = validateURI(uriStr)
				const pageNumber = validatePageNum(pageNumberUnknown)
				return { uri, pageNumber }
			},
			get_dir_tree: (params: RawToolParamsObj) => {
				const { uri: uriStr, } = params
				const uri = validateURI(uriStr)
				return { uri }
			},
			search_pathnames_only: (params: RawToolParamsObj) => {
				const {
					query: queryUnknown,
					search_in_folder: includeUnknown,
					page_number: pageNumberUnknown
				} = params

				const queryStr = validateStr('query', queryUnknown)
				const pageNumber = validatePageNum(pageNumberUnknown)
				const includePattern = validateOptionalStr('include_pattern', includeUnknown)

				return { query: queryStr, includePattern, pageNumber }

			},
			search_for_files: (params: RawToolParamsObj) => {
				const {
					query: queryUnknown,
					search_in_folder: searchInFolderUnknown,
					is_regex: isRegexUnknown,
					page_number: pageNumberUnknown
				} = params
				const queryStr = validateStr('query', queryUnknown)
				const pageNumber = validatePageNum(pageNumberUnknown)
				const searchInFolder = validateOptionalURI(searchInFolderUnknown)
				const isRegex = validateBoolean(isRegexUnknown, { default: false })
				return {
					query: queryStr,
					isRegex,
					searchInFolder,
					pageNumber
				}
			},
			search_in_file: (params: RawToolParamsObj) => {
				const { uri: uriStr, query: queryUnknown, is_regex: isRegexUnknown } = params;
				const uri = validateURI(uriStr);
				const query = validateStr('query', queryUnknown);
				const isRegex = validateBoolean(isRegexUnknown, { default: false });
				return { uri, query, isRegex };
			},

			read_lint_errors: (params: RawToolParamsObj) => {
				const {
					uri: uriUnknown,
				} = params
				const uri = validateURI(uriUnknown)
				return { uri }
			},

			// ---

			create_file_or_folder: (params: RawToolParamsObj) => {
				const { uri: uriUnknown } = params
				const uriStr = validateStr('uri', uriUnknown)
				const isFolder = checkIfIsFolder(uriStr)
				
				// Validate path and extension
				validatePathAndExtension(uriStr, isFolder)
				
				const uri = validateURI(uriStr)
				return { uri, isFolder }
			},

			delete_file_or_folder: (params: RawToolParamsObj) => {
				const { uri: uriUnknown, is_recursive: isRecursiveUnknown } = params
				const uri = validateURI(uriUnknown)
				const isRecursive = validateBoolean(isRecursiveUnknown, { default: false })
				const uriStr = validateStr('uri', uriUnknown)
				const isFolder = checkIfIsFolder(uriStr)
				return { uri, isRecursive, isFolder }
			},

			rewrite_file: (params: RawToolParamsObj) => {
				const { uri: uriStr, new_content: newContentUnknown } = params
				const uri = validateURI(uriStr)
				const newContent = validateNewContent(newContentUnknown)
				return { uri, newContent }
			},

		edit_file: (params: RawToolParamsObj) => {
			const {
				uri: uriUnknown,
				// Hashline params (preferred, high accuracy)
				from_hash: fromHashUnknown,
				to_hash: toHashUnknown,
				new_content: newContentHashUnknown,
				// Legacy params (fallback with 9-level matching)
				old_string: oldStringUnknown,
				new_string: newStringUnknown,
				replace_all: replaceAllUnknown,
			} = params

			if (uriUnknown === undefined || uriUnknown === null) {
				throw new Error(`Invalid LLM output: uri parameter is required and cannot be undefined. Must be an absolute path.`)
			}

			const uriStr = validateStr('uri', uriUnknown)
			const uri = validateURI(uriStr)

			// Hashline path: from_hash + to_hash + new_content
			const fromHash = validateOptionalStr('from_hash', fromHashUnknown)
			const toHash = validateOptionalStr('to_hash', toHashUnknown)

			if (fromHash !== null && toHash !== null) {
				// new_content is required for hashline mode (can be empty string for deletion)
				const newContent = newContentHashUnknown !== undefined && newContentHashUnknown !== null
					? validateStr('new_content', newContentHashUnknown)
					: ''
				return { uri, fromHash, toHash, newContent, oldString: null, newString: null, replaceAll: false }
			}

			// Legacy path: old_string + new_string
			if (oldStringUnknown === undefined || oldStringUnknown === null) {
				throw new Error(`Invalid LLM output: either (from_hash + to_hash) or old_string is required. Use hashline format from read_file output.`)
			}
			if (newStringUnknown === undefined || newStringUnknown === null) {
				throw new Error(`Invalid LLM output: new_string parameter is required when using old_string mode.`)
			}

			const oldString = validateStr('old_string', oldStringUnknown)
			const newString = validateStr('new_string', newStringUnknown)
			const replaceAll = replaceAllUnknown === 'true'

			return { uri, fromHash: null, toHash: null, newContent: null, oldString, newString, replaceAll }
		},

			// ---

			run_command: (params: RawToolParamsObj) => {
				const { command: commandUnknown, cwd: cwdUnknown } = params
				const command = validateStr('command', commandUnknown)
				const cwd = validateOptionalStr('cwd', cwdUnknown)
				const terminalId = generateUuid()
				return { command, cwd, terminalId }
			},
			run_persistent_command: (params: RawToolParamsObj) => {
				const { command: commandUnknown, persistent_terminal_id: persistentTerminalIdUnknown } = params;
				const command = validateStr('command', commandUnknown);
				const persistentTerminalId = validateProposedTerminalId(persistentTerminalIdUnknown)
				return { command, persistentTerminalId };
			},
			open_persistent_terminal: (params: RawToolParamsObj) => {
				const { cwd: cwdUnknown } = params;
				const cwd = validateOptionalStr('cwd', cwdUnknown)
				// No parameters needed; will open a new background terminal
				return { cwd };
			},
			kill_persistent_terminal: (params: RawToolParamsObj) => {
				const { persistent_terminal_id: terminalIdUnknown } = params;
				const persistentTerminalId = validateProposedTerminalId(terminalIdUnknown);
				return { persistentTerminalId };
			},

			analyze_image: (params: RawToolParamsObj) => {
				const { description: descriptionUnknown } = params
				const description = validateOptionalStr('description', descriptionUnknown) ?? 'Describe these images in detail. What do you see?'
				return { description }
			},

			search_web: (params: RawToolParamsObj) => {
				const { query: queryUnknown } = params
				const query = validateStr('query', queryUnknown)
				return { query }
			},

		}


		this.callTool = {
			read_file: async ({ uri, startLine, endLine, pageNumber }) => {
				await voidModelService.initializeModel(uri)
				const { model } = await voidModelService.getModelSafe(uri)
				if (model === null) { throw new Error(`No contents; File does not exist.`) }

				let contents: string
				if (startLine === null && endLine === null) {
					contents = model.getValue(EndOfLinePreference.LF)
				}
				else {
					const startLineNumber = startLine === null ? 1 : startLine
					const endLineNumber = endLine === null ? model.getLineCount() : endLine
					contents = model.getValueInRange({ startLineNumber, startColumn: 1, endLineNumber, endColumn: Number.MAX_SAFE_INTEGER }, EndOfLinePreference.LF)
				}

				const totalNumLines = model.getLineCount()

				// Annotate with hashline format: "1:a3f|content" for precise editing
				const annotated = annotateWithHashes(contents)

				const fromIdx = MAX_FILE_CHARS_PAGE * (pageNumber - 1)
				const toIdx = MAX_FILE_CHARS_PAGE * pageNumber - 1
				const fileContents = annotated.slice(fromIdx, toIdx + 1) // paginate
				const hasNextPage = (annotated.length - 1) - toIdx >= 1
				const totalFileLen = annotated.length
				return { result: { fileContents, totalFileLen, hasNextPage, totalNumLines } }
			},

			ls_dir: async ({ uri, pageNumber }) => {
				const dirResult = await computeDirectoryTree1Deep(fileService, uri, pageNumber)
				return { result: dirResult }
			},

			get_dir_tree: async ({ uri }) => {
				const str = await this.directoryStrService.getDirectoryStrTool(uri)
				return { result: { str } }
			},

			search_pathnames_only: async ({ query: queryStr, includePattern, pageNumber }) => {

				const query = queryBuilder.file(workspaceContextService.getWorkspace().folders.map(f => f.uri), {
					filePattern: queryStr,
					includePattern: includePattern ?? undefined,
					sortByScore: true, // makes results 10x better
				})
				const data = await searchService.fileSearch(query, CancellationToken.None)

				const fromIdx = MAX_CHILDREN_URIs_PAGE * (pageNumber - 1)
				const toIdx = MAX_CHILDREN_URIs_PAGE * pageNumber - 1
				const uris = data.results
					.slice(fromIdx, toIdx + 1) // paginate
					.map(({ resource, results }) => resource)

				const hasNextPage = (data.results.length - 1) - toIdx >= 1
				return { result: { uris, hasNextPage } }
			},

			search_for_files: async ({ query: queryStr, isRegex, searchInFolder, pageNumber }) => {
				const searchFolders = searchInFolder === null ?
					workspaceContextService.getWorkspace().folders.map(f => f.uri)
					: [searchInFolder]

				const query = queryBuilder.text({
					pattern: queryStr,
					isRegExp: isRegex,
				}, searchFolders)

				const data = await searchService.textSearch(query, CancellationToken.None)

				const fromIdx = MAX_CHILDREN_URIs_PAGE * (pageNumber - 1)
				const toIdx = MAX_CHILDREN_URIs_PAGE * pageNumber - 1
				const uris = data.results
					.slice(fromIdx, toIdx + 1) // paginate
					.map(({ resource, results }) => resource)

				const hasNextPage = (data.results.length - 1) - toIdx >= 1
				return { result: { queryStr, uris, hasNextPage } }
			},
			search_in_file: async ({ uri, query, isRegex }) => {
				await voidModelService.initializeModel(uri);
				const { model } = await voidModelService.getModelSafe(uri);
				if (model === null) { throw new Error(`No contents; File does not exist.`); }
				const contents = model.getValue(EndOfLinePreference.LF);
				const contentOfLine = contents.split('\n');
				const totalLines = contentOfLine.length;
				const regex = isRegex ? new RegExp(query) : null;
				const lines: number[] = []
				for (let i = 0; i < totalLines; i++) {
					const line = contentOfLine[i];
					if ((isRegex && regex!.test(line)) || (!isRegex && line.includes(query))) {
						const matchLine = i + 1;
						lines.push(matchLine);
					}
				}
				return { result: { lines } };
			},

			read_lint_errors: async ({ uri }) => {
				await timeout(1000)
				const { lintErrors } = this._getLintErrors(uri)
				return { result: { lintErrors } }
			},

			// ---

			create_file_or_folder: async ({ uri, isFolder }) => {
				try {
					// Check if path already exists
					const exists = await fileService.exists(uri)
					if (exists) {
						// Check what exists at the path
						const stat = await fileService.resolve(uri)
						if (isFolder && stat.isFile) {
							throw new Error(`Cannot create folder at "${uri.fsPath}" because a file already exists at that path.`)
						} else if (!isFolder && stat.isDirectory) {
							throw new Error(`Cannot create file at "${uri.fsPath}" because a directory already exists at that path.`)
						} else {
							throw new Error(`Path "${uri.fsPath}" already exists.`)
						}
					}
					
					// Check parent directory exists for files
					if (!isFolder) {
						const parentUri = resources.dirname(uri)
						const parentExists = await fileService.exists(parentUri)
						if (!parentExists) {
							throw new Error(`Cannot create file at "${uri.fsPath}" because parent directory does not exist. Create the directory first or use a different path.`)
						}
					}
					
					if (isFolder)
						await fileService.createFolder(uri)
					else {
						await fileService.createFile(uri)
					}
					return { result: {} }
				} catch (error: any) {
					// Handle specific file system errors
					if (error.name === 'FileSystemProviderError') {
						switch (error.code) {
							case 'EntryExists':
								throw new Error(`Path "${uri.fsPath}" already exists.`)
							case 'EntryNotFound':
								throw new Error(`Parent directory for "${uri.fsPath}" does not exist.`)
							case 'EntryNotADirectory':
								throw new Error(`Cannot create folder at "${uri.fsPath}" because a file already exists at that path.`)
							case 'EntryIsADirectory':
								throw new Error(`Cannot create file at "${uri.fsPath}" because a directory already exists at that path.`)
							case 'NoPermissions':
								throw new Error(`Permission denied: Cannot create "${uri.fsPath}". Check file permissions.`)
							default:
								throw new Error(`File system error: ${error.message}`)
						}
					}
					throw error
				}
			},

			delete_file_or_folder: async ({ uri, isRecursive }) => {
				await fileService.del(uri, { recursive: isRecursive })
				return { result: {} }
			},

			rewrite_file: async ({ uri, newContent }) => {
				await voidModelService.initializeModel(uri)
				if (this.commandBarService.getStreamState(uri) === 'streaming') {
					throw new Error(`Another LLM is currently making changes to this file. Please stop streaming for now and ask the user to resume later.`)
				}
				await editCodeService.callBeforeApplyOrEdit(uri)
				editCodeService.instantlyRewriteFile({ uri, newContent })
				// at end, get lint errors
				const lintErrorsPromise = Promise.resolve().then(async () => {
					await timeout(2000)
					const { lintErrors } = this._getLintErrors(uri)
					return { lintErrors }
				})
				return { result: lintErrorsPromise }
			},

			edit_file: async ({ uri, fromHash, toHash, newContent, oldString, newString, replaceAll }) => {
				await voidModelService.initializeModel(uri)
				if (this.commandBarService.getStreamState(uri) === 'streaming') {
					throw new Error(`Another LLM is currently making changes to this file. Please stop streaming for now and ask the user to resume later.`)
				}
				await editCodeService.callBeforeApplyOrEdit(uri)

				if (fromHash !== null && toHash !== null && newContent !== null) {
					// Hashline path — hash-addressed replacement, no text reproduction needed
					console.log('🔧 [HASHLINE] edit_file hashline mode:', fromHash, '→', toHash)
					editCodeService.instantlyApplyHashlineEdit({ uri, fromHash, toHash, newContent })
					console.log('🔧 [HASHLINE] edit_file completed successfully')
				} else if (oldString !== null && newString !== null) {
					// Legacy path — 9-level fuzzy matching fallback
					console.log('🔧 [EDLIDE TOOLS] edit_file legacy mode, oldString length:', oldString.length)
					editCodeService.instantlyApplyOpenCodeEdit({ uri, oldString, newString, replaceAll })
					console.log('🔧 [EDLIDE TOOLS] edit_file completed successfully with 9-level replacement')
				} else {
					throw new Error('edit_file: provide either (from_hash + to_hash + new_content) or (old_string + new_string).')
				}

				const lintErrorsPromise = Promise.resolve().then(async () => {
					await timeout(2000)
					const { lintErrors } = this._getLintErrors(uri)
					return { lintErrors }
				})

				return { result: lintErrorsPromise }
			},
			// ---
			run_command: async ({ command, cwd, terminalId }) => {
				const { resPromise, interrupt } = await this.terminalToolService.runCommand(command, { type: 'temporary', cwd, terminalId })
				return { result: resPromise, interruptTool: interrupt }
			},
			run_persistent_command: async ({ command, persistentTerminalId }) => {
				const { resPromise, interrupt } = await this.terminalToolService.runCommand(command, { type: 'persistent', persistentTerminalId })
				return { result: resPromise, interruptTool: interrupt }
			},
			open_persistent_terminal: async ({ cwd }) => {
				const persistentTerminalId = await this.terminalToolService.createPersistentTerminal({ cwd })
				return { result: { persistentTerminalId } }
			},
			kill_persistent_terminal: async ({ persistentTerminalId }) => {
				// Close the background terminal by sending exit
				await this.terminalToolService.killPersistentTerminal(persistentTerminalId)
				return { result: {} }
			},

			analyze_image: async ({ description }) => {
				const chatThreadService = (this.instantiationService as any)._serviceGraph?.get(IChatThreadService)
					|| (globalThis as any).__voidChatThreadService as IChatThreadService

				if (!chatThreadService) {
					throw new Error('ChatThreadService not available')
				}

				const threadId = chatThreadService.state.currentThreadId
				const thread = chatThreadService.state.allThreads[threadId]
				if (!thread) throw new Error('No current thread')

				// Find the last user message with images (not the assistant's response)
				const messages = thread.messages
				let userMessageWithImages = null
				for (let i = messages.length - 1; i >= 0; i--) {
					const msg = messages[i]
					if (msg.role === 'user' && msg.images?.length) {
						userMessageWithImages = msg
						break
					}
				}

				console.log('analyze_image: found user message with images:', !!userMessageWithImages, 'images:', userMessageWithImages?.images?.length)

				if (!userMessageWithImages || !userMessageWithImages.images?.length) {
					throw new Error('No images found in user messages')
				}

				// Helper function to resize images to max 1024x1024
				const resizeImageToMaxSize = (dataUrl: string, maxSize: number = 1024): Promise<string> => {
					return new Promise((resolve, reject) => {
						const img = new Image()
						img.onload = () => {
							let width = img.width
							let height = img.height

							if (width > maxSize || height > maxSize) {
								if (width > height) {
									height = Math.round((height * maxSize) / width)
									width = maxSize
								} else {
									width = Math.round((width * maxSize) / height)
									height = maxSize
								}
							}

							const canvas = document.createElement('canvas')
							canvas.width = width
							canvas.height = height
							const ctx = canvas.getContext('2d')
							ctx?.drawImage(img, 0, 0, width, height)

							const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
							const base64 = resizedDataUrl.split(',')[1]
							resolve(base64)
						}
						img.onerror = reject
						img.src = dataUrl
					})
				}

				const contentParts: { type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }[] = []

				const prompt = description || 'Describe these images in detail. What do you see? Include any UI elements, text, layouts, or visual content.'
				contentParts.push({
					type: 'text',
					text: prompt
				})

				for (const img of userMessageWithImages.images) {
					const originalBase64 = img.previewUrl.split(',')[1]
					if (originalBase64) {
						// Resize image to max 1024x1024 to prevent 413 errors
						const resizedBase64 = await resizeImageToMaxSize(img.previewUrl)
						console.log(`analyze_image: resized image from ${Math.round(originalBase64.length * 0.75)} bytes to ${Math.round(resizedBase64.length * 0.75)} bytes`)
						contentParts.push({
							type: 'image_url',
							image_url: { url: `data:image/jpeg;base64,${resizedBase64}` }
						})
					}
				}

				const abortController = new AbortController()
				let requestId: string | null = null
				let isAborted = false

				const analysisPromise = new Promise<string>((resolve, reject) => {
					const supabaseAccessToken = SupabaseAuthHelper.getAccessTokenSync() ?? undefined

					const chatThreadService = (this.instantiationService as any)._serviceGraph?.get(IChatThreadService)
						|| (globalThis as any).__voidChatThreadService as IChatThreadService

					let attempt = 0
					const maxAttempts = 3

					const tryRequest = () => {
						requestId = this.llmMessageService.sendLLMMessage({
							messagesType: 'chatMessages',
							chatMode: null,
							messages: [{ role: 'user', content: contentParts }] as any,
							modelSelection: { providerName: 'edlide', modelName: 'zai-org/GLM-4.6V' },
							modelSelectionOptions: undefined,
							overridesOfModel: undefined,
							logging: { loggingName: 'analyze_image tool' },
							separateSystemMessage: undefined,
							supabaseAccessToken,
							onText: ({ fullText, fullReasoning }) => {
								if (isAborted || abortController.signal.aborted) {
									return
								}
								if (chatThreadService) {
									chatThreadService.updateStreamingAnalysisContent(fullText)
									if (fullReasoning) {
										chatThreadService.updateStreamingReasoningContent(fullReasoning)
									}
								}
							},
							onFinalMessage: ({ fullText }) => {
								if (isAborted || abortController.signal.aborted) {
									return
								}
								if (chatThreadService) {
									chatThreadService.updateStreamingAnalysisContent('')
									chatThreadService.updateStreamingReasoningContent('')
								}
								resolve(fullText)
							},
							onError: ({ message }) => {
								if (isAborted || abortController.signal.aborted) {
									return
								}
								if (chatThreadService) {
									chatThreadService.updateStreamingAnalysisContent('')
									chatThreadService.updateStreamingReasoningContent('')
								}
								// Retry on 429 (rate limit)
								if (message.includes('429') && attempt < maxAttempts) {
									attempt++
									const delay = Math.pow(2, attempt) * 1000
									console.log(`analyze_image: 429, retry ${attempt}/${maxAttempts} after ${delay}ms`)
									setTimeout(tryRequest, delay)
									return
								}
								reject(new Error(`analyze_image failed: ${message}`))
							},
							onAbort: () => {
								console.log('[analyze_image] Aborted by user')
								isAborted = true
								abortController.abort()
								if (chatThreadService) {
									chatThreadService.updateStreamingAnalysisContent('')
									chatThreadService.updateStreamingReasoningContent('')
								}
								reject(new Error('analyze_image aborted'))
							},
						})

						if (!requestId) {
							reject(new Error('analyze_image failed: could not send request'))
						}
					}

					tryRequest()
				})

				return {
					result: Promise.race([
						analysisPromise.then(analysis => ({ analysis })),
						new Promise<never>((_, reject) => {
							abortController.signal.addEventListener('abort', () => {
								reject(new Error('analyze_image aborted'))
							})
						})
					]),
					interruptTool: () => {
						console.log('[analyze_image] Calling abort for requestId:', requestId)
						isAborted = true
						abortController.abort()
						if (requestId) {
							this.llmMessageService.abort(requestId)
						}
					}
				}
			},

			search_web: async ({ query }) => {
				const abortController = new AbortController()

				const searchPromise = new Promise<{ results: Array<{ title: string; url: string; description: string }> }>((resolve, reject) => {
					const apiKey = SupabaseAuthHelper.getAccessTokenSync()

					if (!apiKey) {
						reject(new Error('Not authenticated'))
						return
					}

					fetch(`https://edlide.com/api/ai-proxy/brave-search`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${apiKey}`,
						},
						body: JSON.stringify({ query })
					}).then(async (response) => {
						if (abortController.signal.aborted) {
							reject(new Error('search_web aborted'))
							return
						}
						if (!response.ok) {
							reject(new Error(`search_web failed: ${response.statusText}`))
							return
						}
						const data = await response.json()
						resolve(data)
					}).catch((err) => {
						if (abortController.signal.aborted) {
							reject(new Error('search_web aborted'))
							return
						}
						reject(new Error(`search_web failed: ${err.message}`))
					})
				})

				return {
					result: Promise.race([
						searchPromise,
						new Promise<never>((_, reject) => {
							abortController.signal.addEventListener('abort', () => {
								reject(new Error('search_web aborted'))
							})
						})
					]),
					interruptTool: () => {
						abortController.abort()
					}
				}
			},
		}


		const nextPageStr = (hasNextPage: boolean) => hasNextPage ? '\n\n(more on next page...)' : ''

		const stringifyLintErrors = (lintErrors: LintErrorItem[]) => {
			return lintErrors
				.map((e, i) => `Error ${i + 1}:\nLines Affected: ${e.startLineNumber}-${e.endLineNumber}\nError message:${e.message}`)
				.join('\n\n')
				.substring(0, MAX_FILE_CHARS_PAGE)
		}

		// given to the LLM after the call for successful tool calls
		this.stringOfResult = {
			read_file: (params, result) => {
				return `${params.uri.fsPath}\n\`\`\`\n${result.fileContents}\n\`\`\`${nextPageStr(result.hasNextPage)}${result.hasNextPage ? `\nMore info because truncated: this file has ${result.totalNumLines} lines, or ${result.totalFileLen} characters.` : ''}`
			},
			ls_dir: (params, result) => {
				const dirTreeStr = stringifyDirectoryTree1Deep(params, result)
				return dirTreeStr // + nextPageStr(result.hasNextPage) // already handles num results remaining
			},
			get_dir_tree: (params, result) => {
				return result.str
			},
			search_pathnames_only: (params, result) => {
				return result.uris.map(uri => uri.fsPath).join('\n') + nextPageStr(result.hasNextPage)
			},
			search_for_files: (params, result) => {
				return result.uris.map(uri => uri.fsPath).join('\n') + nextPageStr(result.hasNextPage)
			},
			search_in_file: (params, result) => {
				const { model } = voidModelService.getModel(params.uri)
				if (!model) return '<Error getting string of result>'
				const lines = result.lines.map(n => {
					const lineContent = model.getValueInRange({ startLineNumber: n, startColumn: 1, endLineNumber: n, endColumn: Number.MAX_SAFE_INTEGER }, EndOfLinePreference.LF)
					return `Line ${n}:\n\`\`\`\n${lineContent}\n\`\`\``
				}).join('\n\n');
				return lines;
			},
			read_lint_errors: (params, result) => {
				return result.lintErrors ?
					stringifyLintErrors(result.lintErrors)
					: 'No lint errors found.'
			},
			// ---
			create_file_or_folder: (params, result) => {
				return `URI ${params.uri.fsPath} successfully created.`
			},
			delete_file_or_folder: (params, result) => {
				return `URI ${params.uri.fsPath} successfully deleted.`
			},
			edit_file: (params, result) => {
				const lintErrsString = (
					this.voidSettingsService.state.globalSettings.includeToolLintErrors ?
						(result.lintErrors ? ` Lint errors found after change:\n${stringifyLintErrors(result.lintErrors)}.\nIf this is related to a change made while calling this tool, you might want to fix the error.`
							: ` No lint errors found.`)
						: '')

				return `Change successfully made to ${params.uri.fsPath}.${lintErrsString}`
			},
			rewrite_file: (params, result) => {
				const lintErrsString = (
					this.voidSettingsService.state.globalSettings.includeToolLintErrors ?
						(result.lintErrors ? ` Lint errors found after change:\n${stringifyLintErrors(result.lintErrors)}.\nIf this is related to a change made while calling this tool, you might want to fix the error.`
							: ` No lint errors found.`)
						: '')

				return `Change successfully made to ${params.uri.fsPath}.${lintErrsString}`
			},
			run_command: (params, result) => {
				const { resolveReason, result: result_, } = result
				// success
				if (resolveReason.type === 'done') {
					return `${result_}\n(exit code ${resolveReason.exitCode})`
				}
				// normal command
				if (resolveReason.type === 'timeout') {
					return `${result_}\nTerminal command ran, but was automatically killed by Edlide after ${MAX_TERMINAL_INACTIVE_TIME}s of inactivity and did not finish successfully. To try with more time, open a persistent terminal and run the command there.`
				}
				throw new Error(`Unexpected internal error: Terminal command did not resolve with a valid reason.`)
			},

			run_persistent_command: (params, result) => {
				const { resolveReason, result: result_, } = result
				const { persistentTerminalId } = params
				// success
				if (resolveReason.type === 'done') {
					return `${result_}\n(exit code ${resolveReason.exitCode})`
				}
				// bg command
				if (resolveReason.type === 'timeout') {
					return `${result_}\nTerminal command is running in terminal ${persistentTerminalId}. The given outputs are the results after ${MAX_TERMINAL_BG_COMMAND_TIME} seconds.`
				}
				throw new Error(`Unexpected internal error: Terminal command did not resolve with a valid reason.`)
			},

			open_persistent_terminal: (_params, result) => {
				const { persistentTerminalId } = result;
				return `Successfully created persistent terminal. persistentTerminalId="${persistentTerminalId}"`;
			},
			kill_persistent_terminal: (params, _result) => {
				return `Successfully closed terminal "${params.persistentTerminalId}".`;
			},

			analyze_image: (_params, result) => {
				return `[IMAGE ANALYSIS]\n${result.analysis}\n[/IMAGE ANALYSIS]`
			},

			search_web: (_params, result) => {
				const formattedResults = result.results.map((r, i) =>
					`[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.description}`
				).join('\n\n')
				return `[WEB SEARCH RESULTS]\n${formattedResults}\n[/WEB SEARCH RESULTS]`
			},
		}



	}


	private _getLintErrors(uri: URI): { lintErrors: LintErrorItem[] | null } {
		const lintErrors = this.markerService
			.read({ resource: uri })
			.filter(l => l.severity === MarkerSeverity.Error || l.severity === MarkerSeverity.Warning)
			.slice(0, 100)
			.map(l => ({
				code: typeof l.code === 'string' ? l.code : l.code?.value || '',
				message: (l.severity === MarkerSeverity.Error ? '(error) ' : '(warning) ') + l.message,
				startLineNumber: l.startLineNumber,
				endLineNumber: l.endLineNumber,
			} satisfies LintErrorItem))

		if (!lintErrors.length) return { lintErrors: null }
		return { lintErrors, }
	}


}

registerSingleton(IToolsService, ToolsService, InstantiationType.Eager);
