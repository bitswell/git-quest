// ── Rebase Racer — track generation ─────────────────────────────

import type { TrackSegment, Phase } from "./types";

const SEGMENT_WIDTH = 120;
const MAIN_BRANCH_Y = 320; // Center-ish of 640px canvas
const BRANCH_SPACING = 60;

/** How far ahead of cameraX to pre-generate segments. */
const LOOKAHEAD = 1400;

export class Track {
  segments: TrackSegment[] = [];
  private nextWorldX = 0;

  /** Y position of the main branch line. */
  get mainBranchY(): number {
    return MAIN_BRANCH_Y;
  }

  /** Generate enough segments so there's always track ahead of the camera. */
  generate(cameraX: number, _phase: Phase): void {
    const target = cameraX + LOOKAHEAD;
    while (this.nextWorldX < target) {
      const seg = this.makeSegment(this.nextWorldX);
      this.segments.push(seg);
      this.nextWorldX += SEGMENT_WIDTH;
    }
    // Cull segments that have scrolled far off-screen to the left.
    const cullX = cameraX - 300;
    while (this.segments.length > 0 && this.segments[0].worldX + this.segments[0].width < cullX) {
      this.segments.shift();
    }
  }

  private makeSegment(worldX: number): TrackSegment {
    const branches = [MAIN_BRANCH_Y];
    const isFork = Math.random() < 0.12;
    const isMerge = !isFork && Math.random() < 0.08;

    if (isFork || isMerge) {
      // Add 1-2 extra branch lines above/below main.
      const extraCount = Math.random() < 0.3 ? 2 : 1;
      for (let i = 0; i < extraCount; i++) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        branches.push(MAIN_BRANCH_Y + dir * BRANCH_SPACING * (i + 1));
      }
    }

    return {
      worldX,
      width: SEGMENT_WIDTH,
      branches,
      fork: isFork,
      merge: isMerge,
    };
  }

  reset(): void {
    this.segments = [];
    this.nextWorldX = 0;
  }
}
