/** Chapter 2: git init — three zones materialize */

import { GameState, Chapter } from "../types";
import { renderNarrative, renderHint } from "../narrative";
import { createWorkspace } from "../workspace";

const chapter: Chapter = {
  id: 2,
  title: "git init",

  enter(root, state, onComplete) {
    root.innerHTML = "";

    const content = document.createElement("div");
    content.className = "fc-content";
    root.appendChild(content);

    renderNarrative(
      content,
      "git init",
      "What if your folder could remember every version of every file? That's exactly what git does. Let's set it up."
    );

    if (state.initialized) {
      // Already initialized — show workspace directly
      showWorkspace(content, state);
      state.chapterComplete = true;
      onComplete();
      return;
    }

    // Show a folder visualization with the story file
    const folder = document.createElement("div");
    folder.style.cssText =
      "max-width: 400px; margin: 20px auto; background: #16213e; border-radius: 8px; border: 1px solid #2a2a4e; padding: 20px; text-align: center;";
    content.appendChild(folder);

    const folderIcon = document.createElement("div");
    folderIcon.style.cssText = "font-size: 40px; margin-bottom: 12px;";
    folderIcon.textContent = "\uD83D\uDCC1";
    folder.appendChild(folderIcon);

    const folderLabel = document.createElement("div");
    folderLabel.style.cssText = "color: #8b949e; font-size: 14px; margin-bottom: 8px;";
    folderLabel.textContent = "my-project/";
    folder.appendChild(folderLabel);

    const fileItem = document.createElement("div");
    fileItem.style.cssText =
      "background: #1a1a36; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #e6e6e6;";
    fileItem.textContent = "my-story.txt";
    folder.appendChild(fileItem);

    // Command button
    const btnRow = document.createElement("div");
    btnRow.className = "fc-btn-row";
    content.appendChild(btnRow);

    const initBtn = document.createElement("button");
    initBtn.className = "fc-btn fc-btn-primary fc-pulse";
    initBtn.innerHTML = '<span class="fc-cmd">$ git init</span>';
    initBtn.addEventListener("click", () => {
      state.initialized = true;

      // Ensure the story file is in working dir
      if (state.workingDir.length === 0) {
        state.workingDir.push({
          name: "my-story.txt",
          content: state.storyText || "Once upon a time...",
          status: "untracked",
        });
      }

      // Animate folder away, show workspace
      folder.style.transition = "opacity 0.3s, transform 0.3s";
      folder.style.opacity = "0";
      folder.style.transform = "scale(0.95)";
      initBtn.remove();

      setTimeout(() => {
        folder.remove();
        btnRow.remove();
        // Remove hint if present
        const hint = content.querySelector(".fc-hint");
        if (hint) hint.remove();

        // Show a ".git initialized" message briefly
        const initMsg = document.createElement("div");
        initMsg.className = "fc-hint";
        initMsg.style.color = "#3fb950";
        initMsg.textContent = "Initialized empty Git repository. Your folder now has a .git directory watching for changes.";
        content.appendChild(initMsg);

        setTimeout(() => {
          initMsg.remove();
          showWorkspace(content, state);
          state.chapterComplete = true;
          onComplete();
        }, 1500);
      }, 300);
    });

    btnRow.appendChild(initBtn);
    renderHint(content, "Click the button above to initialize git in your project folder.");
  },
};

function showWorkspace(content: HTMLElement, state: GameState): void {
  createWorkspace(content, state, { singleZone: false });

  // Status bar
  const statusBar = document.createElement("div");
  statusBar.className = "fc-status-bar";
  statusBar.textContent = "Git is now watching your folder. The three zones show how git organizes your work.";
  content.appendChild(statusBar);
}

export default chapter;
