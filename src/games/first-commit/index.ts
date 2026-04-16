/** First Commit — interactive visual tutorial for git beginners */

import { Chapter } from "./types";
import { injectStyles } from "./styles";
import { createInitialState } from "./state";
import { createChapterNav } from "./chapter-nav";
import ch1 from "./chapters/ch1-the-problem";
import ch2 from "./chapters/ch2-git-init";
import ch3 from "./chapters/ch3-making-changes";
import ch4 from "./chapters/ch4-staging-area";
import ch5 from "./chapters/ch5-first-commit";
import ch6 from "./chapters/ch6-history";
import ch7 from "./chapters/ch7-branching";
import ch8 from "./chapters/ch8-merging";

const CHAPTERS: Chapter[] = [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8];

/**
 * Entry point for First Commit.
 * Called by the game launcher with a root HTMLElement.
 */
export default function firstCommit(root: HTMLElement): void {
  injectStyles();

  const state = createInitialState();

  const gameRoot = document.createElement("div");
  gameRoot.className = "fc-root";
  root.appendChild(gameRoot);

  // Chapter content container
  const chapterContainer = document.createElement("div");
  chapterContainer.style.cssText = "flex: 1; display: flex; flex-direction: column; overflow: hidden;";

  // Navigation
  const nav = createChapterNav(
    state,
    () => goToChapter(state.chapter - 1),
    () => goToChapter(state.chapter + 1)
  );

  gameRoot.appendChild(nav.el);
  gameRoot.appendChild(chapterContainer);

  function goToChapter(num: number): void {
    if (num < 1 || num > CHAPTERS.length) return;
    state.chapter = num;
    state.chapterComplete = false;
    enterChapter();
  }

  function enterChapter(): void {
    chapterContainer.innerHTML = "";
    nav.update();

    const chapter = CHAPTERS[state.chapter - 1];
    if (!chapter) return;

    chapter.enter(chapterContainer, state, () => {
      // Chapter completed
      nav.update();
    });
  }

  // Start at chapter 1
  enterChapter();
}
