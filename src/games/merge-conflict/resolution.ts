// Evaluate player choices and apply scoring / damage

import type { Resolution, ConflictScenario } from "./conflicts";
import {
  BASE_SCORE,
  STREAK_BONUS,
  MAX_STREAK_MULTIPLIER,
  WRONG_DAMAGE,
} from "./constants";
import type { GameState } from "./state";

export interface ResolutionOutcome {
  correct: boolean;
  points: number;
  damage: number;
}

export function evaluate(
  scenario: ConflictScenario,
  choice: Resolution,
  state: GameState
): ResolutionOutcome {
  const correct = choice === scenario.correct;

  if (correct) {
    const streakMultiplier = Math.min(
      1 + state.streak * STREAK_BONUS,
      MAX_STREAK_MULTIPLIER
    );
    const points = Math.round(BASE_SCORE * state.difficulty * streakMultiplier);
    return { correct: true, points, damage: 0 };
  }

  return { correct: false, points: 0, damage: WRONG_DAMAGE };
}

export function applyOutcome(state: GameState, outcome: ResolutionOutcome): void {
  if (outcome.correct) {
    state.score += outcome.points;
    state.streak += 1;
  } else {
    state.health -= outcome.damage;
    state.streak = 0;
    if (state.health <= 0) {
      state.health = 0;
      state.phase = "GAME_OVER";
    }
  }
}
