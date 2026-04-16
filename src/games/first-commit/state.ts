/** State management for First Commit */

import { GameState, FileObj, CommitObj, BranchState } from "./types";

export function createInitialState(): GameState {
  return {
    chapter: 1,
    chapterComplete: false,
    initialized: false,
    workingDir: [],
    stagingArea: [],
    commits: [],
    branches: [{ name: "main", commits: [], headHash: "" }],
    currentBranch: "main",
    storyText: "",
  };
}

/** Generate a pseudo-random 7-char hex hash */
export function makeHash(): string {
  const chars = "0123456789abcdef";
  let h = "";
  for (let i = 0; i < 7; i++) {
    h += chars[Math.floor(Math.random() * chars.length)];
  }
  return h;
}

/** Deep-clone a file for staging/commit snapshots */
export function cloneFile(f: FileObj): FileObj {
  return { name: f.name, content: f.content, status: f.status };
}

/** Stage a file: add a copy to staging, mark the copy as staged */
export function stageFile(state: GameState, fileName: string): void {
  const file = state.workingDir.find((f) => f.name === fileName);
  if (!file) return;
  // Remove existing staged copy if present
  state.stagingArea = state.stagingArea.filter((f) => f.name !== fileName);
  const copy = cloneFile(file);
  copy.status = "staged";
  state.stagingArea.push(copy);
}

/** Unstage a file: remove from staging */
export function unstageFile(state: GameState, fileName: string): void {
  state.stagingArea = state.stagingArea.filter((f) => f.name !== fileName);
}

/** Commit staged files: create a commit object, update branch */
export function commitFiles(state: GameState, message: string): CommitObj {
  const hash = makeHash();
  const snapshot = state.stagingArea.map((f) => {
    const c = cloneFile(f);
    c.status = "committed";
    return c;
  });

  // Also include previously committed files not in this staging
  for (const prev of getLatestFiles(state)) {
    if (!snapshot.find((f) => f.name === prev.name)) {
      snapshot.push(cloneFile(prev));
    }
  }

  const commit: CommitObj = {
    hash,
    message,
    timestamp: Date.now(),
    files: snapshot,
    branch: state.currentBranch,
  };

  state.commits.push(commit);
  state.stagingArea = [];

  // Update working dir files to committed status
  for (const wf of state.workingDir) {
    if (snapshot.find((sf) => sf.name === wf.name && sf.content === wf.content)) {
      wf.status = "committed";
    }
  }

  // Update branch
  const branch = state.branches.find((b) => b.name === state.currentBranch);
  if (branch) {
    branch.commits.push(hash);
    branch.headHash = hash;
  }

  return commit;
}

/** Get files from the latest commit on the current branch */
export function getLatestFiles(state: GameState): FileObj[] {
  const branch = state.branches.find((b) => b.name === state.currentBranch);
  if (!branch || branch.commits.length === 0) return [];
  const latest = state.commits.find((c) => c.hash === branch.headHash);
  return latest ? latest.files.map(cloneFile) : [];
}

/** Get commits for the current branch */
export function getBranchCommits(state: GameState, branchName?: string): CommitObj[] {
  const name = branchName || state.currentBranch;
  const branch = state.branches.find((b) => b.name === name);
  if (!branch) return [];
  return branch.commits
    .map((h) => state.commits.find((c) => c.hash === h))
    .filter((c): c is CommitObj => c !== undefined);
}

/** Switch to a branch, updating working directory */
export function switchBranch(state: GameState, branchName: string): void {
  const branch = state.branches.find((b) => b.name === branchName);
  if (!branch) return;
  state.currentBranch = branchName;
  state.stagingArea = [];

  if (branch.headHash) {
    const headCommit = state.commits.find((c) => c.hash === branch.headHash);
    if (headCommit) {
      state.workingDir = headCommit.files.map((f) => {
        const c = cloneFile(f);
        c.status = "committed";
        return c;
      });
    }
  }
}

/** Create a new branch at the current HEAD */
export function createBranch(state: GameState, name: string): void {
  const current = state.branches.find((b) => b.name === state.currentBranch);
  if (!current) return;
  state.branches.push({
    name,
    commits: [...current.commits],
    headHash: current.headHash,
  });
}
