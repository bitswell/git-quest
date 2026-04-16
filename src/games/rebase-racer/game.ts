// ── Rebase Racer — game state machine ───────────────────────────

import type { GameState, Obstacle, Phase } from "./types";
import { Track } from "./track";
import { Runner } from "./runner";
import { Renderer } from "./renderer";
import { CommandPrompt } from "./prompt";
import {
  checkCommand,
  resetSpawnState,
  spawnObstacle,
} from "./obstacles";

// ── Constants ───────────────────────────────────────────────────

const CANVAS_W = 960;
const CANVAS_H = 640;

const BASE_SCROLL_SPEED = 180; // px/s
const RUNNER_SCREEN_X = 160;
const TRIGGER_DISTANCE = 260; // how far ahead of runner an obstacle becomes active

/** Gap between obstacles (in world-X pixels). Shrinks with phase. */
function obstacleGap(phase: Phase): number {
  if (phase === 1) return 600;
  if (phase === 2) return 450;
  return 340;
}

/** Scroll speed multiplier per phase. */
function speedMultiplier(phase: Phase): number {
  if (phase === 1) return 1.0;
  if (phase === 2) return 1.3;
  return 1.7;
}

function phaseForScore(score: number): Phase {
  if (score >= 1500) return 3;
  if (score >= 500) return 2;
  return 1;
}

// ── Game ────────────────────────────────────────────────────────

export class Game {
  private state: GameState;
  private track: Track;
  private runner: Runner;
  private renderer: Renderer;
  private prompt: CommandPrompt;
  private obstacles: Obstacle[] = [];
  private nextObstacleX = 600; // world-X of next obstacle spawn
  private started = false;

  constructor(
    ctx: CanvasRenderingContext2D,
    parent: HTMLElement
  ) {
    this.state = this.freshState();
    this.track = new Track();
    this.runner = new Runner(RUNNER_SCREEN_X, this.track.mainBranchY);
    this.renderer = new Renderer(ctx, CANVAS_W, CANVAS_H);
    this.renderer.init();
    this.prompt = new CommandPrompt(parent, CANVAS_W);

    // Listen for Enter to start / restart.
    this.onKeyDown = this.onKeyDown.bind(this);
    window.addEventListener("keydown", this.onKeyDown);
  }

  private freshState(): GameState {
    return {
      status: "READY",
      score: 0,
      combo: 0,
      lives: 3,
      maxLives: 3,
      phase: 1,
      scrollSpeed: BASE_SCROLL_SPEED,
      cameraX: 0,
      elapsed: 0,
      shakeTimer: 0,
      flashTimer: 0,
    };
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === "Enter") {
      if (this.state.status === "READY" && !this.started) {
        this.start();
      } else if (this.state.status === "GAME_OVER") {
        this.restart();
      }
    }
  }

  private start(): void {
    this.state.status = "PLAYING";
    this.started = true;
  }

  private restart(): void {
    this.state = this.freshState();
    this.state.status = "PLAYING";
    this.track.reset();
    this.obstacles = [];
    this.nextObstacleX = 600;
    this.runner = new Runner(RUNNER_SCREEN_X, this.track.mainBranchY);
    this.prompt.hide();
    resetSpawnState();
    this.started = true;
  }

  update(dt: number): void {
    // Always render (even when paused on READY/GAME_OVER screens).
    this.render();

    if (this.state.status !== "PLAYING") return;

    const st = this.state;
    st.elapsed += dt;

    // Phase progression.
    st.phase = phaseForScore(st.score);
    st.scrollSpeed = BASE_SCROLL_SPEED * speedMultiplier(st.phase);

    // Scroll.
    st.cameraX += st.scrollSpeed * dt;

    // Decay timers.
    if (st.shakeTimer > 0) st.shakeTimer = Math.max(0, st.shakeTimer - dt);
    if (st.flashTimer > 0) st.flashTimer = Math.max(0, st.flashTimer - dt);

    // Generate track.
    this.track.generate(st.cameraX, st.phase);

    // Spawn obstacles.
    const runnerWorldX = st.cameraX + RUNNER_SCREEN_X;
    if (this.nextObstacleX < runnerWorldX + CANVAS_W) {
      const obs = spawnObstacle(this.nextObstacleX, st.phase);
      this.obstacles.push(obs);
      this.nextObstacleX += obstacleGap(st.phase);
    }

    // Update runner.
    this.runner.update(dt);
    this.runner.setY(this.track.mainBranchY);

    // Process obstacles.
    this.updateObstacles(dt, runnerWorldX);

    // Cull passed obstacles.
    this.obstacles = this.obstacles.filter(
      (o) => o.worldX > st.cameraX - 200
    );
  }

  private updateObstacles(dt: number, runnerWorldX: number): void {
    let activeObs: Obstacle | null = null;

    for (const obs of this.obstacles) {
      if (obs.status === "cleared" || obs.status === "crashed") continue;

      const dist = obs.worldX - runnerWorldX;

      // Activate when within trigger distance.
      if (obs.status === "approaching" && dist < TRIGGER_DISTANCE && dist > -20) {
        obs.status = "active";
        activeObs = obs;
        break;
      }

      if (obs.status === "active") {
        activeObs = obs;
        break;
      }

      // Runner passed an approaching obstacle without it activating — shouldn't happen
      // but handle gracefully: treat as crash.
      if (dist < -20 && obs.status === "approaching") {
        this.handleCrash(obs);
      }
    }

    if (activeObs) {
      // Count down timer.
      activeObs.timerRemaining -= dt;

      // Show prompt.
      const hint =
        activeObs.wrongAttempts > 0 ? activeObs.type.hint : undefined;
      this.prompt.show(hint);

      // Check for submitted command.
      const result = this.prompt.poll();
      if (result.kind === "submit") {
        if (checkCommand(activeObs, result.value)) {
          this.handleClear(activeObs);
        } else {
          activeObs.wrongAttempts++;
          this.prompt.shake();
        }
      }

      // Timer ran out.
      if (activeObs.timerRemaining <= 0 && activeObs.status === "active") {
        this.handleCrash(activeObs);
      }
    } else {
      this.prompt.hide();
    }
  }

  private handleClear(obs: Obstacle): void {
    obs.status = "cleared";
    this.prompt.hide();
    this.runner.triggerClear();
    this.state.flashTimer = 0.25;

    // Score: base points + speed bonus + combo bonus.
    const speedBonus = obs.timerRemaining > obs.type.baseTimer * 0.5 ? 50 : 0;
    this.state.combo++;
    const comboMultiplier = Math.min(this.state.combo, 5);
    this.state.score += (obs.type.points + speedBonus) * comboMultiplier;
  }

  private handleCrash(obs: Obstacle): void {
    obs.status = "crashed";
    this.prompt.hide();
    this.runner.triggerCrash();
    this.state.shakeTimer = 0.35;
    this.state.combo = 0;
    this.state.lives--;

    if (this.state.lives <= 0) {
      this.state.status = "GAME_OVER";
    }
  }

  private render(): void {
    this.renderer.draw(
      this.state,
      this.track.segments,
      this.obstacles,
      this.runner.state,
      this.track.mainBranchY
    );
  }

  destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    this.prompt.destroy();
  }
}
