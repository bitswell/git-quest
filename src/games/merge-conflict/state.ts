// Game state — types and factory

import type { Block, BlockPair } from "./blocks";
import type { ConflictScenario, Resolution } from "./conflicts";
import { MAX_HEALTH } from "./constants";

export type GamePhase = "PLAYING" | "CONFLICT" | "GAME_OVER";

export interface ActiveConflict {
  scenario: ConflictScenario;
  pair: BlockPair;
}

export interface ResolutionResult {
  correct: boolean;
  /** Time remaining in the resolution animation (seconds) */
  timer: number;
  choice: Resolution;
  /** Points awarded (0 if wrong) */
  points: number;
}

export interface GameState {
  phase: GamePhase;
  score: number;
  health: number;
  streak: number;
  difficulty: number;
  elapsed: number;
  spawnTimer: number;
  blocks: Block[];
  activePairs: BlockPair[];
  activeConflict: ActiveConflict | null;
  resolutionResult: ResolutionResult | null;
  postResolutionTimer: number;
  recentScenarioIds: number[];
}

export function createInitialState(): GameState {
  return {
    phase: "PLAYING",
    score: 0,
    health: MAX_HEALTH,
    streak: 0,
    difficulty: 1,
    elapsed: 0,
    spawnTimer: 0.5, // short initial delay
    blocks: [],
    activePairs: [],
    activeConflict: null,
    resolutionResult: null,
    postResolutionTimer: 0,
    recentScenarioIds: [],
  };
}
