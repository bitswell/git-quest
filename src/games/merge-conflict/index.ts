// Merge Conflict — entry point
// Falling-block puzzle: resolve git merge conflicts under time pressure

import { createCanvas, gameLoop } from "../../shared/canvas";
import { createInitialState } from "./state";
import type { Resolution } from "./conflicts";
import {
  spawnPair,
  updateBlocks,
  checkMergeCollision,
  checkMissedBlocks,
  cleanupPairs,
  resetBlockIds,
} from "./blocks";
import { evaluate, applyOutcome } from "./resolution";
import { render, getConflictButtons } from "./renderer";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SPAWN_INTERVALS,
  DIFFICULTY_THRESHOLDS,
  MAX_DIFFICULTY,
  RESOLUTION_ANIM_DURATION,
  POST_RESOLUTION_DELAY,
  WRONG_DAMAGE,
} from "./constants";

export default function mergeConflict(root: HTMLElement): void {
  const { canvas, ctx } = createCanvas(root, CANVAS_WIDTH, CANVAS_HEIGHT);
  let state = createInitialState();

  // ─── Input handling ───────────────────────────────────────

  // Track keys pressed this frame (consume-once pattern)
  const keysPressed: string[] = [];

  function onKeyDown(e: KeyboardEvent): void {
    keysPressed.push(e.key);
  }

  function onClick(e: MouseEvent): void {
    if (state.phase !== "CONFLICT" || state.resolutionResult) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const buttons = getConflictButtons();
    for (const btn of buttons) {
      if (
        mx >= btn.x &&
        mx <= btn.x + btn.width &&
        my >= btn.y &&
        my <= btn.y + btn.height
      ) {
        resolveConflict(keyToResolution(btn.key)!);
        return;
      }
    }
  }

  window.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("click", onClick);

  // Cleanup when game is removed from DOM
  const observer = new MutationObserver(() => {
    if (!document.contains(canvas)) {
      window.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("click", onClick);
      observer.disconnect();
    }
  });
  observer.observe(root.parentElement ?? document.body, {
    childList: true,
    subtree: true,
  });

  // ─── Conflict resolution ──────────────────────────────────

  function keyToResolution(key: string): Resolution | null {
    if (key === "1") return "LEFT";
    if (key === "2") return "RIGHT";
    if (key === "3") return "BOTH";
    return null;
  }

  function resolveConflict(choice: Resolution): void {
    if (!state.activeConflict) return;

    const outcome = evaluate(state.activeConflict.scenario, choice, state);
    applyOutcome(state, outcome);

    state.activeConflict.pair.resolved = true;
    state.resolutionResult = {
      correct: outcome.correct,
      timer: RESOLUTION_ANIM_DURATION,
      choice,
      points: outcome.points,
    };
  }

  // ─── Restart ──────────────────────────────────────────────

  function restart(): void {
    resetBlockIds();
    state = createInitialState();
  }

  // ─── Update ───────────────────────────────────────────────

  function update(dt: number): void {
    // Process input
    const keys = keysPressed.splice(0);

    // Game over — wait for restart
    if (state.phase === "GAME_OVER") {
      for (const key of keys) {
        if (key === "Enter" || key === " ") {
          restart();
          return;
        }
      }
      render(ctx, state);
      return;
    }

    // Resolution animation playing
    if (state.resolutionResult) {
      state.resolutionResult.timer -= dt;
      if (state.resolutionResult.timer <= 0) {
        state.resolutionResult = null;
        state.activeConflict = null;
        state.postResolutionTimer = POST_RESOLUTION_DELAY;

        if (state.health <= 0) {
          state.phase = "GAME_OVER";
        } else {
          state.phase = "PLAYING";
        }
      }
      render(ctx, state);
      return;
    }

    // Conflict active — wait for player input
    if (state.phase === "CONFLICT") {
      for (const key of keys) {
        const resolution = keyToResolution(key);
        if (resolution) {
          resolveConflict(resolution);
          break;
        }
      }
      render(ctx, state);
      return;
    }

    // ─── PLAYING phase ────────────────────────────────────

    state.elapsed += dt;

    // Update difficulty based on elapsed time
    for (let i = DIFFICULTY_THRESHOLDS.length - 1; i >= 0; i--) {
      if (state.elapsed >= DIFFICULTY_THRESHOLDS[i]) {
        state.difficulty = Math.min(i + 1, MAX_DIFFICULTY);
        break;
      }
    }

    // Post-resolution cooldown
    if (state.postResolutionTimer > 0) {
      state.postResolutionTimer -= dt;
    }

    // Spawn timer
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.postResolutionTimer <= 0) {
      const pair = spawnPair(state);
      state.activePairs.push(pair);
      const interval = SPAWN_INTERVALS[Math.min(state.difficulty - 1, SPAWN_INTERVALS.length - 1)];
      state.spawnTimer = interval;
    }

    // Move blocks
    updateBlocks(state, dt);

    // Check for merge zone collision
    const collision = checkMergeCollision(state);
    if (collision) {
      state.phase = "CONFLICT";
      state.activeConflict = { scenario: collision.scenario, pair: collision };
    }

    // Check for missed blocks (fell past merge zone)
    const missed = checkMissedBlocks(state);
    for (const _pair of missed) {
      state.health -= WRONG_DAMAGE;
      state.streak = 0;
      if (state.health <= 0) {
        state.health = 0;
        state.phase = "GAME_OVER";
        break;
      }
    }

    // Cleanup off-screen pairs
    cleanupPairs(state);

    render(ctx, state);
  }

  // ─── Start ────────────────────────────────────────────────

  gameLoop(update);
}
