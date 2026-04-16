# First Commit — Implementation Plan

## Approach

DOM-based interactive tutorial. Eight chapters, each a self-contained module. A state machine drives progression. The visual workspace renders three zones (Working Directory, Staging Area, Repository) that the user manipulates through guided interactions.

No Canvas. No framework. Plain TypeScript, DOM manipulation, scoped CSS injection — same pattern as Git Detective.

## File Structure

```
src/games/first-commit/
  index.ts              — entry point, exported default function
  styles.ts             — scoped CSS injection (injectStyles pattern)
  types.ts              — shared types: GameState, FileObj, CommitObj, Chapter, BranchState
  state.ts              — state machine: current chapter, file contents, staging, commits, branches
  workspace.ts          — renders the three-zone visual workspace (working dir, staging, repo)
  chapter-nav.ts        — chapter navigation bar, progress indicator, prev/next buttons
  narrative.ts          — chapter intro/recap text rendering, typewriter effect
  chapters/
    ch1-the-problem.ts
    ch2-git-init.ts
    ch3-making-changes.ts
    ch4-staging-area.ts
    ch5-first-commit.ts
    ch6-history.ts
    ch7-branching.ts
    ch8-merging.ts
```

Also modifies: `src/main.ts` (add game card as first entry in GAMES array).

## State Management

Central `GameState` object, not reactive — chapters mutate it and call render functions to update the DOM. Keeps it simple.

```ts
interface FileObj {
  name: string;
  content: string;
  status: "untracked" | "modified" | "staged" | "committed";
}

interface CommitObj {
  hash: string;        // short pseudo-hash (7 chars)
  message: string;
  timestamp: number;
  files: FileObj[];    // snapshot of files at this commit
  branch: string;
}

interface BranchState {
  name: string;
  commits: string[];   // commit hashes in order
  headHash: string;
}

interface GameState {
  chapter: number;           // 1-8
  chapterComplete: boolean;  // whether current chapter's task is done
  initialized: boolean;      // whether git init has been "run"
  workingDir: FileObj[];     // current working directory files
  stagingArea: FileObj[];    // currently staged files
  commits: CommitObj[];      // all commits in order
  branches: BranchState[];  // all branches
  currentBranch: string;    // active branch name
  storyText: string;        // current story file content (ch1 editor)
}
```

Chapter progression:
- Each chapter exports an `enter(root, state, onComplete)` function
- `onComplete` callback enables the "Next" button
- "Next" increments `state.chapter`, tears down current chapter, calls next chapter's `enter`
- "Previous" decrements, re-enters with preserved state (state carries forward; chapter re-renders from it)

## Chapter Design

### Chapter 1: "The Problem"

**Narrative**: "You're writing a story. You make changes. You lose work. There's no undo."

**Interaction**: A simulated text editor. User types into a textarea. After a few edits, a "disaster" button simulates a crash — text reverts to an older version. The loss is visceral.

**Visual**: Single-zone view — just a document card with an editable textarea. No git zones yet. Clean, simple. The point is: you have files and no safety net.

**What it teaches**: Why version control exists. The pain of not having it.

**Completion trigger**: User experiences the text loss (clicks the disaster button or it auto-triggers after enough edits).

### Chapter 2: "git init"

**Narrative**: "What if your folder could remember every version? That's what git does. Let's set it up."

**Interaction**: User sees a folder visualization with their file from ch1. A command prompt or button says `git init`. User clicks/types it. The three-zone workspace materializes — Working Directory zone expands, Staging Area and Repository zones fade in from nothing with an animation.

**Visual**: Transition from single-zone to three-zone layout. The .git "eye" icon or label appears. Working dir already has the file from ch1.

**What it teaches**: What `git init` does — it creates a hidden .git folder that watches your directory.

**Completion trigger**: User runs `git init` (click or type).

### Chapter 3: "Making Changes"

**Narrative**: "Git can see your files, but it doesn't track them automatically. Let's see what git notices."

**Interaction**: Three-zone workspace is visible. Working Directory has the file from ch1/2 marked "untracked" (grey). User creates a new file (click "new file" button, type a name). Files turn orange/red when modified. A `git status` display shows colored file states.

**Visual**: File cards in the Working Directory zone. Untracked = grey border. Modified = orange border. A status indicator label on each card.

**What it teaches**: Working directory, file states (untracked, modified), that git *notices* changes but doesn't save them automatically.

**Completion trigger**: User has created at least one new file and modified one file.

### Chapter 4: "The Staging Area" (KEY CHAPTER)

**Narrative**: "Before saving a snapshot, you choose WHICH changes to include. This is called staging — like packing a box before shipping it."

**Interaction**: User can drag file cards from Working Directory to Staging Area, OR click an "add" button on each file card. Files in staging turn green. User can also unstage (drag back or click "unstage"). A `git add <filename>` label appears when they stage. Visual arrow/flow animation shows the file "moving" to the staging zone.

**Visual**: Three zones clearly labeled. Drag targets highlight on hover. Files animate between zones. The staging area has a "packing box" metaphor — dashed border, "ready to save" label. Key visual: files don't LEAVE the working directory when staged — a COPY appears in staging (this is what confuses people).

**What it teaches**: `git add`, the staging area concept, that you choose what goes into each snapshot. The staging area is NOT the commit — it's the preparation step.

**Completion trigger**: User has staged at least one file.

### Chapter 5: "Your First Commit"

**Narrative**: "The staging area is packed. Time to save this snapshot forever."

**Interaction**: A "commit" button appears (enabled only when staging has files). User clicks it, gets a text input for the commit message. Types a message, confirms. A commit object materializes in the Repository zone — a card showing the hash, message, timestamp, and file snapshot. The staging area clears. Celebration moment.

**Visual**: Commit card in the Repository zone. Short hash (first 7 chars), message, timestamp. The staged files animate into the repository. Confetti or glow effect — this is the title moment of the game.

**What it teaches**: `git commit`, commit objects, commit messages, that commits are permanent snapshots.

**Completion trigger**: User creates their first commit with a message.

### Chapter 6: "History"

**Narrative**: "Every commit is a moment in time you can return to. Let's build up some history."

**Interaction**: Guided sequence: edit a file, stage it, commit it. Repeat 2-3 times with prompts. Then a vertical timeline appears showing all commits. User clicks any commit in the timeline and the Working Directory zone updates to show files as they were at that point.

**Visual**: Vertical commit timeline in the Repository zone (newest at top, oldest at bottom). Each node shows hash + message. Active commit highlighted. Clicking a commit updates the working dir view (read-only snapshot mode, clearly labeled "viewing commit [hash]").

**What it teaches**: `git log`, commit history, that you can inspect any past state.

**Completion trigger**: User has created at least 3 total commits and clicked at least one historical commit to view it.

### Chapter 7: "Branching"

**Narrative**: "What if you want to try something without risking your main work? Branches let you work in parallel."

**Interaction**: Timeline shows commits on "main". A "create branch" button + name input. User creates a branch — the timeline forks visually. User makes a commit on the new branch. Then switches back to "main" — the working directory files revert to main's state. Switches to the branch — files update again.

**Visual**: Forked timeline. Branch labels (colored tags). Current branch highlighted. Branch switch animates files changing.

**What it teaches**: `git branch`, `git checkout`/`git switch`, that branches are parallel lines of work.

**Completion trigger**: User has created a branch, made a commit on it, and switched between branches at least once.

### Chapter 8: "Merging"

**Narrative**: "You've tried your idea on a branch. It works. Time to bring it back to main."

**Interaction**: Two branches visible in the timeline. User switches to main, clicks "merge" on the other branch. The timeline lines converge into a merge commit. The merged result shows files from both branches combined.

**Visual**: Timeline convergence animation. Merge commit node is visually distinct (larger, two parent lines). Celebration screen: "You now understand the fundamentals of git!"

**What it teaches**: `git merge`, combining work from branches, merge commits.

**Completion trigger**: User performs the merge. Then a completion screen appears.

## Visual Design

### Color Palette
- Background: `#1a1a2e` (deep navy, warm but not black)
- Surface: `#16213e` (panels)
- Primary accent: `#f0883e` (warm orange — inviting, beginner-friendly)
- Success/staged: `#3fb950` (green)
- Modified/warning: `#e8a838` (amber)
- Untracked: `#8b949e` (grey)
- Text primary: `#e6e6e6`
- Text secondary: `#8b949e`
- Commit hash: `#f0883e`
- Branch main: `#58a6ff`
- Branch secondary: `#bc8cff`

### Three-Zone Workspace Layout
```
+-------------------+-------------------+-------------------+
| WORKING DIRECTORY | STAGING AREA      | REPOSITORY        |
| (Your Files)      | (Ready to Save)   | (Saved Snapshots) |
|                   |                   |                   |
| [file cards]      | [staged files]    | [commit timeline] |
|                   |                   |                   |
+-------------------+-------------------+-------------------+
```

- Three equal columns on desktop via CSS grid
- Each zone has a header with icon + label + subtitle
- Working Dir: folder icon, "Your files — make changes here"
- Staging: box/package icon, "Packed for saving"
- Repository: clock/archive icon, "Saved snapshots"
- Zones fade in progressively (ch1: only working dir, ch2: all three appear)

### File Cards
- Rounded rectangle, ~200px wide
- File name at top (bold)
- Content preview (truncated, monospace)
- Status indicator: colored left border + status label
- Draggable in ch4+ (cursor: grab, drag shadow)

### Commit Timeline
- Vertical line with circle nodes
- Each node: hash (monospace), message, timestamp
- Lines connecting commits; forks for branches
- Click to inspect

### Typography
- Body: system sans-serif (readable, not intimidating)
- Code/hashes: monospace
- Large chapter titles, generous line-height
- All narrative text at 16px minimum

## Interaction Patterns

1. **Click-to-act**: Primary interaction. Buttons for commands (git init, git add, commit, branch, merge). No actual terminal typing required (this is for complete beginners).
2. **Drag-and-drop**: Chapter 4 staging. File cards draggable from working dir to staging zone. Also an "add" button fallback for accessibility/mobile.
3. **Text input**: Chapter 1 story editor, chapter 5 commit message, chapter 7 branch name.
4. **Click-to-inspect**: Chapter 6+ commit timeline nodes.
5. **Guided flow**: Each chapter has narrative text, then an interactive task, then a recap. The "Next" button only enables after the task is done.

## Key Design Decisions

### DOM over Canvas
This game is text-heavy and UI-heavy. DOM gives us:
- Native text input handling
- CSS transitions and animations
- Accessibility (screen readers, keyboard nav)
- Responsive layout via CSS grid
- Easy drag-and-drop via native drag events or pointer events

Canvas would require reimplementing all of this. Not worth it for a tutorial.

### CSS Approach
Scoped injection via `injectStyles()` — same pattern as Git Detective. All selectors prefixed with `.fc-` (first-commit) to avoid collisions.

### No Framework
Matches the existing codebase. Plain DOM manipulation. Each chapter is a function that takes a container element and state. Keeps the bundle small and the code straightforward.

### Files as Copies, Not Moves
When a file is staged, it does NOT disappear from the working directory. A copy appears in staging. This matches how git actually works and prevents the #1 beginner misconception ("if I stage a file, is it gone from my folder?").

### No Fail States
This is an educational tool, not a game with win/lose. Every interaction succeeds. The user can't break anything. They can go backward and forward freely. No time pressure.

### Progressive Revelation
Chapters 1-2 don't show all three zones — that would overwhelm. Start with just a file, then reveal the workspace incrementally. By chapter 4, the full three-zone layout is visible and stays.

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Drag-and-drop is finicky on mobile/touch | Provide click-based "add" button as primary fallback; drag is enhancement |
| 8 chapters is a lot of code | Each chapter is a focused module; shared rendering via workspace.ts |
| State complexity with branches/merges (ch7-8) | Keep branch model simple — max 2 branches, linear commits, no conflicts |
| Beginners overwhelmed by three zones at once | Progressive reveal — zones appear over ch1-ch3, not all at once |
| Scope creep — temptation to add terminal emulation | Resist. Buttons and visual interactions only. The terminal is Git Detective's territory |
| Performance with many DOM nodes | Cap at ~10 file cards and ~10 commits visible. This is a tutorial, not a stress test |
