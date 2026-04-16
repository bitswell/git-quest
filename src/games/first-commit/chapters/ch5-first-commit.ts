/** Chapter 5: Your First Commit — type message, create commit, celebration */

import { Chapter } from "../types";
import { renderNarrative, renderHint, celebrate } from "../narrative";
import { createWorkspace } from "../workspace";
import { stageFile, unstageFile, commitFiles } from "../state";

const chapter: Chapter = {
  id: 5,
  title: "Your First Commit",

  enter(root, state, onComplete) {
    root.innerHTML = "";

    const content = document.createElement("div");
    content.className = "fc-content";
    root.appendChild(content);

    renderNarrative(
      content,
      "Your First Commit",
      "The staging area is packed. Time to save this snapshot forever. A commit is a permanent record of your files at this moment."
    );

    // Ensure we have staged files (user might navigate back/forward)
    if (state.stagingArea.length === 0) {
      // Stage all working dir files that are stageable
      for (const f of state.workingDir) {
        if (f.status === "untracked" || f.status === "modified") {
          stageFile(state, f.name);
        }
      }
    }

    function handleStage(fileName: string) {
      stageFile(state, fileName);
      workspace.update();
      updateCommitBtn();
    }

    function handleUnstage(fileName: string) {
      unstageFile(state, fileName);
      workspace.update();
      updateCommitBtn();
    }

    const workspace = createWorkspace(content, state, {
      onFileAdd: handleStage,
      onFileUnstage: handleUnstage,
      draggable: true,
      onDragStage: handleStage,
    });

    // Commit controls
    const commitBar = document.createElement("div");
    commitBar.className = "fc-btn-row";
    commitBar.style.flexDirection = "column";
    commitBar.style.alignItems = "center";
    commitBar.style.gap = "8px";
    content.appendChild(commitBar);

    const msgInput = document.createElement("input");
    msgInput.className = "fc-input";
    msgInput.type = "text";
    msgInput.placeholder = "Type your commit message...";
    msgInput.style.width = "300px";
    msgInput.style.textAlign = "center";
    commitBar.appendChild(msgInput);

    const commitBtn = document.createElement("button");
    commitBtn.className = "fc-btn fc-btn-success";
    commitBtn.innerHTML = '<span class="fc-cmd">git commit</span>';
    commitBtn.disabled = true;
    commitBar.appendChild(commitBtn);

    function updateCommitBtn() {
      commitBtn.disabled =
        state.stagingArea.length === 0 || msgInput.value.trim().length === 0;
    }

    msgInput.addEventListener("input", updateCommitBtn);

    commitBtn.addEventListener("click", () => {
      const message = msgInput.value.trim();
      if (!message || state.stagingArea.length === 0) return;

      const commit = commitFiles(state, message);
      workspace.update();

      // Disable commit controls
      msgInput.disabled = true;
      commitBtn.disabled = true;

      // Celebration
      celebrate(root);

      const celebDiv = document.createElement("div");
      celebDiv.className = "fc-celebration";

      const h2 = document.createElement("h2");
      h2.textContent = "First Commit!";
      celebDiv.appendChild(h2);

      const p = document.createElement("p");
      p.textContent = `You just created your first commit: ${commit.hash}. "${message}" is now a permanent snapshot of your files. You can never lose this version.`;
      celebDiv.appendChild(p);

      const dismissBtn = document.createElement("button");
      dismissBtn.className = "fc-btn";
      dismissBtn.textContent = "Continue";
      dismissBtn.addEventListener("click", () => celebDiv.remove());
      celebDiv.appendChild(dismissBtn);

      root.appendChild(celebDiv);

      state.chapterComplete = true;
      onComplete();
    });

    renderHint(
      content,
      "Type a commit message describing what you changed, then click commit."
    );

    updateCommitBtn();
  },
};

export default chapter;
