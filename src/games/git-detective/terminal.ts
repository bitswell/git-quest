import { GameState } from "./types";
import { parseCommand } from "./command-parser";
import { executeCommand, ExecResult } from "./command-executor";

export interface TerminalCallbacks {
  onCluesDiscovered: (clueIds: string[]) => void;
  onSolved: () => void;
}

/**
 * Terminal UI component.
 * Renders a command-line interface with input, output, and command history.
 */
export function createTerminal(
  container: HTMLElement,
  state: GameState,
  callbacks: TerminalCallbacks
): { focus: () => void; destroy: () => void } {
  const caseId = state.currentCase.id;

  const el = document.createElement("div");
  el.className = "detective-terminal";

  const output = document.createElement("div");
  output.className = "detective-terminal-output";

  const inputRow = document.createElement("div");
  inputRow.className = "detective-terminal-input-row";

  const prompt = document.createElement("span");
  prompt.className = "detective-prompt";
  prompt.textContent = `detective@${caseId} $ `;

  const input = document.createElement("input");
  input.className = "detective-input";
  input.type = "text";
  input.placeholder = "Type a command...";
  input.spellcheck = false;
  input.autocomplete = "off";

  inputRow.appendChild(prompt);
  inputRow.appendChild(input);

  el.appendChild(output);
  el.appendChild(inputRow);
  container.appendChild(el);

  // Welcome message
  appendWelcome(output, state);

  // Command history navigation
  let historyIndex = -1;
  let currentInput = "";

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      const raw = input.value;
      if (!raw.trim()) return;

      // Add to history
      state.commandHistory.push(raw);
      historyIndex = -1;
      currentInput = "";

      // Echo the command
      appendLine(
        output,
        `<span class="term-prompt-echo">detective@${caseId} $ </span>${escHtml(raw)}`
      );

      // Parse and execute
      const parsed = parseCommand(raw);
      input.value = "";

      if (!parsed) return;

      if (parsed.base === "clear") {
        output.innerHTML = "";
        return;
      }

      const result = executeCommand(parsed, state);
      if (result.html) {
        appendLine(output, result.html);
      }

      // Clue discovery notifications
      if (result.discoveredClues.length > 0) {
        for (const clueId of result.discoveredClues) {
          const clue = state.currentCase.clues.find((c) => c.id === clueId);
          if (clue) {
            appendLine(
              output,
              `\n<span class="term-clue">[EVIDENCE] ${escHtml(clue.title)}</span>`
            );
          }
        }
        callbacks.onCluesDiscovered(result.discoveredClues);
      }

      if (result.solved) {
        callbacks.onSolved();
      }

      // Scroll to bottom
      output.scrollTop = output.scrollHeight;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (state.commandHistory.length === 0) return;
      if (historyIndex === -1) {
        currentInput = input.value;
        historyIndex = state.commandHistory.length - 1;
      } else if (historyIndex > 0) {
        historyIndex--;
      }
      input.value = state.commandHistory[historyIndex];
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      if (historyIndex < state.commandHistory.length - 1) {
        historyIndex++;
        input.value = state.commandHistory[historyIndex];
      } else {
        historyIndex = -1;
        input.value = currentInput;
      }
    }
  }

  input.addEventListener("keydown", handleKeyDown);

  // Click anywhere in terminal to focus input
  el.addEventListener("click", () => input.focus());

  return {
    focus: () => input.focus(),
    destroy: () => {
      input.removeEventListener("keydown", handleKeyDown);
      container.removeChild(el);
    },
  };
}

function appendLine(output: HTMLElement, html: string): void {
  const div = document.createElement("div");
  div.innerHTML = html;
  output.appendChild(div);
}

function appendWelcome(output: HTMLElement, state: GameState): void {
  const lines = [
    '<span class="term-welcome"><strong>Git Detective v1.0</strong></span>',
    '<span class="term-welcome">A noir investigation terminal.</span>',
    "",
    `<span class="term-welcome">Case: <strong>${escHtml(state.currentCase.title)}</strong></span>`,
    '<span class="term-welcome">Type <strong>help</strong> for available commands.</span>',
    '<span class="term-welcome">Start with <strong>git log</strong> to review the history.</span>',
    "",
  ];
  appendLine(output, lines.join("\n"));
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
