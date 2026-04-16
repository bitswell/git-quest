# GitVania — Implementation Plan

## Approach

A 2D metroidvania where the game world is literally a git commit graph. Each room is a commit. Corridors between rooms are parent-child edges. The player unlocks git commands as traversal abilities, and each room teaches the concept it embodies.

The core insight: a commit graph IS a metroidvania map. Branches fork. Merges join. Checkout teleports you. The metaphor isn't bolted on — it's structural.

Architecture is a simple entity-component loop: update + render on a shared canvas. No ECS framework — just plain classes with clear responsibilities. The game state is a graph of Room nodes. The player has a position within the current room and a set of unlocked abilities.

## File Structure

```
src/games/gitvania/
  index.ts          — default export, mounts game, owns the loop
  game.ts           — GameState: current room, player, abilities, graph
  player.ts         — Player: position, velocity, rendering, collision
  room.ts           — Room: layout, platforms, doors, tutorial text
  graph.ts          — CommitGraph: rooms as nodes, edges, branch refs
  abilities.ts      — Ability definitions and unlock logic
  hud.ts            — HUD: branch name, abilities bar, tutorial overlay
  minimap.ts        — Commit graph minimap renderer
  renderer.ts       — Room renderer: tiles, doors, decorations
  levels.ts         — Level data: all rooms, their layouts, connections
  colors.ts         — Color palette (matches landing page dark theme)
```

10 files. No file over ~300 lines. Each has one job.

## Implementation Steps

### 1. Scaffold and boot (`index.ts`, `colors.ts`)
- Default export function(root: HTMLElement)
- Create canvas via shared utility (960x640)
- Create InputManager
- Initialize GameState
- Start gameLoop

### 2. Color palette (`colors.ts`)
- Pull from the landing page: #0d1117 (bg), #161b22 (surface), #30363d (border), #58a6ff (blue), #bc8cff (purple), #f778ba (pink), #3fb950 (green), #e6edf3 (text), #8b949e (muted)
- Room-type-specific accent colors

### 3. Player (`player.ts`)
- 16x24 pixel character rendered as pixel art rectangles
- WASD/arrow key movement
- Gravity + jump (platformer physics)
- Collision with room bounds and platforms
- Door interaction on overlap + key press

### 4. Room model and renderer (`room.ts`, `renderer.ts`)
- Room has: id (commit hash stub), platforms, doors (edges to other rooms), decorations, tutorial text, room type
- Room types: STAGING (git add), COMMIT (git commit), BRANCH_POINT (git branch), MERGE_ZONE (git merge), CHECKOUT (git checkout), STASH (git stash)
- Renderer draws: background, platforms, doors with labels, decorative elements, room name/hash

### 5. Commit graph (`graph.ts`)
- Directed graph of rooms
- Each room has parent(s) and child(ren)
- Branch refs point to room IDs (like real git)
- HEAD tracks current branch
- Operations: addCommit, createBranch, checkout, merge
- The graph IS the level layout — no separate map

### 6. Level data (`levels.ts`)
- Hand-authored rooms forming a teaching sequence:
  1. **"init" room** (initial commit) — entry point. Teaches: "You're in a commit. This is a snapshot."
  2. **"staging" room** — connected from init. Has interactable objects. Teaches: git add (interact with objects to "stage" them, which opens the door forward)
  3. **"first-commit" room** — reached after staging. Teaches: git commit (confirming staged changes creates this room, opening the path forward)
  4. **"branch-point" room** — has TWO exits (doors fork). Teaches: git branch (player must create a branch to unlock the second exit)
  5. **"feature-a" room** (on branch `feature`) — one branch path. Has a key item.
  6. **"main-continues" room** (on branch `main`) — the other path. Has a different key item.
  7. **"merge-zone" room** — only accessible when both branches are explored. Teaches: git merge. Both items combine to open the final door.

This gives us 7 rooms, 2 branches, 1 merge, and teaches: add, commit, branch, checkout, merge.

### 7. Abilities (`abilities.ts`)
- Each ability is unlocked by reaching a specific room
- **git-add**: Interact with objects (press E near them). Unlocked in staging room.
- **git-commit**: Confirm staged changes (opens checkpoint doors). Unlocked in first-commit room.
- **git-branch**: Create a fork at branch points (press B at a branch-point door). Unlocked at branch-point room.
- **git-checkout**: Teleport between branches (press C to open branch selector). Unlocked at branch-point room.
- **git-merge**: Combine branch paths (automatic when entering merge-zone with both branches explored). Unlocked at merge-zone.

Minimum viable: branch + checkout functional per acceptance criteria.

### 8. HUD (`hud.ts`)
- Top bar: current branch name (e.g., "HEAD -> main"), room hash
- Bottom bar: unlocked abilities with keybindings
- Tutorial overlay: semi-transparent panel with explanation text, shown on room enter, dismissed with any key
- Branch selector overlay: list of branches when checkout is activated

### 9. Minimap (`minimap.ts`)
- Draws the commit graph in the top-right corner
- Nodes = circles (colored by room type)
- Edges = lines
- Current room highlighted
- Branch labels drawn next to their tip nodes
- Graph layout: topological sort, left-to-right with vertical offsets for branches

### 10. Wire it all together (`game.ts`)
- GameState holds: graph, player, current room, unlocked abilities, staged items, tutorial state
- Update loop: player physics, door collision detection, ability input handling, room transitions
- Render loop: clear, render room, render player, render HUD, render minimap
- Room transition: fade effect, update current room, show tutorial

## Key Design Decisions

**Art style**: Pixel art built from rectangles and simple shapes — no sprite sheets needed. Dark theme (#0d1117 bg) with neon accents matching the landing page gradient (#58a6ff, #bc8cff, #f778ba). Rooms have a terminal/code aesthetic — grid lines, monospace labels.

**Platformer physics**: Simple gravity + jump. Not the point of the game — movement should feel fine, not remarkable. Rooms are single-screen (no scrolling within a room). The challenge is navigating the graph, not the platforming.

**Room transitions**: Walking into a door edge triggers a brief fade, then loads the connected room. Checkout is a special transition — screen flashes, player teleports to a room on a different branch.

**Teaching approach**: Each room has a one-time tutorial overlay. Short text. One concept. The player learns by doing: the ability they just unlocked is immediately required to progress. No reading without doing.

**Minimap as commit graph**: The minimap IS the commit graph — not a spatial map. This reinforces that the game world is the graph. Nodes represent rooms. The player's position is which node is highlighted.

## Risks

- **Room layout complexity**: Hand-authoring 7 room layouts with platforms and doors takes time. Mitigation: keep layouts simple — few platforms, clear door placement. Gameplay is about the graph, not the platforming.
- **Minimap graph layout**: Auto-layout of DAGs is a real problem. Mitigation: use fixed positions for the 7 rooms since the graph is small and hand-authored. No need for a general layout algorithm.
- **Ability interactions**: Branch + checkout + merge interacting correctly requires careful state management. Mitigation: the graph module is the single source of truth. Abilities just call graph operations.
- **Scope creep**: 7 rooms is already substantial. If time is tight, cut to 5 rooms (drop one branch path, simplify merge to just needing checkout).

## Estimate

- 10 files
- ~1500-2000 lines total
- Moderate complexity — the graph logic and room transitions are the hard parts
- Player movement and rendering are straightforward
