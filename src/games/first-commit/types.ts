/** Shared types for First Commit */

export interface FileObj {
  name: string;
  content: string;
  status: "untracked" | "modified" | "staged" | "committed";
}

export interface CommitObj {
  hash: string;
  message: string;
  timestamp: number;
  files: FileObj[];
  branch: string;
}

export interface BranchState {
  name: string;
  commits: string[];
  headHash: string;
}

export interface GameState {
  chapter: number;
  chapterComplete: boolean;
  initialized: boolean;
  workingDir: FileObj[];
  stagingArea: FileObj[];
  commits: CommitObj[];
  branches: BranchState[];
  currentBranch: string;
  storyText: string;
}

export interface Chapter {
  id: number;
  title: string;
  enter(root: HTMLElement, state: GameState, onComplete: () => void): void;
}
