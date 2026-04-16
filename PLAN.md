# PLAN — Merge Conflict (Falling-Block Puzzle)

## Approach

Canvas-rendered falling-block game. Two columns (branches) drop code blocks toward a central merge zone. When blocks from opposite branches arrive at the zone simultaneously, a conflict dialog appears. Player picks the correct resolution. Right answer = points. Wrong answer = health damage.

No frameworks. No abstractions beyond what the game needs. TypeScript, Canvas 2D, the shared `createCanvas` and `gameLoop` utilities, and the `InputManager` for keyboard input.

The game runs as a state machine: MENU -> PLAYING -> CONFLICT -> GAME_OVER. During PLAYING, blocks fall. During CONFLICT, time pauses and the resolution UI appears. GAME_OVER shows the score and a restart option.

## File Structure

```
src/games/merge-conflict/
  index.ts          — entry point, exports default(root), sets up canvas + game loop
  state.ts          — game state type, initial state factory, state transitions
  blocks.ts         — Block type, spawn logic, fall physics, collision detection
  conflicts.ts      — conflict scenario data (10+ scenarios with correct answers)
  renderer.ts       — all canvas drawing: branches, blocks, merge zone, HUD, conflict UI
  resolution.ts     — conflict resolution logic: evaluate player choice, apply score/damage
  constants.ts      — tuning: speeds, dimensions, colors, health, scoring
```

7 files total. Each under 200 lines. No file does two jobs.

## Implementation Steps

1. **constants.ts** — All magic numbers in one place. Canvas size, column positions, fall speed, health, score values, colors (purple/violet palette).

2. **conflicts.ts** — The 12 conflict scenarios. Each has: left code snippet, right code snippet, correct resolution (LEFT | RIGHT | BOTH), explanation string. Scenarios cover variable declarations, function signatures, import statements, config values, conditional logic, etc.

3. **state.ts** — GameState type definition. Factory function for initial state. Includes: phase (PLAYING | CONFLICT | GAME_OVER), score, health, current blocks, active conflict, difficulty level, elapsed time.

4. **blocks.ts** — Block interface (id, branch, code snippet, y position, speed). Spawn function that picks a random conflict scenario and creates a left+right block pair. Update function that moves blocks down. Collision check: both blocks in merge zone range.

5. **resolution.ts** — Takes a conflict scenario + player choice, returns { correct: boolean, points: number, damage: number }. Handles score multiplier for streaks.

6. **renderer.ts** — Draws everything:
   - Background with two branch columns (left = "ours", right = "theirs")
   - Branch labels and decorative git-branch lines
   - Falling blocks with code text inside rounded rectangles
   - Merge zone indicator (horizontal bar in the middle)
   - HUD: score (top-left), health bar (top-right), difficulty level
   - Conflict UI: centered panel showing both snippets side by side, three buttons (Left / Right / Both), keyboard hints (1/2/3)
   - Game over screen with final score and restart prompt

7. **index.ts** — Wires it all together. Creates canvas, creates initial state, runs gameLoop. Handles keyboard input for conflict resolution (keys 1/2/3) and restart (Enter). Mouse click support for the conflict buttons.

## Conflict Scenarios

Each scenario has a left snippet (ours), right snippet (theirs), and correct resolution.

### 1. Variable initialization
```
LEFT:  const timeout = 3000;
RIGHT: const timeout = 5000;
CORRECT: RIGHT  (higher timeout is safer default)
```

### 2. Import path
```
LEFT:  import { log } from './utils';
RIGHT: import { log } from './utils/logger';
CORRECT: RIGHT  (more specific path)
```

### 3. Function parameter
```
LEFT:  function greet(name: string) {
RIGHT: function greet(name: string, formal?: boolean) {
CORRECT: RIGHT  (superset of left, backwards compatible)
```

### 4. Return type
```
LEFT:  function getCount(): number {
RIGHT: function getCount(): number | null {
CORRECT: RIGHT  (handles missing data)
```

### 5. Array vs single
```
LEFT:  let items = getItem();
RIGHT: let items = getItems();
CORRECT: RIGHT  (plural form, returns array)
```

### 6. Error handling — keep both
```
LEFT:  console.log(error);
RIGHT: reportError(error);
CORRECT: BOTH  (log AND report)
```

### 7. Feature flag + original
```
LEFT:  showBanner();
RIGHT: if (flags.banner) showBanner();
CORRECT: RIGHT  (feature flag is intentional)
```

### 8. CSS class names
```
LEFT:  class="btn primary"
RIGHT: class="btn btn-primary"
CORRECT: RIGHT  (BEM-style, more specific)
```

### 9. Null check
```
LEFT:  return user.name;
RIGHT: return user?.name ?? 'Anonymous';
CORRECT: RIGHT  (null-safe)
```

### 10. Both needed — test + implementation
```
LEFT:  expect(add(1,2)).toBe(3);
RIGHT: function add(a, b) { return a + b; }
CORRECT: BOTH  (test and implementation both needed)
```

### 11. Config format
```
LEFT:  port: "8080"
RIGHT: port: 8080
CORRECT: RIGHT  (number not string)
```

### 12. Async handling
```
LEFT:  const data = fetchData();
RIGHT: const data = await fetchData();
CORRECT: RIGHT  (must await async call)
```

## Merge Zone Mechanics

1. **Block spawning**: A conflict scenario is selected. Two blocks are created simultaneously — one on the left column, one on the right. They start at y=0 (off-screen top) and fall at the current speed.

2. **Falling**: Blocks move downward each frame at `baseSpeed + (difficulty * speedIncrease)` pixels per second. No lateral movement — blocks stay in their column.

3. **Merge zone**: A horizontal band across the middle of the canvas (roughly y = 280 to y = 360 on a 640-tall canvas). When BOTH blocks of a pair have their center y inside this band, the conflict triggers.

4. **Conflict trigger**: Game phase switches to CONFLICT. Blocks freeze. The resolution panel appears centered on screen. Player sees both code snippets side by side with three choice buttons.

5. **Resolution**: Player picks 1 (Left), 2 (Right), or 3 (Both). If correct: blocks merge into a single "resolved" block that fades out, score increases, streak increments. If wrong: blocks flash red, health decreases, streak resets.

6. **Post-resolution**: Brief animation (0.5s), then phase returns to PLAYING. After a short delay, the next block pair spawns.

7. **Missed blocks**: If blocks fall past the merge zone without being resolved (shouldn't happen with the pause mechanic, but as a safety net), they count as a miss — health penalty.

## Difficulty Progression

- **Level 1 (0-30s)**: Fall speed = base. Simple conflicts (variable values, imports). 3s between spawns.
- **Level 2 (30-60s)**: Speed +20%. Introduce function signature conflicts. 2.5s between spawns.
- **Level 3 (60-90s)**: Speed +40%. Introduce null-safety and async conflicts. 2s between spawns.
- **Level 4 (90-120s)**: Speed +60%. All scenario types. 1.5s between spawns.
- **Level 5 (120s+)**: Speed +80%. All scenarios, faster spawn. 1.2s between spawns.

Difficulty is purely time-based. No level selection. The game simply gets harder the longer you survive.

## Key Design Decisions

### Visual style
- Dark background (#0d1117) matching the site theme
- Purple/violet accent color (#bc8cff) for the merge zone glow and UI elements
- Left branch: teal (#3fb950), Right branch: blue (#58a6ff)
- Blocks are rounded rectangles with monospace code text inside
- Merge zone is a glowing horizontal band
- Conflict panel has a dark overlay behind it

### Scoring
- Correct resolution: 100 base points * difficulty level
- Streak bonus: consecutive correct adds 10% each (max 2x multiplier)
- Wrong answer resets streak to 0

### Health
- Start with 5 health points (shown as hearts or a bar)
- Wrong resolution: -1 health
- Game over at 0

### Controls
- Keyboard: 1 = Accept Left, 2 = Accept Right, 3 = Accept Both
- Mouse: click the buttons in the conflict panel
- Enter/Space to restart from game over screen

### Code display
- Monospace font in blocks (14px)
- Code snippets max 40 characters wide, 1-2 lines
- Syntax-like coloring: keywords in purple, strings in green, numbers in orange (simple regex, not a real parser)

## Risks

1. **Text rendering on canvas**: Monospace code in small blocks might be hard to read. Mitigation: keep snippets very short, use large enough font, high contrast colors.

2. **Conflict panel UX**: Needs to be immediately clear what the player should do. Mitigation: clear labels, keyboard shortcut hints visible, color coding matches the branch colors.

3. **Difficulty tuning**: Hard to get right without playtesting. Mitigation: all values in constants.ts, easy to adjust.

4. **Canvas text wrapping**: Canvas doesn't do text wrapping natively. Mitigation: keep snippets to single lines where possible; for multi-line, manually split and render each line.

## Estimate

- 7 files
- ~800-1000 total lines of TypeScript
- Moderate complexity — the hardest parts are the conflict panel rendering and making the game feel responsive
- Implementation: straightforward, no tricky async or state management patterns
