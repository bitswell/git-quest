/**
 * GitVania — entry point.
 * Mounts the game canvas, initializes state, starts the loop.
 */

import { createCanvas, gameLoop } from "../../shared/canvas";
import { InputManager } from "../../shared/input";
import { createGameState, updateGame, renderGame } from "./game";

export default function gitvania(root: HTMLElement): void {
  const { canvas, ctx } = createCanvas(root, 960, 640);
  const input = new InputManager();
  const state = createGameState();

  // Focus hint
  canvas.tabIndex = 0;
  canvas.style.outline = "none";
  canvas.style.cursor = "default";
  canvas.focus();

  // Ensure canvas gets keyboard events
  canvas.addEventListener("click", () => canvas.focus());

  gameLoop((dt) => {
    updateGame(state, dt, input);
    renderGame(ctx, state);
  });
}
