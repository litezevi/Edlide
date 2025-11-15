// Edlide 9-Level Code Application System
// Adapted from opencode replace system for IDE integration

export interface ApplyLevel {
  level: number;
  name: string;
  description: string;
  replacer: ReplacerFunction;
  priority: number;
}

export type ReplacerFunction = (content: string, find: string) => Generator<string, void, unknown>;

/**
 * Level 1: Simple Replacer
 * Direct string matching with exact content
 */
export const SimpleReplacer: ReplacerFunction = function* (content, find) {
  yield find;
};

/**
 * Level 2: Line Trimmed Replacer
 * Matches lines ignoring leading/trailing whitespace
 */
export const LineTrimmedReplacer: ReplacerFunction = function* (content, find) {
  const originalLines = content.split("\n");
  const searchLines = find.split("\n");

  if (searchLines[searchLines.length - 1] === "") {
    searchLines.pop();
  }

  for (let i = 0; i <= originalLines.length - searchLines.length; i++) {
    let matches = true;

    for (let j = 0; j < searchLines.length; j++) {
      const originalTrimmed = originalLines[i + j].trim();
      const searchTrimmed = searchLines[j].trim();

      if (originalTrimmed !== searchTrimmed) {
        matches = false;
        break;
      }
    }

    if (matches) {
      let matchStartIndex = 0;
      for (let k = 0; k < i; k++) {
        matchStartIndex += originalLines[k].length + 1;
      }

      let matchEndIndex = matchStartIndex;
      for (let k = 0; k < searchLines.length; k++) {
        matchEndIndex += originalLines[i + k].length;
        if (k < searchLines.length - 1) {
          matchEndIndex += 1;
        }
      }

      yield content.substring(matchStartIndex, matchEndIndex);
    }
  }
};

/**
 * Level 3: Block Anchor Replacer
 * Uses first and last lines as anchors for block matching
 */
export const BlockAnchorReplacer: ReplacerFunction = function* (content, find) {
  const originalLines = content.split("\n");
  const searchLines = find.split("\n");

  if (searchLines.length < 3) {
    return;
  }

  if (searchLines[searchLines.length - 1] === "") {
    searchLines.pop();
  }

  const firstLineSearch = searchLines[0].trim();
  const lastLineSearch = searchLines[searchLines.length - 1].trim();
  const searchBlockSize = searchLines.length;

  const candidates: Array<{ startLine: number; endLine: number }> = [];
  for (let i = 0; i < originalLines.length; i++) {
    if (originalLines[i].trim() !== firstLineSearch) {
      continue;
    }

    for (let j = i + 2; j < originalLines.length; j++) {
      if (originalLines[j].trim() === lastLineSearch) {
        candidates.push({ startLine: i, endLine: j });
        break;
      }
    }
  }

  if (candidates.length === 0) {
    return;
  }

  // Similarity thresholds
  const SINGLE_CANDIDATE_SIMILARITY_THRESHOLD = 0.0;
  const MULTIPLE_CANDIDATES_SIMILARITY_THRESHOLD = 0.3;

  // Levenshtein distance for similarity calculation
  const levenshtein = (a: string, b: string): number => {
    if (a === "" || b === "") {
      return Math.max(a.length, b.length);
    }
    const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
      }
    }
    return matrix[a.length][b.length];
  };

  if (candidates.length === 1) {
    const { startLine, endLine } = candidates[0];
    const actualBlockSize = endLine - startLine + 1;

    let similarity = 0;
    let linesToCheck = Math.min(searchBlockSize - 2, actualBlockSize - 2);

    if (linesToCheck > 0) {
      for (let j = 1; j < searchBlockSize - 1 && j < actualBlockSize - 1; j++) {
        const originalLine = originalLines[startLine + j].trim();
        const searchLine = searchLines[j].trim();
        const maxLen = Math.max(originalLine.length, searchLine.length);
        if (maxLen === 0) {
          continue;
        }
        const distance = levenshtein(originalLine, searchLine);
        similarity += (1 - distance / maxLen) / linesToCheck;

        if (similarity >= SINGLE_CANDIDATE_SIMILARITY_THRESHOLD) {
          break;
        }
      }
    } else {
      similarity = 1.0;
    }

    if (similarity >= SINGLE_CANDIDATE_SIMILARITY_THRESHOLD) {
      let matchStartIndex = 0;
      for (let k = 0; k < startLine; k++) {
        matchStartIndex += originalLines[k].length + 1;
      }
      let matchEndIndex = matchStartIndex;
      for (let k = startLine; k <= endLine; k++) {
        matchEndIndex += originalLines[k].length;
        if (k < endLine) {
          matchEndIndex += 1;
        }
      }
      yield content.substring(matchStartIndex, matchEndIndex);
    }
    return;
  }

  // Multiple candidates - find best match
  let bestMatch: { startLine: number; endLine: number } | null = null;
  let maxSimilarity = -1;

  for (const candidate of candidates) {
    const { startLine, endLine } = candidate;
    const actualBlockSize = endLine - startLine + 1;

    let similarity = 0;
    let linesToCheck = Math.min(searchBlockSize - 2, actualBlockSize - 2);

    if (linesToCheck > 0) {
      for (let j = 1; j < searchBlockSize - 1 && j < actualBlockSize - 1; j++) {
        const originalLine = originalLines[startLine + j].trim();
        const searchLine = searchLines[j].trim();
        const maxLen = Math.max(originalLine.length, searchLine.length);
        if (maxLen === 0) {
          continue;
        }
        const distance = levenshtein(originalLine, searchLine);
        similarity += 1 - distance / maxLen;
      }
      similarity /= linesToCheck;
    } else {
      similarity = 1.0;
    }

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      bestMatch = candidate;
    }
  }

  if (maxSimilarity >= MULTIPLE_CANDIDATES_SIMILARITY_THRESHOLD && bestMatch) {
    const { startLine, endLine } = bestMatch;
    let matchStartIndex = 0;
    for (let k = 0; k < startLine; k++) {
      matchStartIndex += originalLines[k].length + 1;
    }
    let matchEndIndex = matchStartIndex;
    for (let k = startLine; k <= endLine; k++) {
      matchEndIndex += originalLines[k].length;
      if (k < endLine) {
        matchEndIndex += 1;
      }
    }
    yield content.substring(matchStartIndex, matchEndIndex);
  }
};

/**
 * Level 4: Whitespace Normalized Replacer
 * Normalizes all whitespace to single spaces
 */
export const WhitespaceNormalizedReplacer: ReplacerFunction = function* (content, find) {
  const normalizeWhitespace = (text: string) => text.replace(/\s+/g, " ").trim();
  const normalizedFind = normalizeWhitespace(find);

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (normalizeWhitespace(line) === normalizedFind) {
      yield line;
    } else {
      const normalizedLine = normalizeWhitespace(line);
      if (normalizedLine.includes(normalizedFind)) {
        const words = find.trim().split(/\s+/);
        if (words.length > 0) {
          const pattern = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
          try {
            const regex = new RegExp(pattern);
            const match = line.match(regex);
            if (match) {
              yield match[0];
            }
          } catch (e) {
            // Invalid regex pattern, skip
          }
        }
      }
    }
  }

  const findLines = find.split("\n");
  if (findLines.length > 1) {
    for (let i = 0; i <= lines.length - findLines.length; i++) {
      const block = lines.slice(i, i + findLines.length);
      if (normalizeWhitespace(block.join("\n")) === normalizedFind) {
        yield block.join("\n");
      }
    }
  }
};

/**
 * Level 5: Indentation Flexible Replacer
 * Ignores indentation differences
 */
export const IndentationFlexibleReplacer: ReplacerFunction = function* (content, find) {
  const removeIndentation = (text: string) => {
    const lines = text.split("\n");
    const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
    if (nonEmptyLines.length === 0) return text;

    const minIndent = Math.min(
      ...nonEmptyLines.map((line) => {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
      }),
    );

    return lines.map((line) => (line.trim().length === 0 ? line : line.slice(minIndent))).join("\n");
  };

  const normalizedFind = removeIndentation(find);
  const contentLines = content.split("\n");
  const findLines = find.split("\n");

  for (let i = 0; i <= contentLines.length - findLines.length; i++) {
    const block = contentLines.slice(i, i + findLines.length).join("\n");
    if (removeIndentation(block) === normalizedFind) {
      yield block;
    }
  }
};

/**
 * Level 6: Escape Normalized Replacer
 * Handles escaped characters and strings
 */
export const EscapeNormalizedReplacer: ReplacerFunction = function* (content, find) {
  const unescapeString = (str: string): string => {
    return str.replace(/\\(n|t|r|'|"|`|\\|\n|\$)/g, (match, capturedChar) => {
      switch (capturedChar) {
        case "n":
          return "\n";
        case "t":
          return "\t";
        case "r":
          return "\r";
        case "'":
          return "'";
        case '"':
          return '"';
        case "`":
          return "`";
        case "\\":
          return "\\";
        case "\n":
          return "\n";
        case "$":
          return "$";
        default:
          return match;
      }
    });
  };

  const unescapedFind = unescapeString(find);

  if (content.includes(unescapedFind)) {
    yield unescapedFind;
  }

  const lines = content.split("\n");
  const findLines = unescapedFind.split("\n");

  for (let i = 0; i <= lines.length - findLines.length; i++) {
    const block = lines.slice(i, i + findLines.length).join("\n");
    const unescapedBlock = unescapeString(block);

    if (unescapedBlock === unescapedFind) {
      yield block;
    }
  }
};

/**
 * Level 7: Trimmed Boundary Replacer
 * Handles content with extra whitespace at boundaries
 */
export const TrimmedBoundaryReplacer: ReplacerFunction = function* (content, find) {
  const trimmedFind = find.trim();

  if (trimmedFind === find) {
    return;
  }

  if (content.includes(trimmedFind)) {
    yield trimmedFind;
  }

  const lines = content.split("\n");
  const findLines = find.split("\n");

  for (let i = 0; i <= lines.length - findLines.length; i++) {
    const block = lines.slice(i, i + findLines.length).join("\n");

    if (block.trim() === trimmedFind) {
      yield block;
    }
  }
};

/**
 * Level 8: Context Aware Replacer
 * Uses surrounding context for intelligent matching
 */
export const ContextAwareReplacer: ReplacerFunction = function* (content, find) {
  const findLines = find.split("\n");
  if (findLines.length < 3) {
    return;
  }

  if (findLines[findLines.length - 1] === "") {
    findLines.pop();
  }

  const contentLines = content.split("\n");
  const firstLine = findLines[0].trim();
  const lastLine = findLines[findLines.length - 1].trim();

  for (let i = 0; i < contentLines.length; i++) {
    if (contentLines[i].trim() !== firstLine) continue;

    for (let j = i + 2; j < contentLines.length; j++) {
      if (contentLines[j].trim() === lastLine) {
        const blockLines = contentLines.slice(i, j + 1);
        const block = blockLines.join("\n");

        if (blockLines.length === findLines.length) {
          let matchingLines = 0;
          let totalNonEmptyLines = 0;

          for (let k = 1; k < blockLines.length - 1; k++) {
            const blockLine = blockLines[k].trim();
            const findLine = findLines[k].trim();

            if (blockLine.length > 0 || findLine.length > 0) {
              totalNonEmptyLines++;
              if (blockLine === findLine) {
                matchingLines++;
              }
            }
          }

          if (totalNonEmptyLines === 0 || matchingLines / totalNonEmptyLines >= 0.5) {
            yield block;
            break;
          }
        }
        break;
      }
    }
  }
};

/**
 * Level 9: Multi-Occurrence Replacer
 * Handles multiple occurrences of the same pattern
 */
export const MultiOccurrenceReplacer: ReplacerFunction = function* (content, find) {
  let startIndex = 0;

  while (true) {
    const index = content.indexOf(find, startIndex);
    if (index === -1) break;

    yield find;
    startIndex = index + find.length;
  }
};

/**
 * Edlide 9-Level Apply System Configuration
 */
export const EDLIDE_APPLY_LEVELS: ApplyLevel[] = [
  {
    level: 1,
    name: "Simple Match",
    description: "Direct string matching with exact content",
    replacer: SimpleReplacer,
    priority: 1
  },
  {
    level: 2,
    name: "Line Trimmed",
    description: "Matches lines ignoring leading/trailing whitespace",
    replacer: LineTrimmedReplacer,
    priority: 2
  },
  {
    level: 3,
    name: "Block Anchor",
    description: "Uses first and last lines as anchors for block matching",
    replacer: BlockAnchorReplacer,
    priority: 3
  },
  {
    level: 4,
    name: "Whitespace Normalized",
    description: "Normalizes all whitespace to single spaces",
    replacer: WhitespaceNormalizedReplacer,
    priority: 4
  },
  {
    level: 5,
    name: "Indentation Flexible",
    description: "Ignores indentation differences",
    replacer: IndentationFlexibleReplacer,
    priority: 5
  },
  {
    level: 6,
    name: "Escape Normalized",
    description: "Handles escaped characters and strings",
    replacer: EscapeNormalizedReplacer,
    priority: 6
  },
  {
    level: 7,
    name: "Trimmed Boundary",
    description: "Handles content with extra whitespace at boundaries",
    replacer: TrimmedBoundaryReplacer,
    priority: 7
  },
  {
    level: 8,
    name: "Context Aware",
    description: "Uses surrounding context for intelligent matching",
    replacer: ContextAwareReplacer,
    priority: 8
  },
  {
    level: 9,
    name: "Multi-Occurrence",
    description: "Handles multiple occurrences of the same pattern",
    replacer: MultiOccurrenceReplacer,
    priority: 9
  }
];

/**
 * Main replace function using the 9-level system
 */
export function edlideReplace(content: string, oldString: string, newString: string, replaceAll = false): string {
  if (oldString === newString) {
    throw new Error("oldString and newString must be different");
  }

  let notFound = true;

  for (const level of EDLIDE_APPLY_LEVELS) {
    for (const search of level.replacer(content, oldString)) {
      const index = content.indexOf(search);
      if (index === -1) continue;
      notFound = false;
      if (replaceAll) {
        return content.replaceAll(search, newString);
      }
      const lastIndex = content.lastIndexOf(search);
      if (index !== lastIndex) continue;
      return content.substring(0, index) + newString + content.substring(index + search.length);
    }
  }

  if (notFound) {
    throw new Error("oldString not found in content");
  }
  throw new Error(
    "Found multiple matches for oldString. Provide more surrounding lines in oldString to identify the correct match.",
  );
}

/**
 * Get the highest level that successfully matches
 */
export function getApplyLevel(content: string, oldString: string): ApplyLevel | null {
  for (const level of EDLIDE_APPLY_LEVELS) {
    for (const search of level.replacer(content, oldString)) {
      const index = content.indexOf(search);
      if (index !== -1) {
        return level;
      }
    }
  }
  return null;
}