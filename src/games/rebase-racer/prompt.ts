// ── Rebase Racer — command input overlay ────────────────────────

export type PromptResult =
  | { kind: "submit"; value: string }
  | { kind: "idle" };

/**
 * HTML input overlay positioned at the bottom of the canvas.
 * Shows when an obstacle is active, hides otherwise.
 */
export class CommandPrompt {
  private wrapper: HTMLDivElement;
  private label: HTMLSpanElement;
  private input: HTMLInputElement;
  private hintEl: HTMLDivElement;
  private pendingSubmit: string | null = null;
  private visible = false;

  constructor(parent: HTMLElement, canvasWidth: number) {
    // Wrapper — sits below the canvas area, absolutely positioned.
    this.wrapper = document.createElement("div");
    Object.assign(this.wrapper.style, {
      position: "relative",
      width: `${canvasWidth}px`,
      margin: "0 auto",
      display: "none",
    });

    // Label
    this.label = document.createElement("span");
    this.label.textContent = "git > ";
    Object.assign(this.label.style, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#3fb950",
      lineHeight: "44px",
      paddingLeft: "12px",
      userSelect: "none",
    });

    // Input
    this.input = document.createElement("input");
    this.input.type = "text";
    this.input.spellcheck = false;
    this.input.autocomplete = "off";
    Object.assign(this.input.style, {
      background: "transparent",
      border: "none",
      outline: "none",
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#e6edf3",
      width: `${canvasWidth - 100}px`,
      lineHeight: "44px",
      caretColor: "#3fb950",
    });

    // Hint line
    this.hintEl = document.createElement("div");
    Object.assign(this.hintEl.style, {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#8b949e",
      paddingLeft: "12px",
      height: "20px",
    });

    // Container bar
    const bar = document.createElement("div");
    Object.assign(bar.style, {
      background: "#161b22",
      border: "1px solid #30363d",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      marginTop: "8px",
    });
    bar.appendChild(this.label);
    bar.appendChild(this.input);

    this.wrapper.appendChild(bar);
    this.wrapper.appendChild(this.hintEl);
    parent.appendChild(this.wrapper);

    // Submit on Enter
    this.input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const val = this.input.value.trim();
        if (val) {
          this.pendingSubmit = val;
          this.input.value = "";
        }
      }
    });
  }

  show(hint?: string): void {
    if (!this.visible) {
      this.wrapper.style.display = "block";
      this.visible = true;
      this.input.value = "";
      this.pendingSubmit = null;
    }
    this.hintEl.textContent = hint ?? "";
    // Grab focus — but only if user isn't mid-type somewhere else.
    if (document.activeElement !== this.input) {
      this.input.focus();
    }
  }

  hide(): void {
    if (this.visible) {
      this.wrapper.style.display = "none";
      this.visible = false;
      this.input.value = "";
      this.hintEl.textContent = "";
      this.pendingSubmit = null;
    }
  }

  /** Shake the input bar briefly to indicate a wrong answer. */
  shake(): void {
    const bar = this.wrapper.firstElementChild as HTMLElement;
    bar.style.transition = "transform 0.05s";
    let step = 0;
    const offsets = [6, -6, 4, -4, 2, 0];
    const id = setInterval(() => {
      bar.style.transform = `translateX(${offsets[step]}px)`;
      step++;
      if (step >= offsets.length) {
        clearInterval(id);
        bar.style.transform = "";
      }
    }, 50);
  }

  /** Poll for a submitted command. Returns the value and clears it. */
  poll(): PromptResult {
    if (this.pendingSubmit !== null) {
      const val = this.pendingSubmit;
      this.pendingSubmit = null;
      return { kind: "submit", value: val };
    }
    return { kind: "idle" };
  }

  destroy(): void {
    this.wrapper.remove();
  }
}
