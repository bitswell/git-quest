import { ParsedCommand } from "./types";

/**
 * Parse a raw input string into a structured command.
 * Handles: git log, git show, git diff, git blame, git bisect,
 *          help, clear, solve, ls
 */
export function parseCommand(raw: string): ParsedCommand | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const tokens = tokenize(trimmed);
  if (tokens.length === 0) return null;

  const base = tokens[0].toLowerCase();

  // Non-git commands
  if (base === "help" || base === "clear" || base === "ls") {
    return { base, sub: null, args: tokens.slice(1), flags: {} };
  }

  if (base === "solve") {
    return { base: "solve", sub: null, args: tokens.slice(1), flags: {} };
  }

  // Git commands
  if (base === "git" && tokens.length >= 2) {
    const sub = tokens[1].toLowerCase();
    const rest = tokens.slice(2);
    const { args, flags } = parseArgs(rest);
    return { base: "git", sub, args, flags };
  }

  // Unknown
  return { base, sub: null, args: tokens.slice(1), flags: {} };
}

/**
 * Split input into tokens, respecting quoted strings.
 */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";

  for (const ch of input) {
    if (inQuote) {
      if (ch === quoteChar) {
        inQuote = false;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = true;
      quoteChar = ch;
    } else if (ch === " " || ch === "\t") {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

/**
 * Separate positional args from flags.
 * Supports: -n 5, --oneline, --stat, etc.
 */
function parseArgs(tokens: string[]): {
  args: string[];
  flags: Record<string, string | boolean>;
} {
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];

    if (t.startsWith("--")) {
      const key = t.slice(2);
      // Check if next token looks like a value (not another flag)
      if (i + 1 < tokens.length && !tokens[i + 1].startsWith("-")) {
        flags[key] = tokens[i + 1];
        i += 2;
      } else {
        flags[key] = true;
        i++;
      }
    } else if (t.startsWith("-") && t.length > 1) {
      const key = t.slice(1);
      // -n 5 style
      if (key.length === 1 && i + 1 < tokens.length && !tokens[i + 1].startsWith("-")) {
        flags[key] = tokens[i + 1];
        i += 2;
      } else {
        flags[key] = true;
        i++;
      }
    } else {
      args.push(t);
      i++;
    }
  }

  return { args, flags };
}
