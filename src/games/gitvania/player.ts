/**
 * Player — 16x24 pixel character with platformer physics.
 * WASD/arrows for movement, space for jump.
 */

import { Platform, Door, Interactable } from "./room";
import { C } from "./colors";

const GRAVITY = 980;
const JUMP_VEL = -380;
const MOVE_SPEED = 220;
const PLAYER_W = 16;
const PLAYER_H = 24;

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  facingRight: boolean;
  w: number;
  h: number;
}

export function createPlayer(x: number, y: number): PlayerState {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    grounded: false,
    facingRight: true,
    w: PLAYER_W,
    h: PLAYER_H,
  };
}

export function updatePlayer(
  p: PlayerState,
  dt: number,
  keys: { left: boolean; right: boolean; jump: boolean },
  platforms: Platform[],
  roomWidth: number,
  roomHeight: number
): void {
  // Horizontal movement
  p.vx = 0;
  if (keys.left) {
    p.vx = -MOVE_SPEED;
    p.facingRight = false;
  }
  if (keys.right) {
    p.vx = MOVE_SPEED;
    p.facingRight = true;
  }

  // Jump
  if (keys.jump && p.grounded) {
    p.vy = JUMP_VEL;
    p.grounded = false;
  }

  // Gravity
  p.vy += GRAVITY * dt;

  // Move horizontally
  p.x += p.vx * dt;

  // Clamp to room bounds (leave room for door margins)
  if (p.x < 4) p.x = 4;
  if (p.x + p.w > roomWidth - 4) p.x = roomWidth - 4 - p.w;

  // Move vertically
  p.y += p.vy * dt;

  // Ground collision (room floor)
  const floorY = roomHeight - 48;
  p.grounded = false;

  if (p.y + p.h >= floorY) {
    p.y = floorY - p.h;
    p.vy = 0;
    p.grounded = true;
  }

  // Platform collision (only when falling)
  for (const plat of platforms) {
    if (
      p.vy >= 0 &&
      p.x + p.w > plat.x &&
      p.x < plat.x + plat.w &&
      p.y + p.h >= plat.y &&
      p.y + p.h <= plat.y + plat.h + p.vy * dt + 2
    ) {
      p.y = plat.y - p.h;
      p.vy = 0;
      p.grounded = true;
    }
  }

  // Ceiling collision
  if (p.y < 0) {
    p.y = 0;
    p.vy = 0;
  }
}

/** Check if player overlaps a door */
export function playerAtDoor(p: PlayerState, doors: Door[]): Door | null {
  for (const d of doors) {
    if (
      p.x + p.w > d.x &&
      p.x < d.x + d.w &&
      p.y + p.h > d.y &&
      p.y < d.y + d.h
    ) {
      return d;
    }
  }
  return null;
}

/** Check if player is near an interactable */
export function playerNearInteractable(p: PlayerState, items: Interactable[]): Interactable | null {
  const reach = 24;
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;

  for (const item of items) {
    const ix = item.x + item.w / 2;
    const iy = item.y + item.h / 2;
    const dist = Math.hypot(cx - ix, cy - iy);
    if (dist < reach + Math.max(item.w, item.h) / 2) {
      return item;
    }
  }
  return null;
}

/** Draw the player as a pixel-art character */
export function renderPlayer(ctx: CanvasRenderingContext2D, p: PlayerState): void {
  const x = Math.round(p.x);
  const y = Math.round(p.y);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(x - 1, y + p.h, p.w + 2, 3);

  // Body
  ctx.fillStyle = C.playerBody;
  ctx.fillRect(x + 2, y + 6, 12, 14);

  // Head
  ctx.fillStyle = C.playerBody;
  ctx.fillRect(x + 3, y, 10, 8);

  // Eyes
  const eyeOffset = p.facingRight ? 2 : -2;
  ctx.fillStyle = C.playerOutline;
  ctx.fillRect(x + 6 + eyeOffset, y + 2, 2, 2);
  ctx.fillRect(x + 10 + eyeOffset, y + 2, 2, 2);

  // Legs
  ctx.fillStyle = C.muted;
  ctx.fillRect(x + 3, y + 20, 4, 4);
  ctx.fillRect(x + 9, y + 20, 4, 4);

  // Outline glow
  ctx.strokeStyle = C.playerOutline;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  ctx.strokeRect(x + 1.5, y - 0.5, p.w - 3, p.h + 1);
  ctx.globalAlpha = 1.0;
}
