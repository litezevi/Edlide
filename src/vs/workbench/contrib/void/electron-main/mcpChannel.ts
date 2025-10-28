/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

// registered in app.ts
// can't make a service responsible for this, because it needs
// to be connected to the main process and node dependencies

import { IServerChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { MCPConfigFileJSON, MCPConfigFileEntryJSON, MCPServer, RawMCPToolCall, MCPToolErrorResponse, MCPServerEventResponse, MCPToolCallParams, removeMCPToolNamePrefix } from '../common/mcpServiceTypes.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MCPUserStateOfName } from '../common/voidSettingsTypes.js';
import * as childProcess from 'child_process';

const getClientConfig = (serverName: string) => {
	return {
		name: `${serverName}-client`,
		version: '0.1.0',
		// debug: true,
	}
}

// Helper function to find npx on macOS with systematic PATH detection
const findNpxPath = (): string => {
	if (process.platform !== 'darwin') {
		return 'npx'; // Only apply special handling on macOS
	}

	// Systematic PATH detection for macOS GUI apps
	const systemPaths = [
		// Homebrew paths (Apple Silicon first, then Intel)
		'/opt/homebrew/bin',
		'/usr/local/bin',
		// Node.js typical installation paths
		'/usr/bin',
		'/bin',
		// User-specific paths (check common NVM locations)
		process.env.HOME ? `${process.env.HOME}/.nvm/versions/node/*/bin` : undefined,
		process.env.HOME ? `${process.env.HOME}/.npm-global/bin` : undefined,
	].filter(Boolean) as string[];

	// Create comprehensive PATH for macOS GUI environments
	const comprehensivePATH = [
		...systemPaths,
		// Current PATH (may be incomplete but include it)
		...(process.env.PATH ? process.env.PATH.split(':') : []),
	].join(':');

	console.log('MCP: Comprehensive PATH for npx detection:', comprehensivePATH);

	// Try to find npx using the comprehensive PATH
	try {
		const result = childProcess.spawnSync('which', ['npx'], { 
			stdio: 'pipe',
			env: { ...process.env, PATH: comprehensivePATH }
		});
		if (result.status === 0 && result.stdout.toString().trim()) {
			const foundPath = result.stdout.toString().trim();
			console.log(`MCP: Found npx at: ${foundPath}`);
			return foundPath; // Return full path, not just 'npx'
		}
	} catch (e) {
		console.warn('MCP: which command failed, trying manual search');
	}

	// Manual search through common installation directories
	for (const basePath of systemPaths) {
		const npxCandidates = [
			`${basePath}/npx`,
			// Also check if there's a Node.js installation with npx
		];
		
		for (const npxPath of npxCandidates) {
			try {
				const fs = require('fs');
				if (fs.existsSync(npxPath) && fs.accessSync(npxPath)) {
					console.log(`MCP: Found npx via manual search: ${npxPath}`);
					return npxPath;
				}
			} catch (e) {
				// Continue to next path
			}
		}
	}

	// As last resort, try NVM detection
	if (process.env.HOME) {
		try {
			const nvmBaseDir = `${process.env.HOME}/.nvm/versions/node`;
			if (require('fs').existsSync(nvmBaseDir)) {
				const nodeVersions = require('fs').readdirSync(nvmBaseDir);
				for (const version of nodeVersions.sort().reverse()) { // Check latest first
					const npxPath = `${nvmBaseDir}/${version}/bin/npx`;
					if (require('fs').existsSync(npxPath)) {
						console.log(`MCP: Found npx via NVM: ${npxPath}`);
						return npxPath;
					}
				}
			}
		} catch (e) {
			// Continue to fallback
		}
	}

	console.warn('MCP: npx not found in any standard location. Last attempt with original npx command.');
	return 'npx'; // Final fallback
};

// Helper function to get enhanced environment for CLI tools (same systematic approach)
const getEnhancedEnv = (serverEnv?: Record<string, string>): Record<string, string> => {
	const env = {
		...serverEnv,
		...process.env
	} as Record<string, string>;

	if (process.platform === 'darwin') {
		// Use the same systematic PATH detection as findNpxPath
		const systemPaths = [
			'/opt/homebrew/bin',
			'/usr/local/bin', 
			'/usr/bin',
			'/bin',
		];

		// Add user-specific paths if they exist
		if (process.env.HOME) {
			const userPaths = [
				`${process.env.HOME}/.npm-global/bin`,
				`${process.env.HOME}/.nvm/versions/node/*/bin`,
			];
			systemPaths.push(...userPaths);
		}

		// Create comprehensive PATH
		const currentPath = env.PATH || '';
		const pathSeparator = currentPath.includes(';') ? ';' : ':';
		const currentPaths = currentPath.split(pathSeparator);
		
		// Add system paths to the beginning if not already present
		const additionalPaths = systemPaths.filter(p => !currentPaths.includes(p));
		if (additionalPaths.length > 0) {
			env.PATH = additionalPaths.join(pathSeparator) + pathSeparator + currentPath;
			console.log('MCP: Enhanced PATH for macOS GUI:', env.PATH);
		}
	}

	return env;
};

// Check if MCP is available and working
const isMCPAvailable = (): boolean => {
	try {
		// Try to run npx with our enhanced environment
		const enhancedEnv = getEnhancedEnv();
		const npxPath = findNpxPath();
		
		const result = childProcess.spawnSync(npxPath, ['--version'], { 
			stdio: 'pipe',
			env: enhancedEnv,
			timeout: 5000 
		});
		return result.status === 0;
	} catch (e) {
		console.warn('MCP: npx not available:', e);
		return false;
	}
};

type MCPServerNonError = MCPServer & { status: Omit<MCPServer['status'], 'error'> }
type MCPServerError = MCPServer & { status: 'error' }



type ClientInfo = {
	_client: Client, // _client is the client that connects with an mcp client. We're calling mcp clients "server" everywhere except here for naming consistency.
	mcpServerEntryJSON: MCPConfigFileEntryJSON,
	mcpServer: MCPServerNonError,
} | {
	_client?: undefined,
	mcpServerEntryJSON: MCPConfigFileEntryJSON,
	mcpServer: MCPServerError,
}

type InfoOfClientId = {
	[clientId: string]: ClientInfo
}

export class MCPChannel implements IServerChannel {

	private readonly infoOfClientId: InfoOfClientId = {}
	private readonly _refreshingServerNames: Set<string> = new Set()

	// mcp emitters
	private readonly mcpEmitters = {
		serverEvent: {
			onAdd: new Emitter<MCPServerEventResponse>(),
			onUpdate: new Emitter<MCPServerEventResponse>(),
			onDelete: new Emitter<MCPServerEventResponse>(),
		}
	} satisfies {
		serverEvent: {
			onAdd: Emitter<MCPServerEventResponse>,
			onUpdate: Emitter<MCPServerEventResponse>,
			onDelete: Emitter<MCPServerEventResponse>,
		}
	}

	constructor(
	) {
		// Initialize enhanced PATH for macOS GUI apps at startup
		this.initializeMacOSPath();
	}

	private initializeMacOSPath(): void {
		// Only apply to macOS
		if (process.platform !== 'darwin') {
			return;
		}

		const enhancedEnv = getEnhancedEnv();
		process.env.PATH = enhancedEnv.PATH;
		
		console.log('MCP: macOS PATH initialized for GUI app');
		console.log('MCP: Current PATH:', process.env.PATH?.substring(0, 200) + '...');
	}

	// browser uses this to listen for changes
	listen(_: unknown, event: string): Event<any> {

		// server events
		if (event === 'onAdd_server') return this.mcpEmitters.serverEvent.onAdd.event;
		else if (event === 'onUpdate_server') return this.mcpEmitters.serverEvent.onUpdate.event;
		else if (event === 'onDelete_server') return this.mcpEmitters.serverEvent.onDelete.event;
		// else if (event === 'onLoading_server') return this.mcpEmitters.serverEvent.onChangeLoading.event;

		// tool call events

		// handle unknown events
		else throw new Error(`Event not found: ${event}`);
	}

	// browser uses this to call (see this.channel.call() in mcpConfigService.ts for all usages)
	async call(_: unknown, command: string, params: any): Promise<any> {
		try {
			if (command === 'refreshMCPServers') {
				await this._refreshMCPServers(params)
			}
			else if (command === 'closeAllMCPServers') {
				await this._closeAllMCPServers()
			}
			else if (command === 'toggleMCPServer') {
				await this._toggleMCPServer(params.serverName, params.isOn)
			}
			else if (command === 'callTool') {
				const p: MCPToolCallParams = params
				const response = await this._safeCallTool(p.serverName, p.toolName, p.params)
				return response
			}
			else {
				throw new Error(`Edlide sendLLM: command "${command}" not recognized.`)
			}
		}
		catch (e) {
			console.error('mcp channel: Call Error:', e)
		}
	}

	// server functions


	private async _refreshMCPServers(params: { mcpConfigFileJSON: MCPConfigFileJSON, userStateOfName: MCPUserStateOfName, addedServerNames: string[], removedServerNames: string[], updatedServerNames: string[] }) {

		const {
			mcpConfigFileJSON,
			userStateOfName,
			addedServerNames,
			removedServerNames,
			updatedServerNames,
		} = params

		const { mcpServers: mcpServersJSON } = mcpConfigFileJSON

		const allChanges: { type: 'added' | 'removed' | 'updated', serverName: string }[] = [
			...addedServerNames.map(n => ({ serverName: n, type: 'added' }) as const),
			...removedServerNames.map(n => ({ serverName: n, type: 'removed' }) as const),
			...updatedServerNames.map(n => ({ serverName: n, type: 'updated' }) as const),
		]

		await Promise.all(
			allChanges.map(async ({ serverName, type }) => {

				// check if already refreshing
				if (this._refreshingServerNames.has(serverName)) return
				this._refreshingServerNames.add(serverName)

				const prevServer = this.infoOfClientId[serverName]?.mcpServer;

				// close and delete the old client
				if (type === 'removed' || type === 'updated') {
					await this._closeClient(serverName)
					delete this.infoOfClientId[serverName]
					this.mcpEmitters.serverEvent.onDelete.fire({ response: { prevServer, name: serverName, } })
				}

				// create a new client
				if (type === 'added' || type === 'updated') {
					const clientInfo = await this._createClient(mcpServersJSON[serverName], serverName, userStateOfName[serverName]?.isOn)
					this.infoOfClientId[serverName] = clientInfo
					this.mcpEmitters.serverEvent.onAdd.fire({ response: { newServer: clientInfo.mcpServer, name: serverName, } })
				}
			})
		)

		allChanges.forEach(({ serverName, type }) => {
			this._refreshingServerNames.delete(serverName)
		})

	}

	private async _createClientUnsafe(server: MCPConfigFileEntryJSON, serverName: string, isOn: boolean): Promise<ClientInfo> {

		const clientConfig = getClientConfig(serverName)
		const client = new Client(clientConfig)
		let transport: Transport;
		let info: MCPServerNonError;

		if (server.url) {
			// first try HTTP, fall back to SSE
			try {
				transport = new StreamableHTTPClientTransport(server.url);
				await client.connect(transport);
				console.log(`Connected via HTTP to ${serverName}`);
				const { tools } = await client.listTools()
				const toolsWithUniqueName = tools.map(({ name, ...rest }) => ({ name: this._addUniquePrefix(name), ...rest }))
				info = {
					status: isOn ? 'success' : 'offline',
					tools: toolsWithUniqueName,
					command: server.url.toString(),
				}
			} catch (httpErr) {
				console.warn(`HTTP failed for ${serverName}, trying SSE…`, httpErr);
				transport = new SSEClientTransport(server.url);
				await client.connect(transport);
				const { tools } = await client.listTools()
				const toolsWithUniqueName = tools.map(({ name, ...rest }) => ({ name: this._addUniquePrefix(name), ...rest }))
				console.log(`Connected via SSE to ${serverName}`);
				info = {
					status: isOn ? 'success' : 'offline',
					tools: toolsWithUniqueName,
					command: server.url.toString(),
				}
			}
		} else if (server.command) {
			// Handle CLI commands with enhanced environment and path resolution
			let command = server.command;
			const env = getEnhancedEnv(server.env);

			// Special handling for npx on macOS
			if (process.platform === 'darwin' && server.command === 'npx') {
				command = findNpxPath();
				if (command !== 'npx') {
					console.log(`MCP: Using resolved npx path: ${command}`);
				}
			}
			
			// Check if MCP tools are available before attempting connection
			if (!isMCPAvailable()) {
				console.warn('MCP: Tools not available, skipping transport creation');
				throw new Error(`MCP tools not available for command: ${command}`);
			}
			
			try {
				transport = new StdioClientTransport({
					command: command,
					args: server.args,
					env: env,
				});
			} catch (error) {
				console.error('MCP: Failed to create transport:', error);
				throw new Error(`Failed to create MCP transport for ${command}: ${error.message}`);
			}

			await client.connect(transport)

			// Get the tools from the server
			const { tools } = await client.listTools()
			const toolsWithUniqueName = tools.map(({ name, ...rest }) => ({ name: this._addUniquePrefix(name), ...rest }))

			// Create a full command string for display
			const fullCommand = `${server.command} ${server.args?.join(' ') || ''}`

			// Format server object
			info = {
				status: isOn ? 'success' : 'offline',
				tools: toolsWithUniqueName,
				command: fullCommand,
			}

		} else {
			throw new Error(`No url or command for server ${serverName}`);
		}


		return { _client: client, mcpServerEntryJSON: server, mcpServer: info }
	}

	private _addUniquePrefix(base: string) {
		return `${Math.random().toString(36).slice(2, 8)}_${base}`;
	}

	private async _createClient(serverConfig: MCPConfigFileEntryJSON, serverName: string, isOn = true): Promise<ClientInfo> {
		try {
			const c: ClientInfo = await this._createClientUnsafe(serverConfig, serverName, isOn)
			return c
		} catch (err) {
			console.error(`❌ Failed to connect to server "${serverName}":`, err)
			const fullCommand = !serverConfig.command ? '' : `${serverConfig.command} ${serverConfig.args?.join(' ') || ''}`
			const c: MCPServerError = { status: 'error', error: err + '', command: fullCommand, }
			return { mcpServerEntryJSON: serverConfig, mcpServer: c, }
		}
	}

	private async _closeAllMCPServers() {
		for (const serverName in this.infoOfClientId) {
			await this._closeClient(serverName)
			delete this.infoOfClientId[serverName]
		}
		console.log('Closed all MCP servers');
	}

	private async _closeClient(serverName: string) {
		const info = this.infoOfClientId[serverName]
		if (!info) return
		const { _client: client } = info
		if (client) {
			await client.close()
		}
		console.log(`Closed MCP server ${serverName}`);
	}


	private async _toggleMCPServer(serverName: string, isOn: boolean) {
		const prevServer = this.infoOfClientId[serverName]?.mcpServer
		// Handle turning on the server
		if (isOn) {
			// this.mcpEmitters.serverEvent.onChangeLoading.fire(getLoadingServerObject(serverName, isOn))
			const clientInfo = await this._createClientUnsafe(this.infoOfClientId[serverName].mcpServerEntryJSON, serverName, isOn)
			this.mcpEmitters.serverEvent.onUpdate.fire({
				response: {
					name: serverName,
					newServer: clientInfo.mcpServer,
					prevServer: prevServer,
				}
			})
		}
		// Handle turning off the server
		else {
			// this.mcpEmitters.serverEvent.onChangeLoading.fire(getLoadingServerObject(serverName, isOn))
			this._closeClient(serverName)
			delete this.infoOfClientId[serverName]._client

			this.mcpEmitters.serverEvent.onUpdate.fire({
				response: {
					name: serverName,
					newServer: {
						status: 'offline',
						tools: [],
						command: '',
						// Explicitly set error to undefined to reset the error state
						error: undefined,
					},
					prevServer: prevServer,
				}
			})
		}
	}

	// tool call functions

	private async _callTool(serverName: string, toolName: string, params: any): Promise<RawMCPToolCall> {
		const server = this.infoOfClientId[serverName]
		if (!server) throw new Error(`Server ${serverName} not found`)
		const { _client: client } = server
		if (!client) throw new Error(`Client for server ${serverName} not found`)

		// Call the tool with the provided parameters
		const response = await client.callTool({
			name: removeMCPToolNamePrefix(toolName),
			arguments: params
		})
		const { content } = response as CallToolResult
		const returnValue = content[0]

		if (returnValue.type === 'text') {
			// handle text response

			if (response.isError) {
				throw new Error(`Tool call error: ${returnValue.text}`)
			}

			// handle success
			return {
				event: 'text',
				text: returnValue.text,
				toolName,
				serverName,
			}
		}

		// if (returnValue.type === 'audio') {
		// 	// handle audio response
		// }

		// if (returnValue.type === 'image') {
		// 	// handle image response
		// }

		// if (returnValue.type === 'resource') {
		// 	// handle resource response
		// }

		throw new Error(`Tool call error: We don\'t support ${returnValue.type} tool response yet for tool ${toolName} on server ${serverName}`)
	}

	// tool call error wrapper
	private async _safeCallTool(serverName: string, toolName: string, params: any): Promise<RawMCPToolCall> {
		try {
			const response = await this._callTool(serverName, toolName, params)
			return response
		} catch (err) {

			let errorMessage: string;

			if (typeof err === 'object' && err !== null && err['code']) {
				const code = err.code
				let codeDescription = ''
				if (code === -32700)
					codeDescription = 'Parse Error';
				if (code === -32600)
					codeDescription = 'Invalid Request';
				if (code === -32601)
					codeDescription = 'Method Not Found';
				if (code === -32602)
					codeDescription = 'Invalid Parameters';
				if (code === -32603)
					codeDescription = 'Internal Error';
				errorMessage = `${codeDescription}. Full response:\n${JSON.stringify(err, null, 2)}`
			}
			// Check if it's an MCP error with a code
			else if (typeof err === 'string') {
				// String error
				errorMessage = err;
			} else {
				// Unknown error format
				errorMessage = JSON.stringify(err, null, 2);
			}

			const fullErrorMessage = `❌ Failed to call tool "${toolName}" on server "${serverName}": ${errorMessage}`;
			const errorResponse: MCPToolErrorResponse = {
				event: 'error',
				text: fullErrorMessage,
				toolName,
				serverName,
			}
			return errorResponse
		}
	}
}


