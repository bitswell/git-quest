/**
 * Room renderer — draws the current room: background, grid, platforms,
 * doors, interactables, decorative elements, room title/hash.
 */

import { Room, Platform, Door, Interactable } from "./room";
import { C } from "./colors";

const ROOM_ACCENT: Record<string, string> = {
  init: C.init,
  staging: C.staging,
  commit: C.commit,
  branch: C.branch,
  checkout: C.checkout,
  merge: C.merge,
};

/** Draw the entire room */
export function renderRoom(ctx: CanvasRenderingContext2D, room: Room, time: number): void {
  const accent = ROOM_ACCENT[room.type] || C.blue;

  drawBackground(ctx, room, accent, time);
  drawGrid(ctx, room);
  drawPlatforms(ctx, room.platforms);
  drawFloor(ctx, room);
  drawDoors(ctx, room.doors, time);
  drawInteractables(ctx, room.interactables, time);
  drawRoomLabel(ctx, room, accent);
}

function drawBackground(ctx: CanvasRenderingContext2D, room: Room, accent: string, _time: number): void {
  // Dark gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, room.height);
  grad.addColorStop(0, C.bg);
  grad.addColorStop(1, C.surface);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, room.width, room.height);

  // Subtle accent glow at top
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.03;
  ctx.fillRect(0, 0, room.width, 120);
  ctx.globalAlpha = 1.0;
}

function drawGrid(ctx: CanvasRenderingContext2D, room: Room): void {
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.15;

  const gridSize = 32;
  for (let x = 0; x < room.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, room.height);
    ctx.stroke();
  }
  for (let y = 0; y < room.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(room.width, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;
}

function drawFloor(ctx: CanvasRenderingContext2D, room: Room): void {
  const floorY = room.height - 48;

  // Floor surface
  ctx.fillStyle = C.platform;
  ctx.fillRect(0, floorY, room.width, 48);

  // Floor top edge
  ctx.fillStyle = C.platformTop;
  ctx.fillRect(0, floorY, room.width, 3);

  // Floor pattern (subtle lines)
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.3;
  for (let x = 0; x < room.width; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, floorY + 8);
    ctx.lineTo(x + 8, floorY + 48);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;
}

function drawPlatforms(ctx: CanvasRenderingContext2D, platforms: Platform[]): void {
  for (const p of platforms) {
    // Platform body
    ctx.fillStyle = C.platform;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Platform top edge (lighter)
    ctx.fillStyle = C.platformTop;
    ctx.fillRect(p.x, p.y, p.w, 3);

    // End caps
    ctx.fillStyle = C.border;
    ctx.fillRect(p.x, p.y, 2, p.h);
    ctx.fillRect(p.x + p.w - 2, p.y, 2, p.h);
  }
}

function drawDoors(ctx: CanvasRenderingContext2D, doors: Door[], time: number): void {
  for (const d of doors) {
    const pulse = Math.sin(time * 3) * 0.15 + 0.85;

    // Door frame
    ctx.fillStyle = C.doorFrame;
    ctx.fillRect(d.x - 3, d.y - 3, d.w + 6, d.h + 6);

    // Door body
    if (d.open) {
      ctx.fillStyle = C.doorOpen;
      ctx.globalAlpha = pulse;
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.globalAlpha = 1.0;

      // Glow
      ctx.shadowColor = C.doorOpen;
      ctx.shadowBlur = 12;
      ctx.fillStyle = C.doorOpen;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = C.doorLocked;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.globalAlpha = 1.0;

      // Lock icon (simple X)
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2;
      const cx = d.x + d.w / 2;
      const cy = d.y + d.h / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 6);
      ctx.lineTo(cx + 6, cy + 6);
      ctx.moveTo(cx + 6, cy - 6);
      ctx.lineTo(cx - 6, cy + 6);
      ctx.stroke();
    }

    // Door label
    ctx.font = "10px monospace";
    ctx.fillStyle = d.open ? C.text : C.muted;
    ctx.textAlign = "center";
    ctx.fillText(d.label, d.x + d.w / 2, d.y - 8);
  }
}

function drawInteractables(ctx: CanvasRenderingContext2D, items: Interactable[], time: number): void {
  for (const item of items) {
    const pulse = Math.sin(time * 4 + item.x) * 0.2 + 0.8;

    if (item.staged) {
      // Staged: green, solid
      ctx.fillStyle = C.green;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(item.x, item.y, item.w, item.h);
      ctx.globalAlpha = 1.0;

      // Checkmark
      ctx.strokeStyle = C.bg;
      ctx.lineWidth = 2;
      const cx = item.x + item.w / 2;
      const cy = item.y + item.h / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy);
      ctx.lineTo(cx - 1, cy + 4);
      ctx.lineTo(cx + 5, cy - 4);
      ctx.stroke();
    } else {
      // Unstaged: orange, pulsing
      ctx.fillStyle = C.orange;
      ctx.globalAlpha = pulse;
      ctx.fillRect(item.x, item.y, item.w, item.h);
      ctx.globalAlpha = 1.0;

      // Glow
      ctx.shadowColor = C.orange;
      ctx.shadowBlur = 8;
      ctx.fillStyle = C.orange;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(item.x - 2, item.y - 2, item.w + 4, item.h + 4);
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
    }

    // Label
    ctx.font = "9px monospace";
    ctx.fillStyle = C.text;
    ctx.textAlign = "center";
    ctx.fillText(item.label, item.x + item.w / 2, item.y - 6);
  }
}

function drawRoomLabel(ctx: CanvasRenderingContext2D, room: Room, accent: string): void {
  // Room title in top-left
  ctx.font = "bold 14px monospace";
  ctx.fillStyle = accent;
  ctx.textAlign = "left";
  ctx.fillText(room.title, 16, 28);

  // Hash below it
  ctx.font = "11px monospace";
  ctx.fillStyle = C.muted;
  ctx.fillText(room.hash, 16, 44);
}
