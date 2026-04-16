export class InputManager {
  private keys = new Set<string>();

  constructor() {
    window.addEventListener("keydown", (e) => this.keys.add(e.key));
    window.addEventListener("keyup", (e) => this.keys.delete(e.key));
  }

  isDown(key: string): boolean {
    return this.keys.has(key);
  }

  clear() {
    this.keys.clear();
  }
}
