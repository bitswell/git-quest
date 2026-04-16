// ── Rebase Racer — canvas renderer ──────────────────────────────

import type {
  GameState,
  Obstacle,
  RunnerState,
  SpeedLine,
  TrackSegment,
} from "./types";

const BG_COLOR = "#0d1117";
const TRACK_COLOR = "#3fb950";
const TRACK_DIM = "#1a3a25";
const HUD_COLOR = "#e6edf3";
const HUD_DIM = "#8b949e";

// ── Speed lines ─────────────────────────────────────────────────

const MAX_SPEED_LINES = 30;
let speedLines: SpeedLine[] = [];

function initSpeedLines(canvasH: number): void {
  speedLines = [];
  for (let i = 0; i < MAX_SPEED_LINES; i++) {
    speedLines.push(makeSpeedLine(Math.random() * 960, canvasH));
  }
}

function makeSpeedLine(startX: number, canvasH: number): SpeedLine {
  return {
    x: startX,
    y: Math.random() * canvasH,
    length: 30 + Math.random() * 80,
    alpha: 0.03 + Math.random() * 0.08,
  };
}

function updateSpeedLines(
  dt: number,
  scrollSpeed: number,
  canvasW: number,
  canvasH: number
): void {
  for (const line of speedLines) {
    line.x -= scrollSpeed * dt * 0.6;
    if (line.x + line.length < 0) {
      Object.assign(line, makeSpeedLine(canvasW + Math.random() * 200, canvasH));
    }
  }
}

function drawSpeedLines(ctx: CanvasRenderingContext2D): void {
  for (const line of speedLines) {
    ctx.strokeStyle = `rgba(63, 185, 80, ${line.alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(line.x, line.y);
    ctx.lineTo(line.x + line.length, line.y);
    ctx.stroke();
  }
}

// ── Track drawing ───────────────────────────────────────────────

function drawTrack(
  ctx: CanvasRenderingContext2D,
  segments: TrackSegment[],
  cameraX: number,
  canvasW: number
): void {
  for (const seg of segments) {
    const screenX = seg.worldX - cameraX;
    // Skip segments fully off screen.
    if (screenX + seg.width < -20 || screenX > canvasW + 20) continue;

    for (let i = 0; i < seg.branches.length; i++) {
      const y = seg.branches[i];
      const isMain = i === 0;
      ctx.strokeStyle = isMain ? TRACK_COLOR : TRACK_DIM;
      ctx.lineWidth = isMain ? 3 : 1.5;
      ctx.setLineDash(isMain ? [] : [6, 4]);
      ctx.beginPath();
      ctx.moveTo(screenX, y);
      ctx.lineTo(screenX + seg.width, y);
      ctx.stroke();

      // Draw node dots at fork/merge points.
      if ((seg.fork || seg.merge) && !isMain) {
        ctx.fillStyle = TRACK_COLOR;
        ctx.beginPath();
        ctx.arc(
          seg.fork ? screenX : screenX + seg.width,
          y,
          4,
          0,
          Math.PI * 2
        );
        ctx.fill();
        // Connector line from branch to main.
        ctx.strokeStyle = TRACK_DIM;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        const cx = seg.fork ? screenX : screenX + seg.width;
        ctx.moveTo(cx, seg.branches[0]);
        ctx.lineTo(cx, y);
        ctx.stroke();
      }
    }
  }
  ctx.setLineDash([]);
}

// ── Obstacle drawing ────────────────────────────────────────────

function drawObstacles(
  ctx: CanvasRenderingContext2D,
  obstacles: Obstacle[],
  cameraX: number,
  mainY: number
): void {
  for (const obs of obstacles) {
    if (obs.status === "cleared") continue;
    const sx = obs.worldX - cameraX;
    if (sx < -60 || sx > 1000) continue;

    const color = obs.type.color;
    const y = mainY;

    ctx.save();

    if (obs.status === "crashed") {
      ctx.globalAlpha = 0.3;
    }

    switch (obs.type.kind) {
      case "fork": {
        // Branching arrows
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.lineTo(sx + 20, y - 25);
        ctx.moveTo(sx, y);
        ctx.lineTo(sx + 20, y + 25);
        ctx.stroke();
        drawObstacleLabel(ctx, obs.type.displayName, sx, y - 40, color);
        break;
      }
      case "dead-end": {
        // Solid wall
        ctx.fillStyle = color;
        ctx.fillRect(sx - 3, y - 30, 6, 60);
        ctx.fillStyle = color + "44";
        ctx.fillRect(sx - 12, y - 25, 24, 50);
        drawObstacleLabel(ctx, obs.type.displayName, sx, y - 40, color);
        break;
      }
      case "tangle": {
        // Squiggly mess — use deterministic offsets based on worldX
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          // Simple deterministic pseudo-random from obstacle position + index
          const seed = (obs.worldX * 13 + i * 37) % 100;
          const ox = sx - 20 + (seed / 100) * 40;
          const oy = y - 20 + (((seed * 7) % 100) / 100) * 40;
          ctx.moveTo(ox, oy);
          ctx.bezierCurveTo(
            ox + 10, oy - 15,
            ox + 20, oy + 15,
            ox + 30, oy
          );
        }
        ctx.stroke();
        drawObstacleLabel(ctx, obs.type.displayName, sx, y - 40, color);
        break;
      }
      case "convergence": {
        // Two arrows merging
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx - 20, y - 25);
        ctx.lineTo(sx, y);
        ctx.moveTo(sx - 20, y + 25);
        ctx.lineTo(sx, y);
        ctx.lineTo(sx + 15, y);
        ctx.stroke();
        drawObstacleLabel(ctx, obs.type.displayName, sx, y - 40, color);
        break;
      }
      case "clutter": {
        // Scattered blocks
        ctx.fillStyle = color;
        for (let i = 0; i < 6; i++) {
          const bx = sx - 15 + (i % 3) * 12;
          const by = y - 18 + Math.floor(i / 3) * 18;
          ctx.fillRect(bx, by, 8, 8);
        }
        drawObstacleLabel(ctx, obs.type.displayName, sx, y - 40, color);
        break;
      }
      case "time-warp": {
        // Ghosted circle
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(sx, y, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Inner clock-like lines
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.lineTo(sx, y - 12);
        ctx.moveTo(sx, y);
        ctx.lineTo(sx + 8, y + 4);
        ctx.stroke();
        drawObstacleLabel(ctx, obs.type.displayName, sx, y - 40, color);
        break;
      }
    }

    // Timer bar (when active)
    if (obs.status === "active") {
      const maxTimer = obs.type.baseTimer;
      const pct = Math.max(0, obs.timerRemaining / maxTimer);
      const barW = 50;
      const barH = 4;
      const barX = sx - barW / 2;
      const barY = y + 35;
      ctx.fillStyle = "#30363d";
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = pct > 0.3 ? TRACK_COLOR : "#f85149";
      ctx.fillRect(barX, barY, barW * pct, barH);
    }

    ctx.restore();
  }
}

function drawObstacleLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string
): void {
  ctx.font = "bold 11px monospace";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
  ctx.textAlign = "start";
}

// ── Runner drawing ──────────────────────────────────────────────

function drawRunner(
  ctx: CanvasRenderingContext2D,
  runner: RunnerState
): void {
  const { screenX: x, screenY: y, anim, animFrame } = runner;

  ctx.save();

  if (anim === "crash") {
    ctx.fillStyle = "#f85149";
  } else if (anim === "clear") {
    ctx.fillStyle = "#3fb950";
  } else {
    ctx.fillStyle = "#e6edf3";
  }

  // Simple stick-figure runner.
  // Head
  ctx.beginPath();
  ctx.arc(x, y - 28, 6, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.strokeStyle = ctx.fillStyle as string;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x, y - 8);
  ctx.stroke();

  // Legs — animate based on frame
  const legAngle = anim === "crash" ? 0 : Math.sin(animFrame * (Math.PI / 2)) * 12;
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x - 5 + legAngle, y);
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x + 5 - legAngle, y);
  ctx.stroke();

  // Arms — swing opposite to legs
  const armAngle = anim === "crash" ? 8 : Math.sin(animFrame * (Math.PI / 2) + Math.PI) * 8;
  ctx.beginPath();
  ctx.moveTo(x, y - 18);
  ctx.lineTo(x - 7 + armAngle, y - 12);
  ctx.moveTo(x, y - 18);
  ctx.lineTo(x + 7 - armAngle, y - 12);
  ctx.stroke();

  // Clear animation — green burst
  if (anim === "clear") {
    ctx.strokeStyle = "#3fb95066";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = 18;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * 10, y - 14 + Math.sin(angle) * 10);
      ctx.lineTo(x + Math.cos(angle) * r, y - 14 + Math.sin(angle) * r);
      ctx.stroke();
    }
  }

  // Crash animation — red X
  if (anim === "crash") {
    ctx.strokeStyle = "#f8514988";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 26);
    ctx.lineTo(x + 12, y - 2);
    ctx.moveTo(x + 12, y - 26);
    ctx.lineTo(x - 12, y - 2);
    ctx.stroke();
  }

  ctx.restore();
}

// ── HUD ─────────────────────────────────────────────────────────

function drawHUD(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number
): void {
  ctx.save();
  ctx.font = "bold 16px monospace";

  // Score
  ctx.fillStyle = HUD_COLOR;
  ctx.textAlign = "left";
  ctx.fillText(`SCORE: ${state.score}`, 16, 28);

  // Combo
  if (state.combo > 1) {
    ctx.fillStyle = TRACK_COLOR;
    ctx.fillText(`x${state.combo} COMBO`, 16, 50);
  }

  // Lives
  ctx.fillStyle = HUD_DIM;
  ctx.textAlign = "right";
  let livesText = "LIVES: ";
  for (let i = 0; i < state.maxLives; i++) {
    livesText += i < state.lives ? "O " : "X ";
  }
  ctx.fillText(livesText, canvasW - 16, 28);

  // Phase
  ctx.fillStyle = HUD_DIM;
  ctx.font = "12px monospace";
  ctx.fillText(`PHASE ${state.phase}`, canvasW - 16, 48);

  ctx.restore();
}

// ── READY / GAME OVER screens ───────────────────────────────────

function drawReadyScreen(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number
): void {
  ctx.save();
  ctx.fillStyle = "#0d1117cc";
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.fillStyle = TRACK_COLOR;
  ctx.font = "bold 36px monospace";
  ctx.textAlign = "center";
  ctx.fillText("REBASE RACER", canvasW / 2, canvasH / 2 - 40);

  ctx.fillStyle = HUD_DIM;
  ctx.font = "16px monospace";
  ctx.fillText("Type git commands to clear obstacles", canvasW / 2, canvasH / 2 + 10);
  ctx.fillText("Press ENTER to start", canvasW / 2, canvasH / 2 + 40);

  ctx.restore();
}

function drawGameOverScreen(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  score: number
): void {
  ctx.save();
  ctx.fillStyle = "#0d1117cc";
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.fillStyle = "#f85149";
  ctx.font = "bold 36px monospace";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvasW / 2, canvasH / 2 - 40);

  ctx.fillStyle = HUD_COLOR;
  ctx.font = "bold 22px monospace";
  ctx.fillText(`SCORE: ${score}`, canvasW / 2, canvasH / 2 + 10);

  ctx.fillStyle = HUD_DIM;
  ctx.font = "16px monospace";
  ctx.fillText("Press ENTER to restart", canvasW / 2, canvasH / 2 + 50);

  ctx.restore();
}

// ── Camera shake helper ─────────────────────────────────────────

function applyShake(ctx: CanvasRenderingContext2D, shakeTimer: number): void {
  if (shakeTimer > 0) {
    const intensity = shakeTimer * 12;
    const dx = (Math.random() - 0.5) * intensity;
    const dy = (Math.random() - 0.5) * intensity;
    ctx.translate(dx, dy);
  }
}

// ── Green flash helper ──────────────────────────────────────────

function drawFlash(
  ctx: CanvasRenderingContext2D,
  flashTimer: number,
  canvasW: number,
  canvasH: number
): void {
  if (flashTimer > 0) {
    ctx.fillStyle = `rgba(63, 185, 80, ${flashTimer * 0.3})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }
}

// ── Main render function ────────────────────────────────────────

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvasW: number;
  private canvasH: number;
  private initialized = false;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.canvasW = width;
    this.canvasH = height;
  }

  init(): void {
    if (!this.initialized) {
      initSpeedLines(this.canvasH);
      this.initialized = true;
    }
  }

  draw(
    state: GameState,
    segments: TrackSegment[],
    obstacles: Obstacle[],
    runner: RunnerState,
    mainBranchY: number
  ): void {
    const ctx = this.ctx;
    const w = this.canvasW;
    const h = this.canvasH;

    // Update speed lines
    updateSpeedLines(0.016, state.scrollSpeed, w, h);

    // Clear
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    applyShake(ctx, state.shakeTimer);

    // Speed lines (background layer)
    drawSpeedLines(ctx);

    // Track
    drawTrack(ctx, segments, state.cameraX, w);

    // Obstacles
    drawObstacles(ctx, obstacles, state.cameraX, mainBranchY);

    // Runner
    drawRunner(ctx, runner);

    // Green flash overlay
    drawFlash(ctx, state.flashTimer, w, h);

    ctx.restore();

    // HUD (not affected by shake)
    drawHUD(ctx, state, w);

    // Overlay screens
    if (state.status === "READY") {
      drawReadyScreen(ctx, w, h);
    } else if (state.status === "GAME_OVER") {
      drawGameOverScreen(ctx, w, h, state.score);
    }
  }
}
