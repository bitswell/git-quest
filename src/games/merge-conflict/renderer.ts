// All canvas drawing — branches, blocks, merge zone, HUD, conflict UI, game over

import type { Block, BlockPair } from "./blocks";
import { blockX } from "./blocks";
import type { GameState } from "./state";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  LEFT_COL_X,
  RIGHT_COL_X,
  MERGE_ZONE_TOP,
  MERGE_ZONE_BOTTOM,
  BLOCK_WIDTH,
  BLOCK_HEIGHT,
  BLOCK_RADIUS,
  MAX_HEALTH,
  HUD_PADDING,
  HEALTH_ICON_SIZE,
  HEALTH_ICON_GAP,
  PANEL_WIDTH,
  PANEL_HEIGHT,
  PANEL_PADDING,
  BUTTON_WIDTH,
  BUTTON_HEIGHT,
  BUTTON_GAP,
  COLORS,
  CODE_FONT,
  UI_FONT,
  TITLE_FONT,
  BIG_FONT,
} from "./constants";

// ─── Background ───────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// ─── Branch columns ───────────────────────────────────────────

function drawBranches(ctx: CanvasRenderingContext2D): void {
  // Left branch track
  ctx.strokeStyle = COLORS.leftBranch;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(LEFT_COL_X, 0);
  ctx.lineTo(LEFT_COL_X, CANVAS_HEIGHT);
  ctx.stroke();

  // Right branch track
  ctx.strokeStyle = COLORS.rightBranch;
  ctx.beginPath();
  ctx.moveTo(RIGHT_COL_X, 0);
  ctx.lineTo(RIGHT_COL_X, CANVAS_HEIGHT);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Branch labels at top
  ctx.font = UI_FONT;
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.leftBranch;
  ctx.fillText("ours", LEFT_COL_X, 30);
  ctx.fillStyle = COLORS.rightBranch;
  ctx.fillText("theirs", RIGHT_COL_X, 30);
}

// ─── Merge zone ───────────────────────────────────────────────

function drawMergeZone(ctx: CanvasRenderingContext2D): void {
  // Glow fill
  ctx.fillStyle = COLORS.mergeZone;
  ctx.fillRect(0, MERGE_ZONE_TOP, CANVAS_WIDTH, MERGE_ZONE_BOTTOM - MERGE_ZONE_TOP);

  // Top and bottom lines
  ctx.strokeStyle = COLORS.mergeZoneLine;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);

  ctx.beginPath();
  ctx.moveTo(0, MERGE_ZONE_TOP);
  ctx.lineTo(CANVAS_WIDTH, MERGE_ZONE_TOP);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, MERGE_ZONE_BOTTOM);
  ctx.lineTo(CANVAS_WIDTH, MERGE_ZONE_BOTTOM);
  ctx.stroke();

  ctx.setLineDash([]);

  // Label
  ctx.font = UI_FONT;
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.accentDim;
  ctx.fillText("merge zone", CANVAS_WIDTH / 2, (MERGE_ZONE_TOP + MERGE_ZONE_BOTTOM) / 2 + 5);
}

// ─── Blocks ───────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function colorizeCode(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  // Simple token-based syntax coloring
  const tokens = tokenize(text);
  let curX = x;
  ctx.font = CODE_FONT;
  ctx.textAlign = "left";

  for (const token of tokens) {
    ctx.fillStyle = token.color;
    ctx.fillText(token.text, curX, y);
    curX += ctx.measureText(token.text).width;
  }
}

interface Token {
  text: string;
  color: string;
}

const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else",
  "import", "from", "export", "await", "async", "class", "new",
  "typeof", "instanceof", "null", "undefined", "true", "false",
  "expect",
]);

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  // Match strings, numbers, keywords/identifiers, operators/punctuation, whitespace
  const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\d+(?:\.\d+)?)|([a-zA-Z_$][\w$]*)|(\s+)|([\s\S])/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m[1]) {
      tokens.push({ text: m[1], color: COLORS.string });
    } else if (m[2]) {
      tokens.push({ text: m[2], color: COLORS.number });
    } else if (m[3]) {
      const word = m[3];
      if (KEYWORDS.has(word)) {
        tokens.push({ text: word, color: COLORS.keyword });
      } else if (/^[A-Z]/.test(word)) {
        tokens.push({ text: word, color: COLORS.type });
      } else {
        tokens.push({ text: word, color: COLORS.text });
      }
    } else {
      tokens.push({ text: m[0], color: COLORS.textDim });
    }
  }

  return tokens;
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  block: Block,
  flash: string | null
): void {
  const x = blockX(block) - BLOCK_WIDTH / 2;
  const y = block.y;

  // Block background
  const borderColor = flash ?? (block.branch === "left" ? COLORS.leftBranch : COLORS.rightBranch);

  roundRect(ctx, x, y, BLOCK_WIDTH, BLOCK_HEIGHT, BLOCK_RADIUS);
  ctx.fillStyle = COLORS.blockBg;
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Code text — centered vertically
  const textY = y + BLOCK_HEIGHT / 2 + 5;
  colorizeCode(ctx, block.code, x + 10, textY);
}

function drawBlocks(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const pair of state.activePairs) {
    const flash = getFlashColor(state, pair);
    drawBlock(ctx, pair.left, flash);
    drawBlock(ctx, pair.right, flash);
  }
}

function getFlashColor(state: GameState, pair: BlockPair): string | null {
  if (!state.resolutionResult) return null;
  if (!state.activeConflict) return null;
  if (state.activeConflict.pair.id !== pair.id) return null;
  return state.resolutionResult.correct ? COLORS.correct : COLORS.wrong;
}

// ─── HUD ──────────────────────────────────────────────────────

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Score — top left
  ctx.font = TITLE_FONT;
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`Score: ${state.score}`, HUD_PADDING, HUD_PADDING + 16);

  // Streak
  if (state.streak > 0) {
    ctx.font = UI_FONT;
    ctx.fillStyle = COLORS.accent;
    ctx.fillText(`${state.streak}x streak`, HUD_PADDING, HUD_PADDING + 40);
  }

  // Health — top right
  const healthStartX =
    CANVAS_WIDTH - HUD_PADDING - MAX_HEALTH * (HEALTH_ICON_SIZE + HEALTH_ICON_GAP);
  for (let i = 0; i < MAX_HEALTH; i++) {
    const hx = healthStartX + i * (HEALTH_ICON_SIZE + HEALTH_ICON_GAP);
    const hy = HUD_PADDING;
    ctx.fillStyle = i < state.health ? COLORS.healthFull : COLORS.healthEmpty;
    // Draw a simple diamond shape for health
    ctx.beginPath();
    ctx.moveTo(hx + HEALTH_ICON_SIZE / 2, hy);
    ctx.lineTo(hx + HEALTH_ICON_SIZE, hy + HEALTH_ICON_SIZE / 2);
    ctx.lineTo(hx + HEALTH_ICON_SIZE / 2, hy + HEALTH_ICON_SIZE);
    ctx.lineTo(hx, hy + HEALTH_ICON_SIZE / 2);
    ctx.closePath();
    ctx.fill();
  }

  // Difficulty — top center
  ctx.font = UI_FONT;
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText(`Level ${state.difficulty}`, CANVAS_WIDTH / 2, HUD_PADDING + 16);
}

// ─── Conflict UI ──────────────────────────────────────────────

export interface ConflictButton {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  key: string;
}

export function getConflictButtons(): ConflictButton[] {
  const panelX = (CANVAS_WIDTH - PANEL_WIDTH) / 2;
  const panelY = (CANVAS_HEIGHT - PANEL_HEIGHT) / 2;
  const btnY = panelY + PANEL_HEIGHT - PANEL_PADDING - BUTTON_HEIGHT;
  const totalBtnWidth = 3 * BUTTON_WIDTH + 2 * BUTTON_GAP;
  const btnStartX = panelX + (PANEL_WIDTH - totalBtnWidth) / 2;

  return [
    {
      x: btnStartX,
      y: btnY,
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      label: "1  Left (Ours)",
      key: "1",
    },
    {
      x: btnStartX + BUTTON_WIDTH + BUTTON_GAP,
      y: btnY,
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      label: "2  Right (Theirs)",
      key: "2",
    },
    {
      x: btnStartX + 2 * (BUTTON_WIDTH + BUTTON_GAP),
      y: btnY,
      width: BUTTON_WIDTH,
      height: BUTTON_HEIGHT,
      label: "3  Both",
      key: "3",
    },
  ];
}

function drawConflictPanel(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (!state.activeConflict) return;

  const { scenario } = state.activeConflict;

  // Overlay
  ctx.fillStyle = COLORS.overlay;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Panel
  const px = (CANVAS_WIDTH - PANEL_WIDTH) / 2;
  const py = (CANVAS_HEIGHT - PANEL_HEIGHT) / 2;

  roundRect(ctx, px, py, PANEL_WIDTH, PANEL_HEIGHT, 12);
  ctx.fillStyle = COLORS.panelBg;
  ctx.fill();
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Title
  ctx.font = TITLE_FONT;
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.accent;
  ctx.fillText("MERGE CONFLICT", CANVAS_WIDTH / 2, py + PANEL_PADDING + 20);

  // Subtitle
  ctx.font = UI_FONT;
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText("Choose the correct resolution", CANVAS_WIDTH / 2, py + PANEL_PADDING + 44);

  // Two code panels side by side
  const codeY = py + PANEL_PADDING + 64;
  const halfW = (PANEL_WIDTH - PANEL_PADDING * 3) / 2;
  const leftPanelX = px + PANEL_PADDING;
  const rightPanelX = px + PANEL_PADDING * 2 + halfW;
  const codeBoxHeight = 100;

  // Left code box
  drawCodeBox(ctx, leftPanelX, codeY, halfW, codeBoxHeight, scenario.leftCode, scenario.leftLabel, COLORS.leftBranch);

  // Right code box
  drawCodeBox(ctx, rightPanelX, codeY, halfW, codeBoxHeight, scenario.rightCode, scenario.rightLabel, COLORS.rightBranch);

  // Buttons
  const buttons = getConflictButtons();
  for (const btn of buttons) {
    roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 6);
    ctx.fillStyle = COLORS.blockBg;
    ctx.fill();
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = UI_FONT;
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.text;
    ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + btn.height / 2 + 5);
  }
}

function drawCodeBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  code: string,
  label: string,
  borderColor: string
): void {
  // Box background
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = "#0d1117";
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Label above
  ctx.font = UI_FONT;
  ctx.textAlign = "left";
  ctx.fillStyle = borderColor;
  ctx.fillText(label, x + 8, y - 6);

  // Code inside — handle multi-line by splitting on newlines or if too wide
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 4, y + 4, w - 8, h - 8);
  ctx.clip();

  const lines = code.split("\n");
  const lineHeight = 20;
  const startY = y + 28;

  for (let i = 0; i < lines.length; i++) {
    colorizeCode(ctx, lines[i], x + 12, startY + i * lineHeight);
  }

  ctx.restore();
}

// ─── Resolution feedback ──────────────────────────────────────

function drawResolutionFeedback(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (!state.resolutionResult || !state.activeConflict) return;

  const { correct } = state.resolutionResult;
  const { scenario } = state.activeConflict;

  // Overlay
  ctx.fillStyle = COLORS.overlay;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Feedback text
  ctx.font = BIG_FONT;
  ctx.textAlign = "center";
  ctx.fillStyle = correct ? COLORS.correct : COLORS.wrong;
  ctx.fillText(
    correct ? "MERGED!" : "CONFLICT!",
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2 - 20
  );

  // Explanation
  ctx.font = UI_FONT;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(scenario.explanation, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  // Points
  if (correct && state.resolutionResult) {
    ctx.fillStyle = COLORS.accent;
    ctx.fillText(
      `+${state.resolutionResult.points} points`,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + 50
    );
  }
}

// ─── Game Over ────────────────────────────────────────────────

function drawGameOver(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Overlay
  ctx.fillStyle = COLORS.overlay;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Game Over text
  ctx.font = BIG_FONT;
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.wrong;
  ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

  // Final score
  ctx.font = TITLE_FONT;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`Final Score: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  // Stats
  ctx.font = UI_FONT;
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText(
    `Level ${state.difficulty} | ${Math.floor(state.elapsed)}s survived`,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2 + 30
  );

  // Restart prompt
  ctx.fillStyle = COLORS.accent;
  ctx.fillText("Press Enter or Space to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

// ─── Main render function ─────────────────────────────────────

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  drawBackground(ctx);
  drawBranches(ctx);
  drawMergeZone(ctx);
  drawBlocks(ctx, state);
  drawHUD(ctx, state);

  if (state.phase === "CONFLICT" && !state.resolutionResult) {
    drawConflictPanel(ctx, state);
  }

  if (state.resolutionResult) {
    drawResolutionFeedback(ctx, state);
  }

  if (state.phase === "GAME_OVER") {
    drawGameOver(ctx, state);
  }
}
