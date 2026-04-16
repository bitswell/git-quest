// Block types, spawning, physics, and collision

import type { ConflictScenario } from "./conflicts";
import { pickScenario } from "./conflicts";
import {
  BASE_FALL_SPEED,
  SPEED_INCREMENT,
  LEFT_COL_X,
  RIGHT_COL_X,
  BLOCK_HEIGHT,
  MERGE_ZONE_TOP,
  MERGE_ZONE_BOTTOM,
  CANVAS_HEIGHT,
} from "./constants";
import type { GameState } from "./state";

export interface Block {
  id: number;
  branch: "left" | "right";
  code: string;
  label: string;
  y: number;
  pairId: number;
}

export interface BlockPair {
  id: number;
  left: Block;
  right: Block;
  scenario: ConflictScenario;
  resolved: boolean;
}

let nextId = 0;

export function resetBlockIds(): void {
  nextId = 0;
}

export function spawnPair(state: GameState): BlockPair {
  const scenario = pickScenario(state.difficulty, state.recentScenarioIds);

  const pairId = nextId++;
  const left: Block = {
    id: nextId++,
    branch: "left",
    code: scenario.leftCode,
    label: scenario.leftLabel,
    y: -BLOCK_HEIGHT,
    pairId,
  };
  const right: Block = {
    id: nextId++,
    branch: "right",
    code: scenario.rightCode,
    label: scenario.rightLabel,
    y: -BLOCK_HEIGHT,
    pairId,
  };

  const pair: BlockPair = { id: pairId, left, right, scenario, resolved: false };

  // Track recent scenarios to avoid immediate repeats
  state.recentScenarioIds.push(scenario.id);
  if (state.recentScenarioIds.length > 4) {
    state.recentScenarioIds.shift();
  }

  return pair;
}

export function fallSpeed(difficulty: number): number {
  return BASE_FALL_SPEED * (1 + (difficulty - 1) * SPEED_INCREMENT);
}

export function updateBlocks(state: GameState, dt: number): void {
  const speed = fallSpeed(state.difficulty);

  for (const pair of state.activePairs) {
    if (pair.resolved) continue;
    pair.left.y += speed * dt;
    pair.right.y += speed * dt;
  }
}

/** Returns the x position for a block based on its branch */
export function blockX(block: Block): number {
  return block.branch === "left" ? LEFT_COL_X : RIGHT_COL_X;
}

/** Check if a block's center is inside the merge zone */
function inMergeZone(block: Block): boolean {
  const centerY = block.y + BLOCK_HEIGHT / 2;
  return centerY >= MERGE_ZONE_TOP && centerY <= MERGE_ZONE_BOTTOM;
}

/** Check if a block has fallen past the merge zone entirely */
function pastMergeZone(block: Block): boolean {
  return block.y > MERGE_ZONE_BOTTOM;
}

/** Check if a block has fallen off screen */
export function offScreen(block: Block): boolean {
  return block.y > CANVAS_HEIGHT + BLOCK_HEIGHT;
}

/**
 * Check all active pairs for merge zone collisions.
 * Returns the first unresolved pair that has both blocks in the merge zone, or null.
 */
export function checkMergeCollision(state: GameState): BlockPair | null {
  for (const pair of state.activePairs) {
    if (pair.resolved) continue;
    if (inMergeZone(pair.left) && inMergeZone(pair.right)) {
      return pair;
    }
  }
  return null;
}

/**
 * Check for blocks that fell past the merge zone without being resolved.
 * Returns missed pairs.
 */
export function checkMissedBlocks(state: GameState): BlockPair[] {
  const missed: BlockPair[] = [];
  for (const pair of state.activePairs) {
    if (pair.resolved) continue;
    if (pastMergeZone(pair.left) || pastMergeZone(pair.right)) {
      pair.resolved = true;
      missed.push(pair);
    }
  }
  return missed;
}

/** Remove pairs that are fully off screen */
export function cleanupPairs(state: GameState): void {
  state.activePairs = state.activePairs.filter(
    (p) => !(p.resolved && offScreen(p.left) && offScreen(p.right))
  );
}
