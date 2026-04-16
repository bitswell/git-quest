// ── Rebase Racer — entry point ──────────────────────────────────

import { createCanvas, gameLoop } from "../../shared/canvas";
import { Game } from "./game";

export default function rebaseRacer(root: HTMLElement): void {
  const { ctx } = createCanvas(root, 960, 640);
  const game = new Game(ctx, root);

  gameLoop((dt) => {
    game.update(dt);
  });
}
