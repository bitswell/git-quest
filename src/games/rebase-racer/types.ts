// ── Rebase Racer — shared types ──────────────────────────────────

export type Phase = 1 | 2 | 3;

export type GameStatus = "READY" | "PLAYING" | "GAME_OVER";

export interface GameState {
  status: GameStatus;
  score: number;
  combo: number;
  lives: number;
  maxLives: number;
  phase: Phase;
  scrollSpeed: number;
  cameraX: number;
  elapsed: number;
  shakeTimer: number;
  flashTimer: number;
}

export type ObstacleKind =
  | "fork"
  | "dead-end"
  | "tangle"
  | "convergence"
  | "clutter"
  | "time-warp";

export interface ObstacleType {
  kind: ObstacleKind;
  displayName: string;
  hint: string;
  points: number;
  baseTimer: number;
  /** Regex patterns — any match counts as correct */
  acceptedCommands: RegExp[];
  color: string;
  minPhase: Phase;
}

export type ObstacleStatus = "approaching" | "active" | "cleared" | "crashed";

export interface Obstacle {
  type: ObstacleType;
  /** World-X position (absolute, not screen-relative) */
  worldX: number;
  status: ObstacleStatus;
  timerRemaining: number;
  wrongAttempts: number;
}

export interface TrackSegment {
  worldX: number;
  width: number;
  /** Y positions of branch lines (screen-space) */
  branches: number[];
  /** Is this a fork point? */
  fork: boolean;
  /** Is this a merge point? */
  merge: boolean;
}

export type RunnerAnim = "run" | "clear" | "crash";

export interface RunnerState {
  /** Screen-X position (fixed — runner doesn't move horizontally, world scrolls) */
  screenX: number;
  /** Screen-Y position (on the main branch line) */
  screenY: number;
  anim: RunnerAnim;
  animFrame: number;
  animTimer: number;
}

export interface SpeedLine {
  x: number;
  y: number;
  length: number;
  alpha: number;
}
