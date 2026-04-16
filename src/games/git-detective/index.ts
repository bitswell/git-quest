import { Case, GameState, BisectState } from "./types";
import { injectStyles } from "./styles";
import { createTerminal } from "./terminal";
import { createEvidenceBoard } from "./evidence-board";
import { createCaseBriefing } from "./case-briefing";
import case1 from "./cases/case1";
import case2 from "./cases/case2";

const CASES: Case[] = [case1, case2];

/**
 * Entry point for Git Detective.
 * Called by the game launcher with a root HTMLElement.
 */
export default function gitDetective(root: HTMLElement): void {
  injectStyles();
  showCaseSelect(root);
}

// ── Case Selection ────────────────────────────────────

function showCaseSelect(root: HTMLElement): void {
  root.innerHTML = "";

  const el = document.createElement("div");
  el.className = "detective-case-select";

  const h1 = document.createElement("h1");
  h1.textContent = "Git Detective";

  const sub = document.createElement("div");
  sub.className = "subtitle";
  sub.textContent = "Choose a case to investigate.";

  const list = document.createElement("div");
  list.className = "case-select-list";

  for (const c of CASES) {
    const card = document.createElement("div");
    card.className = "case-select-card";

    const num = document.createElement("div");
    num.className = "case-num";
    num.textContent = c.id.replace("-", " ").toUpperCase();

    const title = document.createElement("h2");
    title.textContent = c.title;

    const desc = document.createElement("p");
    desc.textContent = c.subtitle;

    card.appendChild(num);
    card.appendChild(title);
    card.appendChild(desc);

    card.addEventListener("click", () => {
      startCase(root, c);
    });

    list.appendChild(card);
  }

  el.appendChild(h1);
  el.appendChild(sub);
  el.appendChild(list);
  root.appendChild(el);
}

// ── Game Session ──────────────────────────────────────

function startCase(root: HTMLElement, caseData: Case): void {
  root.innerHTML = "";

  // Deep-clone the case so clue state is fresh
  const freshCase: Case = JSON.parse(JSON.stringify(caseData));

  const initialBisect: BisectState = {
    active: false,
    goodHash: null,
    badHash: null,
    remaining: [],
    currentIndex: null,
    steps: 0,
    found: false,
    foundHash: null,
  };

  const state: GameState = {
    currentCase: freshCase,
    bisect: initialBisect,
    solved: false,
    commandHistory: [],
    historyIndex: -1,
  };

  const gameRoot = document.createElement("div");
  gameRoot.className = "detective-root";
  root.appendChild(gameRoot);

  // Left panel: case briefing
  const briefingPanel = createCaseBriefing(gameRoot, state);

  // Center panel: terminal
  const terminal = createTerminal(gameRoot, state, {
    onCluesDiscovered(clueIds) {
      evidencePanel.update();
      briefingPanel.updateObjectives(clueIds);
    },
    onSolved() {
      briefingPanel.updateObjectives([]);
      evidencePanel.update();
      showSolvedOverlay(gameRoot, state, root);
    },
  });

  // Right panel: evidence board
  const evidencePanel = createEvidenceBoard(gameRoot, state);

  // Focus the terminal input
  setTimeout(() => terminal.focus(), 100);
}

// ── Solved Overlay ────────────────────────────────────

function showSolvedOverlay(gameRoot: HTMLElement, state: GameState, root: HTMLElement): void {
  const overlay = document.createElement("div");
  overlay.className = "detective-solved-overlay";

  const h2 = document.createElement("h2");
  h2.textContent = "Case Closed";

  const msg = document.createElement("p");
  msg.textContent = state.currentCase.solvedMessage;

  const btn = document.createElement("button");
  btn.textContent = "Back to Cases";
  btn.addEventListener("click", () => {
    showCaseSelect(root);
  });

  overlay.appendChild(h2);
  overlay.appendChild(msg);
  overlay.appendChild(btn);
  gameRoot.appendChild(overlay);
}
