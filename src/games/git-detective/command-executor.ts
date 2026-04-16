import { ParsedCommand, GameState, BisectState, Commit, Clue, ClueTrigger } from "./types";

export interface ExecResult {
  output: string;
  /** HTML output (with span classes for coloring) */
  html: string;
  /** Clue IDs discovered by this command */
  discoveredClues: string[];
  /** Whether the case was just solved */
  solved: boolean;
}

/**
 * Execute a parsed command against the game state.
 * Returns formatted output and triggers clue discovery.
 */
export function executeCommand(cmd: ParsedCommand, state: GameState): ExecResult {
  if (cmd.base === "help") return execHelp();
  if (cmd.base === "clear") return { output: "", html: "", discoveredClues: [], solved: false };
  if (cmd.base === "ls") return execLs(state);
  if (cmd.base === "solve") return execSolve(cmd, state);

  if (cmd.base === "git") {
    switch (cmd.sub) {
      case "log":
        return execLog(cmd, state);
      case "show":
        return execShow(cmd, state);
      case "diff":
        return execDiff(cmd, state);
      case "blame":
        return execBlame(cmd, state);
      case "bisect":
        return execBisect(cmd, state);
      default:
        return errorResult(`git: '${cmd.sub}' is not a git command. Type 'help' for available commands.`);
    }
  }

  return errorResult(`command not found: ${cmd.base}. Type 'help' for available commands.`);
}

// ── Help ──────────────────────────────────────────────

function execHelp(): ExecResult {
  const lines = [
    '<span class="term-bold term-info">Available Commands:</span>',
    "",
    '  <span class="term-hash">git log</span>              Show commit history',
    '  <span class="term-hash">git log --oneline</span>    Compact commit history',
    '  <span class="term-hash">git log -n &lt;N&gt;</span>       Show last N commits',
    '  <span class="term-hash">git show &lt;hash&gt;</span>      Show commit details and diff',
    '  <span class="term-hash">git diff &lt;a&gt; &lt;b&gt;</span>     Show diff between two commits',
    '  <span class="term-hash">git diff &lt;hash&gt;~1 &lt;hash&gt;</span>  Show what a commit changed',
    '  <span class="term-hash">git blame &lt;file&gt;</span>    Show who last changed each line',
    '  <span class="term-hash">git bisect start</span>     Begin binary search for bad commit',
    '  <span class="term-hash">git bisect bad</span>       Mark current commit as bad',
    '  <span class="term-hash">git bisect good &lt;hash&gt;</span>  Mark a commit as good',
    "",
    '  <span class="term-hash">ls</span>                   List files in the repo',
    '  <span class="term-hash">solve &lt;hash&gt;</span>         Submit your answer',
    '  <span class="term-hash">clear</span>                Clear the terminal',
    '  <span class="term-hash">help</span>                 Show this message',
  ];
  return { output: "", html: lines.join("\n"), discoveredClues: [], solved: false };
}

// ── ls ────────────────────────────────────────────────

function execLs(state: GameState): ExecResult {
  const html = state.currentCase.files
    .map((f) => `<span class="term-file">${esc(f)}</span>`)
    .join("\n");
  return { output: "", html, discoveredClues: [], solved: false };
}

// ── git log ───────────────────────────────────────────

function execLog(cmd: ParsedCommand, state: GameState): ExecResult {
  const oneline = !!cmd.flags["oneline"];
  let limit = state.currentCase.commits.length;
  if (cmd.flags["n"]) {
    const n = parseInt(cmd.flags["n"] as string, 10);
    if (!isNaN(n) && n > 0) limit = n;
  }

  const commits = [...state.currentCase.commits].reverse().slice(0, limit);
  const discovered = checkClues(state, { type: "log" });
  let html: string;

  if (oneline) {
    html = commits
      .map(
        (c) =>
          `<span class="term-hash">${esc(c.hash)}</span> <span class="term-message">${esc(c.message)}</span>`
      )
      .join("\n");
  } else {
    html = commits
      .map(
        (c) =>
          [
            `<span class="term-hash">commit ${esc(c.hash)}</span>`,
            `Author: <span class="term-author">${esc(c.author)}</span> &lt;${esc(c.email)}&gt;`,
            `Date:   <span class="term-date">${esc(formatDate(c.date))}</span>`,
            "",
            `    <span class="term-message">${esc(c.message)}</span>`,
            "",
          ].join("\n")
      )
      .join("\n");
  }

  return { output: "", html, discoveredClues: discovered, solved: false };
}

// ── git show ──────────────────────────────────────────

function execShow(cmd: ParsedCommand, state: GameState): ExecResult {
  if (cmd.args.length === 0) {
    return errorResult("usage: git show <commit-hash>");
  }

  const hash = cmd.args[0];
  const commit = findCommit(state, hash);
  if (!commit) {
    return errorResult(`fatal: bad object ${hash}`);
  }

  const discovered = checkClues(state, { type: "show", hash: commit.hash });
  const lines: string[] = [
    `<span class="term-hash">commit ${esc(commit.hash)}</span>`,
    `Author: <span class="term-author">${esc(commit.author)}</span> &lt;${esc(commit.email)}&gt;`,
    `Date:   <span class="term-date">${esc(formatDate(commit.date))}</span>`,
    "",
    `    <span class="term-message">${esc(commit.message)}</span>`,
    "",
  ];

  for (const [path, change] of Object.entries(commit.files)) {
    lines.push(formatDiff(change.diff, path));
  }

  return { output: "", html: lines.join("\n"), discoveredClues: discovered, solved: false };
}

// ── git diff ──────────────────────────────────────────

function execDiff(cmd: ParsedCommand, state: GameState): ExecResult {
  if (cmd.args.length < 2) {
    return errorResult("usage: git diff <commit1> <commit2>");
  }

  let hashA = cmd.args[0];
  let hashB = cmd.args[1];

  // Handle hash~1 syntax
  const tildeA = parseTilde(hashA);
  const tildeB = parseTilde(hashB);
  if (tildeA) hashA = tildeA;
  if (tildeB) hashB = tildeB;

  // If one of the original args had ~1, we want the diff of the later commit
  const rawA = cmd.args[0];
  const rawB = cmd.args[1];

  // Find which commit to show the diff of
  // Common pattern: git diff abc~1 abc  → show diff of commit abc
  if (rawA.includes("~1") && !rawB.includes("~")) {
    const commit = findCommit(state, hashB);
    if (!commit) return errorResult(`fatal: bad object ${rawB}`);

    const discovered = checkClues(state, { type: "diff", hash: commit.hash });
    const lines: string[] = [];
    for (const [path, change] of Object.entries(commit.files)) {
      lines.push(formatDiff(change.diff, path));
    }
    return { output: "", html: lines.join("\n"), discoveredClues: discovered, solved: false };
  }

  // General case: show diff between two commits
  // Find the later commit and show its diff
  const commitB = findCommit(state, hashB);
  if (!commitB) return errorResult(`fatal: bad object ${hashB}`);

  const discovered = checkClues(state, { type: "diff", hash: commitB.hash });
  const lines: string[] = [];
  for (const [path, change] of Object.entries(commitB.files)) {
    lines.push(formatDiff(change.diff, path));
  }
  return { output: "", html: lines.join("\n"), discoveredClues: discovered, solved: false };
}

// ── git blame ─────────────────────────────────────────

function execBlame(cmd: ParsedCommand, state: GameState): ExecResult {
  if (cmd.args.length === 0) {
    return errorResult("usage: git blame <file>");
  }

  const filePath = cmd.args[0];
  if (!state.currentCase.files.includes(filePath)) {
    return errorResult(`fatal: no such path '${filePath}' in HEAD`);
  }

  // Find the last commit that touched this file
  const commits = state.currentCase.commits;
  let lastCommit: typeof commits[0] | null = null;
  for (let i = commits.length - 1; i >= 0; i--) {
    if (commits[i].files[filePath]) {
      lastCommit = commits[i];
      break;
    }
  }

  if (!lastCommit || !lastCommit.files[filePath]) {
    return errorResult(`fatal: no such path '${filePath}' in HEAD`);
  }

  const discovered = checkClues(state, { type: "blame", file: filePath });
  const contentLines = lastCommit.files[filePath].contentAfter;

  // Build blame output — attribute each line to the last commit that touched this file
  // For simplicity, build a blame map from all commits
  const blameMap = buildBlameMap(state, filePath);
  const lines = blameMap.map(
    (b, i) =>
      `<span class="term-blame-hash">${esc(b.hash)}</span> ` +
      `<span class="term-blame-author">(${esc(b.author.padEnd(16))})</span> ` +
      `<span class="term-blame-line">${String(i + 1).padStart(3)}</span> ` +
      `${esc(contentLines[i] ?? "")}`
  );

  return { output: "", html: lines.join("\n"), discoveredClues: discovered, solved: false };
}

/**
 * Build a simple blame map — each line attributed to the last commit
 * that had this file in its changeset.
 * For lines not directly touched by a diff, attribute to the most recent
 * commit that modified the file.
 */
function buildBlameMap(
  state: GameState,
  filePath: string
): Array<{ hash: string; author: string }> {
  // Get the final content of the file
  const commits = state.currentCase.commits;
  let finalContent: string[] = [];
  let lastHash = "";
  let lastAuthor = "";

  for (const commit of commits) {
    if (commit.files[filePath]) {
      finalContent = commit.files[filePath].contentAfter;
      lastHash = commit.hash;
      lastAuthor = commit.author;
    }
  }

  // Simple approach: for each line, find the latest commit that
  // has a diff hunk mentioning it (via + lines). Fall back to the
  // earliest commit that has this file.
  const result: Array<{ hash: string; author: string }> = finalContent.map(() => ({
    hash: lastHash,
    author: lastAuthor,
  }));

  // Walk commits in order, attribute added lines to the commit that added them
  for (const commit of commits) {
    const change = commit.files[filePath];
    if (!change) continue;
    const addedLines = extractAddedLines(change.diff);
    for (const line of addedLines) {
      // Find this line in the final content
      const idx = finalContent.findIndex(
        (l) => l.trim() === line.trim() && result[finalContent.indexOf(l)]
      );
      if (idx >= 0) {
        result[idx] = { hash: commit.hash, author: commit.author };
      }
    }
  }

  return result;
}

function extractAddedLines(diff: string): string[] {
  return diff
    .split("\n")
    .filter((l) => l.startsWith("+") && !l.startsWith("+++") && !l.startsWith("+++ "))
    .map((l) => l.slice(1));
}

// ── git bisect ────────────────────────────────────────

function execBisect(cmd: ParsedCommand, state: GameState): ExecResult {
  if (cmd.args.length === 0) {
    return errorResult("usage: git bisect <start|good|bad|reset>");
  }

  const sub = cmd.args[0].toLowerCase();

  switch (sub) {
    case "start":
      return bisectStart(state);
    case "bad":
      return bisectBad(cmd, state);
    case "good":
      return bisectGood(cmd, state);
    case "reset":
      return bisectReset(state);
    default:
      return errorResult(`unknown bisect command: ${sub}`);
  }
}

function bisectStart(state: GameState): ExecResult {
  if (state.bisect.active) {
    return infoResult("Bisect already in progress. Use 'git bisect reset' to start over.");
  }
  state.bisect.active = true;
  state.bisect.goodHash = null;
  state.bisect.badHash = null;
  state.bisect.remaining = [];
  state.bisect.currentIndex = null;
  state.bisect.steps = 0;
  state.bisect.found = false;
  state.bisect.foundHash = null;

  const html = [
    '<span class="term-info">Bisect started.</span>',
    'Mark the current state: <span class="term-hash">git bisect bad</span>',
    'Then mark a known good commit: <span class="term-hash">git bisect good &lt;hash&gt;</span>',
  ].join("\n");

  return { output: "", html, discoveredClues: [], solved: false };
}

function bisectBad(cmd: ParsedCommand, state: GameState): ExecResult {
  if (!state.bisect.active) {
    return errorResult("No bisect in progress. Run 'git bisect start' first.");
  }

  const commits = state.currentCase.commits;

  if (!state.bisect.badHash) {
    // Mark HEAD (latest commit) as bad
    const hash = cmd.args.length > 1 ? cmd.args[1] : commits[commits.length - 1].hash;
    const commit = findCommit(state, hash);
    if (!commit) return errorResult(`fatal: bad object ${hash}`);

    state.bisect.badHash = commit.hash;

    if (state.bisect.goodHash) {
      return bisectStep(state);
    }

    return infoResult(
      `Marked <span class="term-hash">${esc(commit.hash)}</span> as bad.\n` +
        'Now mark a known good commit: <span class="term-hash">git bisect good &lt;hash&gt;</span>'
    );
  }

  // During bisect: mark current midpoint as bad
  if (state.bisect.currentIndex !== null) {
    const midCommit = commits[state.bisect.currentIndex];
    state.bisect.badHash = midCommit.hash;
    // Narrow range: bad moves down
    const badIdx = state.bisect.currentIndex;
    state.bisect.remaining = state.bisect.remaining.filter((i) => i <= badIdx);
    return bisectStep(state);
  }

  return errorResult("Bisect state error. Run 'git bisect reset' and try again.");
}

function bisectGood(cmd: ParsedCommand, state: GameState): ExecResult {
  if (!state.bisect.active) {
    return errorResult("No bisect in progress. Run 'git bisect start' first.");
  }

  const commits = state.currentCase.commits;

  if (!state.bisect.goodHash) {
    if (cmd.args.length < 2) {
      return errorResult("usage: git bisect good <commit-hash>");
    }
    const hash = cmd.args[1];
    const commit = findCommit(state, hash);
    if (!commit) return errorResult(`fatal: bad object ${hash}`);

    state.bisect.goodHash = commit.hash;

    if (state.bisect.badHash) {
      // Initialize the range
      const goodIdx = commits.findIndex((c) => c.hash === state.bisect.goodHash);
      const badIdx = commits.findIndex((c) => c.hash === state.bisect.badHash);
      state.bisect.remaining = [];
      for (let i = goodIdx; i <= badIdx; i++) {
        state.bisect.remaining.push(i);
      }
      return bisectStep(state);
    }

    return infoResult(
      `Marked <span class="term-hash">${esc(commit.hash)}</span> as good.\n` +
        'Now mark the bad commit: <span class="term-hash">git bisect bad</span>'
    );
  }

  // During bisect: mark current midpoint as good
  if (state.bisect.currentIndex !== null) {
    const midCommit = commits[state.bisect.currentIndex];
    state.bisect.goodHash = midCommit.hash;
    // Narrow range: good moves up
    const goodIdx = state.bisect.currentIndex;
    state.bisect.remaining = state.bisect.remaining.filter((i) => i >= goodIdx);
    return bisectStep(state);
  }

  return errorResult("Bisect state error. Run 'git bisect reset' and try again.");
}

function bisectStep(state: GameState): ExecResult {
  const commits = state.currentCase.commits;
  state.bisect.steps++;

  if (state.bisect.remaining.length <= 2) {
    // Found it — the first bad commit is the one after the last good
    const goodIdx = commits.findIndex((c) => c.hash === state.bisect.goodHash);
    const foundIdx = goodIdx + 1;
    const found = commits[foundIdx];

    if (!found) {
      return errorResult("Bisect error: could not determine the bad commit.");
    }

    state.bisect.found = true;
    state.bisect.foundHash = found.hash;

    const discovered = checkClues(state, { type: "bisect-complete" });

    const html = [
      `<span class="term-success">${esc(found.hash)} is the first bad commit</span>`,
      "",
      `<span class="term-hash">commit ${esc(found.hash)}</span>`,
      `Author: <span class="term-author">${esc(found.author)}</span> &lt;${esc(found.email)}&gt;`,
      `Date:   <span class="term-date">${esc(formatDate(found.date))}</span>`,
      "",
      `    <span class="term-message">${esc(found.message)}</span>`,
      "",
      `<span class="term-info">Bisect completed in ${state.bisect.steps} steps.</span>`,
      `Use <span class="term-hash">git show ${esc(found.hash)}</span> to examine the commit.`,
      `Use <span class="term-hash">solve ${esc(found.hash)}</span> to close the case.`,
    ].join("\n");

    return { output: "", html, discoveredClues: discovered, solved: false };
  }

  // Pick midpoint
  const mid = Math.floor(state.bisect.remaining.length / 2);
  const midIdx = state.bisect.remaining[mid];
  state.bisect.currentIndex = midIdx;
  const midCommit = commits[midIdx];

  const remaining = state.bisect.remaining.length;
  const stepsLeft = Math.ceil(Math.log2(remaining));

  const html = [
    `<span class="term-info">Bisecting: ${remaining} revisions left to test (roughly ${stepsLeft} steps)</span>`,
    "",
    `Testing: <span class="term-hash">${esc(midCommit.hash)}</span> — ${esc(midCommit.message)}`,
    `Author:  <span class="term-author">${esc(midCommit.author)}</span>`,
    `Date:    <span class="term-date">${esc(formatDate(midCommit.date))}</span>`,
    "",
    'Is this commit good or bad?',
    '  <span class="term-hash">git bisect good</span>  — search works at this point',
    '  <span class="term-hash">git bisect bad</span>   — search is broken at this point',
  ].join("\n");

  return { output: "", html, discoveredClues: [], solved: false };
}

function bisectReset(state: GameState): ExecResult {
  state.bisect = {
    active: false,
    goodHash: null,
    badHash: null,
    remaining: [],
    currentIndex: null,
    steps: 0,
    found: false,
    foundHash: null,
  };
  return infoResult("Bisect session reset.");
}

// ── solve ─────────────────────────────────────────────

function execSolve(cmd: ParsedCommand, state: GameState): ExecResult {
  if (cmd.args.length === 0) {
    return errorResult("usage: solve <commit-hash>");
  }

  const hash = cmd.args[0];
  const commit = findCommit(state, hash);
  if (!commit) {
    return errorResult(`Unknown commit: ${hash}`);
  }

  if (commit.hash === state.currentCase.solutionHash) {
    state.solved = true;
    const discovered = checkClues(state, { type: "solve", hash: commit.hash });
    const html = [
      '<span class="term-success">CASE SOLVED</span>',
      "",
      `<span class="term-clue">${esc(state.currentCase.solvedMessage)}</span>`,
    ].join("\n");
    return { output: "", html, discoveredClues: discovered, solved: true };
  }

  return {
    output: "",
    html: [
      '<span class="term-error">Incorrect.</span>',
      `Commit <span class="term-hash">${esc(commit.hash)}</span> is not the one that broke things.`,
      "Keep investigating. Check the diffs more carefully.",
    ].join("\n"),
    discoveredClues: [],
    solved: false,
  };
}

// ── Clue Discovery ────────────────────────────────────

function checkClues(state: GameState, trigger: ClueTrigger): string[] {
  const discovered: string[] = [];

  for (const clue of state.currentCase.clues) {
    if (clue.discovered) continue;
    if (matchesTrigger(clue.trigger, trigger)) {
      clue.discovered = true;
      discovered.push(clue.id);
    }
  }

  return discovered;
}

function matchesTrigger(clueTrigger: ClueTrigger, actual: ClueTrigger): boolean {
  if (clueTrigger.type !== actual.type) return false;

  switch (clueTrigger.type) {
    case "log":
    case "bisect-complete":
      return true;
    case "show":
      return (actual as { type: "show"; hash: string }).hash === clueTrigger.hash;
    case "diff":
      return (actual as { type: "diff"; hash: string }).hash === clueTrigger.hash;
    case "blame":
      return (actual as { type: "blame"; file: string }).file === clueTrigger.file;
    case "solve":
      return (actual as { type: "solve"; hash: string }).hash === clueTrigger.hash;
    default:
      return false;
  }
}

// ── Helpers ───────────────────────────────────────────

function findCommit(state: GameState, hash: string): Commit | undefined {
  // Strip ~1 suffix if present
  const clean = hash.replace(/~\d+$/, "");
  return state.currentCase.commits.find(
    (c) => c.hash === clean || c.hash.startsWith(clean)
  );
}

function parseTilde(hashStr: string): string | null {
  const match = hashStr.match(/^(.+)~(\d+)$/);
  if (!match) return null;
  return match[1];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())} ${d.getFullYear()}`;
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDiff(diff: string, _path: string): string {
  return diff
    .split("\n")
    .map((line) => {
      if (line.startsWith("diff --git")) return `<span class="term-bold">${esc(line)}</span>`;
      if (line.startsWith("---") || line.startsWith("+++"))
        return `<span class="term-bold">${esc(line)}</span>`;
      if (line.startsWith("@@"))
        return `<span class="term-hunk">${esc(line)}</span>`;
      if (line.startsWith("+")) return `<span class="term-add">${esc(line)}</span>`;
      if (line.startsWith("-")) return `<span class="term-del">${esc(line)}</span>`;
      if (line.startsWith("index") || line.startsWith("new file"))
        return `<span class="term-muted">${esc(line)}</span>`;
      return esc(line);
    })
    .join("\n");
}

function errorResult(msg: string): ExecResult {
  return {
    output: "",
    html: `<span class="term-error">${msg}</span>`,
    discoveredClues: [],
    solved: false,
  };
}

function infoResult(msg: string): ExecResult {
  return {
    output: "",
    html: `<span class="term-info">${msg}</span>`,
    discoveredClues: [],
    solved: false,
  };
}
