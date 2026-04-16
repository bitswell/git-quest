// ── Rebase Racer — player character ─────────────────────────────

import type { RunnerState, RunnerAnim } from "./types";

const RUN_FRAME_COUNT = 4;
const RUN_FRAME_DURATION = 0.12; // seconds per frame
const CLEAR_DURATION = 0.4;
const CRASH_DURATION = 0.6;

export class Runner {
  state: RunnerState;
  /** How long the current non-run animation has been playing. */
  private specialTimer = 0;

  constructor(screenX: number, screenY: number) {
    this.state = {
      screenX,
      screenY,
      anim: "run",
      animFrame: 0,
      animTimer: 0,
    };
  }

  update(dt: number): void {
    if (this.state.anim === "run") {
      this.state.animTimer += dt;
      if (this.state.animTimer >= RUN_FRAME_DURATION) {
        this.state.animTimer -= RUN_FRAME_DURATION;
        this.state.animFrame = (this.state.animFrame + 1) % RUN_FRAME_COUNT;
      }
    } else {
      this.specialTimer += dt;
      const dur =
        this.state.anim === "clear" ? CLEAR_DURATION : CRASH_DURATION;
      if (this.specialTimer >= dur) {
        this.state.anim = "run";
        this.state.animFrame = 0;
        this.state.animTimer = 0;
        this.specialTimer = 0;
      }
    }
  }

  triggerClear(): void {
    this.state.anim = "clear";
    this.specialTimer = 0;
  }

  triggerCrash(): void {
    this.state.anim = "crash";
    this.specialTimer = 0;
  }

  setY(y: number): void {
    this.state.screenY = y;
  }

  get anim(): RunnerAnim {
    return this.state.anim;
  }

  get isRunning(): boolean {
    return this.state.anim === "run";
  }
}
