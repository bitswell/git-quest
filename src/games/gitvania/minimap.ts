/**
 * Minimap — draws the commit graph in the top-right corner.
 * Nodes = circles (colored by room type). Edges = lines.
 * Current room is highlighted. Branch labels drawn next to tips.
 */

import { CommitGraph } from "./graph";
import { C } from "./colors";

/** Fixed positions for the 7 known rooms — no general layout needed */
const NODE_POS: Record<string, { x: number; y: number }> = {
  "init":            { x: 20,  y: 50 },
  "staging":         { x: 55,  y: 50 },
  "first-commit":    { x: 90,  y: 50 },
  "branch-point":    { x: 125, y: 50 },
  "main-continues":  { x: 160, y: 50 },
  "feature-a":       { x: 160, y: 20 },
  "merge-zone":      { x: 195, y: 50 },
};

const ROOM_COLOR: Record<string, string> = {
  init: C.init,
  staging: C.staging,
  commit: C.commit,
  branch: C.branch,
  checkout: C.checkout,
  merge: C.merge,
};

const MAP_W = 220;
const MAP_H = 80;
const MAP_MARGIN = 12;
const NODE_R = 6;

export function renderMinimap(
  ctx: CanvasRenderingContext2D,
  graph: CommitGraph,
  currentRoomId: string,
  canvasW: number
): void {
  const ox = canvasW - MAP_W - MAP_MARGIN;
  const oy = MAP_MARGIN;

  // Background
  ctx.fillStyle = C.minimapBg;
  ctx.fillRect(ox, oy, MAP_W, MAP_H);
  ctx.strokeStyle = C.hudBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(ox, oy, MAP_W, MAP_H);

  // Edges
  ctx.strokeStyle = C.minimapEdge;
  ctx.lineWidth = 1.5;

  for (const [id, node] of graph.nodes) {
    const pos = NODE_POS[id];
    if (!pos) continue;

    for (const childId of node.children) {
      const childPos = NODE_POS[childId];
      if (!childPos) continue;

      ctx.beginPath();
      ctx.moveTo(ox + pos.x, oy + pos.y);
      ctx.lineTo(ox + childPos.x, oy + childPos.y);
      ctx.stroke();
    }
  }

  // Nodes
  for (const [id, node] of graph.nodes) {
    const pos = NODE_POS[id];
    if (!pos) continue;

    const isCurrent = id === currentRoomId;
    const color = ROOM_COLOR[node.room.type] || C.blue;

    ctx.beginPath();
    ctx.arc(ox + pos.x, oy + pos.y, isCurrent ? NODE_R + 2 : NODE_R, 0, Math.PI * 2);

    if (isCurrent) {
      // Glow effect for current room
      ctx.fillStyle = C.minimapCurrent;
      ctx.shadowColor = C.minimapCurrent;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Border
    ctx.strokeStyle = isCurrent ? C.minimapCurrent : color;
    ctx.lineWidth = isCurrent ? 2 : 1;
    ctx.stroke();
  }

  // Branch labels
  ctx.font = "9px monospace";
  ctx.textAlign = "left";

  for (const [, branch] of graph.branches) {
    const pos = NODE_POS[branch.tipId];
    if (!pos) continue;

    const isHead = graph.head.type === "branch" && graph.head.name === branch.name;
    ctx.fillStyle = isHead ? C.green : C.muted;
    ctx.fillText(branch.name, ox + pos.x + NODE_R + 4, oy + pos.y + 3);
  }
}
