/** Chapter navigation — progress bar, prev/next buttons */

import { GameState } from "./types";

const TOTAL_CHAPTERS = 8;

const CHAPTER_TITLES = [
  "The Problem",
  "git init",
  "Making Changes",
  "The Staging Area",
  "Your First Commit",
  "History",
  "Branching",
  "Merging",
];

export interface NavControls {
  el: HTMLElement;
  update: () => void;
}

export function createChapterNav(
  state: GameState,
  onPrev: () => void,
  onNext: () => void
): NavControls {
  const nav = document.createElement("div");
  nav.className = "fc-nav";

  // Title
  const title = document.createElement("div");
  title.className = "fc-nav-title";
  nav.appendChild(title);

  // Prev
  const prevBtn = document.createElement("button");
  prevBtn.className = "fc-nav-btn";
  prevBtn.textContent = "Previous";
  prevBtn.addEventListener("click", onPrev);
  nav.appendChild(prevBtn);

  // Progress dots
  const progress = document.createElement("div");
  progress.className = "fc-progress";
  for (let i = 0; i < TOTAL_CHAPTERS; i++) {
    const dot = document.createElement("div");
    dot.className = "fc-progress-dot";
    progress.appendChild(dot);
  }
  nav.appendChild(progress);

  // Next
  const nextBtn = document.createElement("button");
  nextBtn.className = "fc-nav-btn";
  nextBtn.textContent = "Next";
  nextBtn.addEventListener("click", onNext);
  nav.appendChild(nextBtn);

  function update() {
    title.textContent = `Ch ${state.chapter}: ${CHAPTER_TITLES[state.chapter - 1]}`;
    prevBtn.disabled = state.chapter <= 1;
    nextBtn.disabled = !state.chapterComplete;

    const dots = progress.querySelectorAll(".fc-progress-dot");
    dots.forEach((dot, i) => {
      dot.className = "fc-progress-dot";
      if (i < state.chapter - 1) dot.classList.add("done");
      if (i === state.chapter - 1) dot.classList.add("active");
    });
  }

  update();
  return { el: nav, update };
}
