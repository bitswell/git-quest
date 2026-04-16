/** Chapter 6: History — build up commits, click timeline to view past states */

import { Chapter, CommitObj } from "../types";
import { renderNarrative, renderHint } from "../narrative";
import { createWorkspace } from "../workspace";
import { stageFile, commitFiles } from "../state";

const chapter: Chapter = {
  id: 6,
  title: "History",

  enter(root, state, onComplete) {
    root.innerHTML = "";

    const content = document.createElement("div");
    content.className = "fc-content";
    root.appendChild(content);

    renderNarrative(
      content,
      "History",
      "Every commit is a moment in time you can return to. Let's build up some history and learn to look back."
    );

    let hasViewedHistory = false;

    function handleCommitClick(commit: CommitObj) {
      hasViewedHistory = true;
      // Show files from that commit in a read-only view
      renderSnapshotView(content, commit, () => {
        renderMainView();
      });
      checkCompletion();
    }

    function checkCompletion() {
      if (state.commits.length >= 3 && hasViewedHistory && !state.chapterComplete) {
        state.chapterComplete = true;
        onComplete();
      }
    }

    // Guide the user through making more commits if needed
    const guidedPrompts = [
      { file: "my-story.txt", content: "Once upon a time, a programmer learned git...", msg: "update story" },
      { file: "notes.txt", content: "Git tracks changes. Commits are snapshots.", msg: "add notes about git" },
      { file: "my-story.txt", content: "The programmer saved every version and never lost work again.", msg: "finish the story" },
    ];

    function renderMainView() {
      content.innerHTML = "";
      renderNarrative(
        content,
        "History",
        state.commits.length < 3
          ? `You have ${state.commits.length} commit${state.commits.length === 1 ? "" : "s"}. Make ${3 - state.commits.length} more to build up history.`
          : "Click any commit in the timeline to view your files at that point in time."
      );

      const workspace = createWorkspace(content, state, {
        onCommitClick: handleCommitClick,
        onFileAdd: (name) => {
          stageFile(state, name);
          workspace.update();
        },
        draggable: true,
        onDragStage: (name) => {
          stageFile(state, name);
          workspace.update();
        },
      });

      if (state.commits.length < 3) {
        const actionBar = document.createElement("div");
        actionBar.className = "fc-btn-row";
        content.appendChild(actionBar);

        // Quick-action: make a guided change + stage + commit
        const quickBtn = document.createElement("button");
        quickBtn.className = "fc-btn fc-btn-primary";
        quickBtn.textContent = `Make a change and commit`;
        quickBtn.addEventListener("click", () => {
          const p = guidedPrompts[Math.min(state.commits.length, guidedPrompts.length - 1)];
          // Update or add the file
          const existing = state.workingDir.find((f) => f.name === p.file);
          if (existing) {
            existing.content = p.content;
            existing.status = "modified";
          } else {
            state.workingDir.push({ name: p.file, content: p.content, status: "untracked" });
          }
          // Stage and commit
          stageFile(state, p.file);
          commitFiles(state, p.msg);

          renderMainView();
          checkCompletion();
        });
        actionBar.appendChild(quickBtn);

        renderHint(content, `Commit ${state.commits.length + 1} of 3 — click the button to make a quick guided change.`);
      } else {
        renderHint(
          content,
          hasViewedHistory
            ? "You've explored your history. Each commit is a snapshot you can always return to."
            : "Click on a commit in the Repository timeline to view your files at that moment."
        );
      }
    }

    renderMainView();
  },
};

function renderSnapshotView(
  content: HTMLElement,
  commit: CommitObj,
  onBack: () => void
): void {
  content.innerHTML = "";

  const header = document.createElement("div");
  header.className = "fc-narrative";

  const h2 = document.createElement("h2");
  h2.textContent = "Viewing Past Snapshot";
  header.appendChild(h2);

  const p = document.createElement("p");
  p.textContent = `Commit ${commit.hash}: "${commit.message}"`;
  header.appendChild(p);

  content.appendChild(header);

  const label = document.createElement("div");
  label.className = "fc-snapshot-label";
  label.textContent = `Viewing commit ${commit.hash} (read-only)`;
  content.appendChild(label);

  // Show files from this commit
  const fileList = document.createElement("div");
  fileList.style.cssText =
    "display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; padding: 12px;";
  for (const file of commit.files) {
    const card = document.createElement("div");
    card.className = "fc-file-card fc-committed";

    const nameEl = document.createElement("div");
    nameEl.className = "fc-file-name";
    const nameSpan = document.createElement("span");
    nameSpan.textContent = file.name;
    nameEl.appendChild(nameSpan);
    card.appendChild(nameEl);

    const preview = document.createElement("div");
    preview.className = "fc-file-preview";
    preview.textContent = file.content.split("\n")[0].slice(0, 80);
    card.appendChild(preview);

    fileList.appendChild(card);
  }
  content.appendChild(fileList);

  const btnRow = document.createElement("div");
  btnRow.className = "fc-btn-row";
  const backBtn = document.createElement("button");
  backBtn.className = "fc-btn";
  backBtn.textContent = "Back to current";
  backBtn.addEventListener("click", onBack);
  btnRow.appendChild(backBtn);
  content.appendChild(btnRow);
}

export default chapter;
