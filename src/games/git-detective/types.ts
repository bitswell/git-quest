/** Shared types for Git Detective */

export interface Commit {
  hash: string;
  author: string;
  email: string;
  date: string; // ISO-8601
  message: string;
  /** Files changed in this commit, keyed by path */
  files: Record<string, FileChange>;
}

export interface FileChange {
  /** Unified diff hunk(s) for this file in this commit */
  diff: string;
  /** Full file content AFTER this commit (used for blame) */
  contentAfter: string[];
}

export interface BlameLine {
  hash: string;
  author: string;
  lineNum: number;
  content: string;
}

export interface Clue {
  id: string;
  title: string;
  description: string;
  /** Which command triggers this clue */
  trigger: ClueTrigger;
  discovered: boolean;
}

export type ClueTrigger =
  | { type: "log" }
  | { type: "show"; hash: string }
  | { type: "diff"; hash: string }
  | { type: "blame"; file: string }
  | { type: "bisect-complete" }
  | { type: "solve"; hash: string };

export interface Case {
  id: string;
  title: string;
  subtitle: string;
  briefing: string;
  objectives: string[];
  commits: Commit[];
  /** Files in the repo (paths) */
  files: string[];
  clues: Clue[];
  /** The hash of the commit that broke things */
  solutionHash: string;
  /** Flavor text when player solves it */
  solvedMessage: string;
}

export interface BisectState {
  active: boolean;
  goodHash: string | null;
  badHash: string | null;
  /** Indices into the commit array: commits between good and bad */
  remaining: number[];
  currentIndex: number | null;
  steps: number;
  found: boolean;
  foundHash: string | null;
}

export interface GameState {
  currentCase: Case;
  bisect: BisectState;
  solved: boolean;
  commandHistory: string[];
  historyIndex: number;
}

export interface ParsedCommand {
  base: string; // "git" or "help" or "clear" or "solve" or "ls"
  sub: string | null; // "log", "diff", "show", "blame", "bisect"
  args: string[];
  flags: Record<string, string | boolean>;
}
