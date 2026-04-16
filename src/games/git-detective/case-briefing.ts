import { GameState } from "./types";

/**
 * Case Briefing panel UI.
 * Shows case description and objectives.
 */
export function createCaseBriefing(
  container: HTMLElement,
  state: GameState
): { updateObjectives: (completedClueIds: string[]) => void; destroy: () => void } {
  const el = document.createElement("div");
  el.className = "detective-briefing";

  const label = document.createElement("h2");
  label.textContent = "Case Briefing";

  const title = document.createElement("div");
  title.className = "case-title";
  title.textContent = state.currentCase.title;

  const subtitle = document.createElement("div");
  subtitle.className = "case-subtitle";
  subtitle.textContent = state.currentCase.subtitle;

  const text = document.createElement("div");
  text.className = "case-text";
  text.textContent = state.currentCase.briefing;

  const objHeader = document.createElement("h2");
  objHeader.textContent = "Objectives";

  const objList = document.createElement("ul");
  objList.className = "objectives";

  for (const obj of state.currentCase.objectives) {
    const li = document.createElement("li");
    li.textContent = obj;
    objList.appendChild(li);
  }

  el.appendChild(label);
  el.appendChild(title);
  el.appendChild(subtitle);
  el.appendChild(text);
  el.appendChild(objHeader);
  el.appendChild(objList);
  container.appendChild(el);

  function updateObjectives(completedClueIds: string[]) {
    // Mark objectives as done based on clue discovery
    const items = objList.querySelectorAll("li");
    const discovered = state.currentCase.clues.filter((c) => c.discovered);
    const total = state.currentCase.objectives.length;

    // Simple heuristic: mark objectives proportionally to clues discovered
    const ratio = discovered.length / Math.max(state.currentCase.clues.length, 1);
    const toMark = Math.min(Math.floor(ratio * total), total);

    items.forEach((li, i) => {
      if (i < toMark) {
        li.classList.add("done");
      }
    });

    // Always mark the last objective if solved
    if (state.solved && items.length > 0) {
      items.forEach((li) => li.classList.add("done"));
    }
  }

  return {
    updateObjectives,
    destroy: () => {
      container.removeChild(el);
    },
  };
}
