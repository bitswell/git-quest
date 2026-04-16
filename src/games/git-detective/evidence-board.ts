import { GameState, Clue } from "./types";

/**
 * Evidence Board UI component.
 * Shows discovered clues in a sidebar panel.
 */
export function createEvidenceBoard(
  container: HTMLElement,
  state: GameState
): { update: () => void; destroy: () => void } {
  const el = document.createElement("div");
  el.className = "detective-evidence";

  const header = document.createElement("h2");
  header.textContent = "Evidence Board";

  const countEl = document.createElement("div");
  countEl.className = "evidence-count";

  const clueContainer = document.createElement("div");

  el.appendChild(header);
  el.appendChild(countEl);
  el.appendChild(clueContainer);
  container.appendChild(el);

  function render() {
    const discovered = state.currentCase.clues.filter((c) => c.discovered);
    const total = state.currentCase.clues.length;

    countEl.textContent = `${discovered.length} / ${total} clues`;

    clueContainer.innerHTML = "";

    if (discovered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "evidence-empty";
      empty.textContent = "No evidence collected yet. Start investigating...";
      clueContainer.appendChild(empty);
      return;
    }

    for (const clue of discovered) {
      const card = document.createElement("div");
      card.className = "evidence-card";

      const title = document.createElement("h3");
      title.textContent = clue.title;

      const desc = document.createElement("p");
      desc.textContent = clue.description;

      card.appendChild(title);
      card.appendChild(desc);
      clueContainer.appendChild(card);
    }
  }

  render();

  return {
    update: render,
    destroy: () => {
      container.removeChild(el);
    },
  };
}
