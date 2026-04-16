/**
 * HUD — branch name, abilities bar, tutorial overlay, branch selector.
 */

import { C } from "./colors";
import { Ability } from "./abilities";

export interface HudState {
  branchName: string;
  roomHash: string;
  abilities: Ability[];
  tutorialLines: string[];
  showTutorial: boolean;
  tutorialDismissed: Set<string>;
  /** Branch selector overlay */
  showBranchSelector: boolean;
  branchList: string[];
  branchSelectIndex: number;
  /** Notification text (ability unlocked, etc.) */
  notification: string;
  notificationTimer: number;
}

export function createHud(): HudState {
  return {
    branchName: "main",
    roomHash: "",
    abilities: [],
    tutorialLines: [],
    showTutorial: false,
    tutorialDismissed: new Set(),
    showBranchSelector: false,
    branchList: [],
    branchSelectIndex: 0,
    notification: "",
    notificationTimer: 0,
  };
}

export function showNotification(hud: HudState, text: string, duration = 3): void {
  hud.notification = text;
  hud.notificationTimer = duration;
}

export function updateHud(hud: HudState, dt: number): void {
  if (hud.notificationTimer > 0) {
    hud.notificationTimer -= dt;
    if (hud.notificationTimer <= 0) {
      hud.notification = "";
      hud.notificationTimer = 0;
    }
  }
}

export function renderHud(ctx: CanvasRenderingContext2D, hud: HudState, canvasW: number, canvasH: number): void {
  drawTopBar(ctx, hud, canvasW);
  drawAbilityBar(ctx, hud, canvasW, canvasH);

  if (hud.showTutorial && hud.tutorialLines.length > 0) {
    drawTutorialOverlay(ctx, hud, canvasW, canvasH);
  }

  if (hud.showBranchSelector) {
    drawBranchSelector(ctx, hud, canvasW, canvasH);
  }

  if (hud.notification) {
    drawNotification(ctx, hud, canvasW);
  }
}

function drawTopBar(ctx: CanvasRenderingContext2D, hud: HudState, canvasW: number): void {
  // Background
  ctx.fillStyle = C.hudBg;
  ctx.fillRect(0, 0, canvasW, 20);

  // Branch indicator
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "right";
  ctx.fillStyle = C.green;
  ctx.fillText(`HEAD -> ${hud.branchName}`, canvasW - 16, 14);
}

function drawAbilityBar(ctx: CanvasRenderingContext2D, hud: HudState, canvasW: number, canvasH: number): void {
  if (hud.abilities.length === 0) return;

  const barH = 32;
  const barY = canvasH - barH;
  const barW = hud.abilities.length * 120 + 20;
  const barX = (canvasW - barW) / 2;

  // Background
  ctx.fillStyle = C.hudBg;
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = C.hudBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  // Abilities
  ctx.font = "10px monospace";
  ctx.textAlign = "left";

  for (let i = 0; i < hud.abilities.length; i++) {
    const a = hud.abilities[i];
    const ax = barX + 10 + i * 120;

    // Key badge
    ctx.fillStyle = C.blue;
    ctx.fillRect(ax, barY + 6, 18, 18);
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = C.bg;
    ctx.textAlign = "center";
    ctx.fillText(a.key, ax + 9, barY + 19);

    // Name
    ctx.font = "10px monospace";
    ctx.fillStyle = C.text;
    ctx.textAlign = "left";
    ctx.fillText(a.name, ax + 24, barY + 19);
  }
}

function drawTutorialOverlay(ctx: CanvasRenderingContext2D, hud: HudState, canvasW: number, canvasH: number): void {
  // Semi-transparent backdrop
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Panel
  const panelW = 520;
  const lineHeight = 22;
  const padding = 24;
  const panelH = hud.tutorialLines.length * lineHeight + padding * 2 + 30;
  const panelX = (canvasW - panelW) / 2;
  const panelY = (canvasH - panelH) / 2;

  // Panel background
  ctx.fillStyle = C.surface;
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  // Tutorial text
  ctx.font = "13px monospace";
  ctx.fillStyle = C.text;
  ctx.textAlign = "left";

  for (let i = 0; i < hud.tutorialLines.length; i++) {
    ctx.fillText(hud.tutorialLines[i], panelX + padding, panelY + padding + 16 + i * lineHeight);
  }

  // Dismiss hint
  ctx.font = "11px monospace";
  ctx.fillStyle = C.muted;
  ctx.textAlign = "center";
  ctx.fillText("[ press any key to continue ]", canvasW / 2, panelY + panelH - 12);
}

function drawBranchSelector(ctx: CanvasRenderingContext2D, hud: HudState, canvasW: number, canvasH: number): void {
  const panelW = 280;
  const lineHeight = 28;
  const padding = 20;
  const panelH = hud.branchList.length * lineHeight + padding * 2 + 40;
  const panelX = (canvasW - panelW) / 2;
  const panelY = (canvasH - panelH) / 2;

  // Backdrop
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Panel
  ctx.fillStyle = C.surface;
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  // Title
  ctx.font = "bold 13px monospace";
  ctx.fillStyle = C.purple;
  ctx.textAlign = "center";
  ctx.fillText("git checkout", canvasW / 2, panelY + padding + 10);

  // Branch list
  ctx.font = "12px monospace";
  ctx.textAlign = "left";

  for (let i = 0; i < hud.branchList.length; i++) {
    const by = panelY + padding + 30 + i * lineHeight;
    const isSelected = i === hud.branchSelectIndex;
    const isCurrent = hud.branchList[i] === hud.branchName;

    if (isSelected) {
      ctx.fillStyle = C.purple;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(panelX + 8, by - 4, panelW - 16, lineHeight);
      ctx.globalAlpha = 1.0;
    }

    ctx.fillStyle = isCurrent ? C.green : isSelected ? C.purple : C.text;
    const prefix = isCurrent ? "* " : "  ";
    ctx.fillText(prefix + hud.branchList[i], panelX + padding, by + 14);
  }

  // Hint
  ctx.font = "10px monospace";
  ctx.fillStyle = C.muted;
  ctx.textAlign = "center";
  ctx.fillText("UP/DOWN to select, ENTER to checkout, ESC to cancel", canvasW / 2, panelY + panelH - 10);
}

function drawNotification(ctx: CanvasRenderingContext2D, hud: HudState, canvasW: number): void {
  const alpha = Math.min(1, hud.notificationTimer);
  ctx.globalAlpha = alpha;
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = C.green;

  // Background pill
  const textW = ctx.measureText(hud.notification).width;
  const pillW = textW + 32;
  const pillX = (canvasW - pillW) / 2;
  ctx.fillStyle = C.hudBg;
  ctx.fillRect(pillX, 30, pillW, 28);
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 1;
  ctx.strokeRect(pillX, 30, pillW, 28);

  ctx.fillStyle = C.green;
  ctx.fillText(hud.notification, canvasW / 2, 50);
  ctx.globalAlpha = 1.0;
}
