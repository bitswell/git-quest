export function createCanvas(
  parent: HTMLElement,
  width = 960,
  height = 640
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  parent.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

export function gameLoop(update: (dt: number) => void) {
  let last = performance.now();
  function tick(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05); // cap at 50ms
    last = now;
    update(dt);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
