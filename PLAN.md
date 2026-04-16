# Rebase Racer — Implementation Plan

## Approach

A side-scrolling runner where the player character auto-runs along a git branch track rendered as horizontal lines (like `git log --graph` turned sideways). Obstacles appear ahead on the track, each requiring a specific git command typed into a command prompt at the bottom of the canvas. Correct command = obstacle clears, points awarded. Wrong command or timeout = crash, lose a life. Three crashes = game over.

The game is entirely Canvas-based. A small HTML input element overlays the canvas bottom for command entry — this avoids reimplementing text input/cursor/selection inside Canvas while keeping the visual feel tight.

## File Structure

```
src/games/rebase-racer/
  index.ts          — entry point, exports default mount function
  game.ts           — main game state machine (menu, playing, gameover)
  runner.ts         — player character (position, animation, state)
  track.ts          — branch track generator and renderer (the git graph)
  obstacles.ts      — obstacle types, definitions, spawn logic
  prompt.ts         — command input overlay (HTML input + validation)
  renderer.ts       — all canvas drawing (track, runner, obstacles, HUD)
  types.ts          — shared types and interfaces
```

8 files. No external dependencies beyond what the project already has.

## Implementation Steps

1. **types.ts** — Define core interfaces: GameState, Obstacle, ObstacleType, TrackSegment, RunnerState.
2. **obstacles.ts** — Define the 6 obstacle types with their visual appearance, accepted commands, and hint text.
3. **track.ts** — Track generation: produces segments with branch lines, forks, merges, dead ends. Scrolls left continuously.
4. **runner.ts** — Player character: position on track, running animation (simple sprite frames), crash animation, jump/clear animation.
5. **prompt.ts** — Command input: creates an HTML `<input>` positioned over the canvas. Shows when obstacle is in range. Validates against accepted commands. Timer bar rendered on canvas.
6. **renderer.ts** — Canvas drawing: background, track lines (green on dark), obstacles (colored shapes/icons), runner, HUD (score, lives, combo), timer bar, speed lines.
7. **game.ts** — State machine: READY -> PLAYING -> GAME_OVER. Manages obstacle queue, difficulty scaling, score, lives.
8. **index.ts** — Mount function: creates canvas via shared util, instantiates game, starts game loop via shared util, handles cleanup.

## Obstacle Design

| Obstacle | Visual | Git Command | When Introduced |
|----------|--------|-------------|-----------------|
| **Fork** | Track splits into two branches ahead | `git branch <name>` | Level 1 (start) |
| **Dead End** | Track terminates, wall ahead | `git checkout <branch>` | Level 1 |
| **Tangle** | Messy overlapping track segments | `git rebase` | Level 2 |
| **Convergence** | Two tracks merging into one with a barrier | `git merge <branch>` | Level 2 |
| **Clutter** | Debris/blocks scattered on the track | `git stash` | Level 3 |
| **Time Warp** | Ghosted/faded track section | `git checkout <hash>` | Level 3 |

Each obstacle type defines:
- `acceptedCommands`: array of regex patterns (e.g., `/^git branch \w+$/` for fork)
- `displayName`: what shows on HUD
- `hint`: shown after first wrong attempt
- `points`: base score value
- `timerDuration`: seconds to type the command (decreases with difficulty)

Commands are validated with relaxed matching — `git branch feature` and `git branch fix-bug` both work for a fork obstacle. The specific name doesn't matter, just the correct command structure.

## Command Input

- HTML `<input>` element absolutely positioned over the bottom of the canvas area.
- Appears when player reaches an obstacle's trigger zone (obstacle visible, ~200px ahead).
- Styled to match the terminal aesthetic: monospace font, green text on dark background, `git > ` prefix shown as a label.
- Submit on Enter. If correct, input hides, obstacle clears with a brief animation. If wrong, input shakes, hint shows after first wrong attempt. Timer continues.
- When no obstacle is active, input is hidden and the runner just runs.
- Focus is grabbed automatically when prompt appears. Escape or clicking canvas returns focus behavior.

## Difficulty Progression

Three phases, controlled by cumulative score thresholds:

- **Phase 1 (score 0-500)**: Only Fork and Dead End obstacles. Long timer (8s). Slow scroll speed. Large gaps between obstacles.
- **Phase 2 (score 500-1500)**: Add Tangle and Convergence. Timer drops to 6s. Scroll speed increases 30%. Gaps tighten.
- **Phase 3 (score 1500+)**: All 6 obstacle types. Timer at 4s. Scroll speed up another 30%. Can get back-to-back obstacles.

Speed ramps linearly within each phase. Timer duration decreases smoothly.

## Key Design Decisions

**Visual style**: Dark background (#0d1117 matching site), green (#3fb950) branch lines as the track — looks like a terminal git graph. Speed lines are faint green streaks. Obstacles use accent colors (red for dead ends, yellow for tangles, blue for merges). Runner is a simple humanoid sprite (pixel-art style, 3-4 frame run cycle).

**Scoring**: Base points per obstacle type (harder = more points). Bonus multiplier for fast answers (under half the timer). Combo multiplier for consecutive correct answers (resets on wrong answer or timeout).

**Game feel**: The auto-scroll never stops — even during command input. This creates pressure. Speed lines in background give sense of velocity. Camera shake on wrong answer. Brief green flash on correct answer. The track bobs slightly to feel alive.

**No pause**: Deliberate. The pressure of the runner not stopping is the game.

## Risks

- **Text input focus management**: Switching between canvas interaction and HTML input can be finicky. Mitigate by auto-focusing the input when it appears and keeping canvas interaction minimal (no clicks needed during gameplay).
- **Command matching too strict or too loose**: Regex patterns need tuning. Start permissive — accept the command structure with any valid argument. Can tighten later.
- **Track generation becoming repetitive**: Use weighted random selection from available obstacle pool. Ensure minimum gap between same obstacle type.
- **Canvas performance with lots of track segments**: Cull off-screen segments. Only render what's visible + small buffer.

## Estimate

- 8 files, ~800-1000 lines total
- Medium complexity — the hardest parts are track generation/rendering and the input overlay UX
- The renderer is the biggest file (~200-250 lines)
