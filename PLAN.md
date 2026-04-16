# Git Detective — Implementation Plan

## Approach

DOM-based rendering rather than Canvas. A terminal/investigation game is fundamentally text — typing commands, reading output, collecting clues. Canvas would mean reimplementing text layout, cursor blinking, scrolling, and selection for zero benefit. DOM gives us all of that for free, styled with CSS to look like a noir terminal.

The game has three panels:
1. **Case Briefing** (top-left) — description of the case, objectives
2. **Terminal** (center/bottom) — where the player types git commands and sees output
3. **Evidence Board** (right sidebar) — clues collected so far, updates as player discovers things

Architecture is a state machine per case. Each case defines:
- A simulated git repository (commits, files, diffs, blame data)
- A set of clues that can be discovered by running specific commands
- Win condition: collecting the required clues and identifying the culprit/commit

## File Structure

```
src/games/git-detective/
  index.ts              — entry point, exports default function, manages case selection
  terminal.ts           — Terminal UI component: input handling, output rendering, command history
  command-parser.ts     — Parses player input into structured commands (git log, git diff, etc.)
  command-executor.ts   — Executes parsed commands against the simulated repo, returns output strings
  evidence-board.ts     — Evidence/clue board UI component
  case-briefing.ts      — Case briefing panel UI
  types.ts              — Shared types: Case, Commit, FileState, Clue, etc.
  cases/
    case1.ts            — "The Broken Deploy" — simple git log + diff case
    case2.ts            — "The Vanishing Feature" — git bisect case with longer history
  styles.ts             — Injects scoped CSS for the detective game
```

## Implementation Steps

1. **types.ts** — Define all data types first
2. **styles.ts** — CSS injection for noir aesthetic (dark bg, green/amber monospace text, panel layout)
3. **cases/case1.ts** — Build first case data: commits, files, diffs, blame, clues, win condition
4. **cases/case2.ts** — Build second case data with longer history for bisect
5. **terminal.ts** — Terminal component with input field, output area, command history (up/down arrow)
6. **command-parser.ts** — Parse git commands: log, diff, blame, bisect, show, help
7. **command-executor.ts** — Execute commands against case data, produce realistic output, trigger clue discovery
8. **evidence-board.ts** — Clue board that updates when new evidence is found
9. **case-briefing.ts** — Case briefing panel with objectives
10. **index.ts** — Wire everything together: case select screen, game screen with all panels

## Case Design

### Case 1: "The Broken Deploy"

**Scenario**: The team's web app broke in production Friday night. The deploy pipeline shows the last 6 commits from that day. The player must figure out which commit broke things and who did it.

**Simulated repo**: 6 commits across 3 authors
- `a1b2c3d` — Alice — "Update homepage hero section" (CSS change, harmless)
- `e4f5g6h` — Bob — "Add caching layer for API responses" (adds cache.ts, harmless)
- `i7j8k9l` — Charlie — "Fix typo in README" (README only, harmless)
- `m0n1o2p` — Bob — "Optimize database queries" (changes db.ts — THE BAD COMMIT: accidentally deletes a WHERE clause)
- `q3r4s5t` — Alice — "Update footer links" (HTML change, harmless)
- `u6v7w8x` — Charlie — "Bump dependency versions" (package.json, harmless)

**Solution path**:
1. `git log` — see the 6 commits, note authors and messages
2. `git diff m0n1o2p~1 m0n1o2p` or `git show m0n1o2p` — reveals the deleted WHERE clause
3. `git blame src/db.ts` — shows Bob's line removing the WHERE clause

**Clues discovered**:
- Viewing the log: "6 commits deployed Friday. Three developers were active."
- Diffing the bad commit: "The WHERE clause in the user query was removed. This returns ALL users instead of just active ones."
- Blaming db.ts: "Bob made the change to the database query at line 42."

**Win condition**: Player identifies commit `m0n1o2p` as the breaking change (via a `solve` command or by collecting all key clues).

### Case 2: "The Vanishing Feature"

**Scenario**: Users report that the search feature stopped working sometime in the last two weeks. There are 12 commits in that window. Use git bisect to narrow it down efficiently.

**Simulated repo**: 12 commits across 4 authors. Commit #7 is the bad one — it refactored the search module and accidentally broke the query builder by swapping two arguments.

**Solution path**:
1. `git log` — see the 12 commits, too many to diff one by one
2. `git bisect start` — begin the bisect
3. `git bisect bad` — mark current (HEAD) as bad
4. `git bisect good abc1234` — mark oldest commit as good
5. System presents midpoint, player tests with `git diff` or `git show`, marks good/bad
6. After ~4 steps, bisect identifies the breaking commit
7. `git show` or `git diff` on the identified commit reveals the swapped arguments

**Clues discovered through bisect steps and final examination**.

**Win condition**: Bisect completes and player confirms the identified commit.

## Terminal Simulation

Commands supported:
- `git log` — shows commit list (hash, author, date, message). Supports `--oneline`.
- `git log -n <N>` — limit to N commits
- `git show <hash>` — shows commit details + diff
- `git diff <hash1> <hash2>` — shows diff between two commits
- `git diff <hash>~1 <hash>` — shows what a single commit changed
- `git blame <file>` — shows annotated file with author per line
- `git bisect start` — begins bisect session
- `git bisect good <hash>` / `git bisect bad` — marks commits during bisect
- `help` — lists available commands
- `solve <hash>` — submit answer (the commit the player thinks broke things)
- `clear` — clears terminal
- `ls` — lists files in the simulated repo

Output formatting mimics real git: colored hashes (gold), author names, dates, diff hunks with +/- lines in green/red. All rendered as styled DOM elements.

## Key Design Decisions

1. **DOM over Canvas** — Text-heavy game. DOM handles text rendering, scrolling, input fields, and selection natively. No reason to fight Canvas for this.

2. **Noir aesthetic** — Dark background (#0a0a0a), amber/green monospace text, subtle scan-line effect via CSS. Terminal prompt styled as `detective@case-01 $`. Evidence board has a "pinboard" feel — dark cork background, clue cards.

3. **No shared utilities used** — The Canvas and InputManager utilities are designed for action games. This game is entirely text/DOM driven. Using them would be forcing a square peg.

4. **Scoped CSS via JS injection** — Rather than modifying the global style.css, inject scoped styles when the game mounts. Clean separation.

5. **Realistic git output** — Output strings are hand-crafted to look like actual terminal output. Hashes are truncated 7-char hex. Dates are ISO format. Diffs use standard unified format with @@ hunks.

6. **Command history** — Up/down arrows cycle through previous commands. Standard terminal behavior players expect.

7. **Progressive clue discovery** — Running commands that reveal case-relevant information automatically adds clues to the evidence board. Player doesn't have to manually "collect" — just investigating naturally builds the case.

## Risks

- **Bisect simulation complexity** — Git bisect is stateful. Need to track bisect state (started, current good/bad bounds, midpoint) and simulate the binary search correctly. Not hard, just needs careful bookkeeping.
- **Command parsing edge cases** — Players will type variations. Keep parser simple but handle common forms. Unrecognized commands get a helpful error.
- **Scope creep** — Two cases is the target. Don't build an extensible case engine. Build two good cases.

## Estimate

- **11 files** total (including 2 case data files)
- **~800-1100 lines** of TypeScript
- **Complexity**: Medium. The terminal UI and command execution are the bulk. Case data is mostly static strings. Bisect state machine is the trickiest single piece.
