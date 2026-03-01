/**
 * Hashline Edit System
 *
 * Instead of AI reproducing exact old text (error-prone), each line gets a short hash.
 * AI addresses lines by "lineNum:hash" reference — no text reproduction needed.
 *
 * Format: "1:a3f|const x = 5;"
 * Edit:   edit_file({ uri, from_hash: "1:a3f", to_hash: "1:a3f", new_content: "const x = 10;" })
 *
 * If file changed between read_file and edit_file → hash mismatch → safe error returned.
 */

/**
 * djb2 hash variant — fast, dependency-free, 3 hex chars (4096 buckets).
 * Combined with line number, uniquely identifies lines even with hash collisions.
 */
export function hashLine(line: string): string {
	let h = 5381
	for (let i = 0; i < line.length; i++) {
		h = ((h << 5) + h) ^ line.charCodeAt(i)
	}
	return ((h >>> 0) % 0x1000).toString(16).padStart(3, '0')
}

/**
 * Annotates file content with line hashes.
 * Returns: "1:a3f|import React from 'react';\n2:b1c|\n3:0e2|function App() {"
 *
 * @param startLineOffset - 1-indexed line number of the first line in content.
 *   Use when content is a partial file slice (e.g. read_file with start_line).
 *   Ensures hash refs match the real file line numbers used by edit_file.
 */
export function annotateWithHashes(content: string, startLineOffset = 1): string {
	const lines = content.split('\n')
	return lines.map((line, i) => `${i + startLineOffset}:${hashLine(line)}|${line}`).join('\n')
}

/**
 * Strips hash annotations from annotated content (for display/logging).
 */
export function stripHashAnnotations(annotated: string): string {
	return annotated.split('\n').map(line => {
		const pipeIdx = line.indexOf('|')
		if (pipeIdx === -1) return line
		const prefix = line.slice(0, pipeIdx)
		// prefix must match "num:hash" pattern
		if (/^\d+:[0-9a-f]{3}$/.test(prefix)) {
			return line.slice(pipeIdx + 1)
		}
		return line
	}).join('\n')
}

export interface HashlineMatch {
	lineNum: number   // 1-indexed
	content: string
	hash: string
}

export interface HashlineError {
	error: string
}

/**
 * Parses "15:a3f" → { lineNum: 15, hash: "a3f" }
 * Returns null if format is invalid.
 */
export function parseHashRef(ref: string): { lineNum: number; hash: string } | null {
	const match = ref.trim().match(/^(\d+):([0-9a-f]{3})$/)
	if (!match) return null
	return { lineNum: parseInt(match[1], 10), hash: match[2] }
}

/**
 * Verifies that the hash ref matches the actual line in content.
 * Returns the line info on success, or an error object if:
 * - format is invalid
 * - line number out of range
 * - hash mismatch (file changed since read_file)
 */
export function verifyHashRef(content: string, ref: string): HashlineMatch | HashlineError {
	const parsed = parseHashRef(ref)
	if (!parsed) {
		return { error: `Invalid hash reference format: "${ref}". Expected format: "lineNumber:hash" (e.g. "15:a3f").` }
	}

	const lines = content.split('\n')
	if (parsed.lineNum < 1 || parsed.lineNum > lines.length) {
		return { error: `Line ${parsed.lineNum} does not exist (file has ${lines.length} lines). Re-read the file with read_file first.` }
	}

	const line = lines[parsed.lineNum - 1]
	const actualHash = hashLine(line)

	if (actualHash !== parsed.hash) {
		return {
			error: `Hash mismatch at line ${parsed.lineNum}: expected hash "${parsed.hash}" but got "${actualHash}". The file has changed since you last read it. Use read_file to get fresh content with updated hashes.`
		}
	}

	return { lineNum: parsed.lineNum, content: line, hash: parsed.hash }
}

/**
 * Applies a hashline block replacement.
 *
 * Finds lines [fromHash..toHash] in content, replaces them with newContent.
 * Returns new file content string on success, or HashlineError.
 *
 * INSERT AFTER line N: set from_hash = to_hash = "N:xxx", include original line in new_content.
 * DELETE block: set new_content = "".
 */
export function applyHashlineEdit(
	content: string,
	fromHash: string,
	toHash: string,
	newContent: string
): string | HashlineError {
	const fromResult = verifyHashRef(content, fromHash)
	if ('error' in fromResult) return fromResult

	const toResult = verifyHashRef(content, toHash)
	if ('error' in toResult) return toResult

	if (fromResult.lineNum > toResult.lineNum) {
		return {
			error: `from_hash line (${fromResult.lineNum}) must be <= to_hash line (${toResult.lineNum}). Swap them if needed.`
		}
	}

	const lines = content.split('\n')
	const before = lines.slice(0, fromResult.lineNum - 1)
	const after = lines.slice(toResult.lineNum)

	// Handle empty newContent (deletion): don't add empty string element
	if (newContent === '') {
		return [...before, ...after].join('\n')
	}

	return [...before, newContent, ...after].join('\n')
}

/**
 * Extracts the original block of lines between fromHash and toHash (inclusive).
 * Used for building diff display in UI.
 */
export function extractOriginalBlock(
	content: string,
	fromHash: string,
	toHash: string
): string | HashlineError {
	const fromResult = verifyHashRef(content, fromHash)
	if ('error' in fromResult) return fromResult

	const toResult = verifyHashRef(content, toHash)
	if ('error' in toResult) return toResult

	const lines = content.split('\n')
	return lines.slice(fromResult.lineNum - 1, toResult.lineNum).join('\n')
}

/**
 * Returns true if the value is a HashlineError.
 */
export function isHashlineError(value: unknown): value is HashlineError {
	return typeof value === 'object' && value !== null && 'error' in value && typeof (value as HashlineError).error === 'string'
}
