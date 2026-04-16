/** Chapter 7: Branching — create branch, switch, see files change */

import { GameState, Chapter } from "../types";
import { renderNarrative, renderHint } from "../narrative";
import { createWorkspace } from "../workspace";
import {
  createBranch,
  switchBranch,
  stageFile,
  commitFiles,
} from "../state";

const chapter: Chapter = {
  id: 7,
  title: "Branching",

  enter(root, state, onComplete) {
    root.innerHTML = "";

    const content = document.createElement("div");
    content.className = "fc-content";
    root.appendChild(content);

    renderNarrative(
      content,
      "Branching",
      "What if you want to try something without risking your main work? Branches let you work in parallel."
    );

    let hasBranch = state.branches.length > 1;
    let hasCommittedOnBranch = false;
    let hasSwitched = false;

    // Check existing state
    if (hasBranch) {
      const otherBranch = state.branches.find((b) => b.name !== "main");
      if (otherBranch && otherBranch.commits.length > state.branches[0].commits.length) {
        hasCommittedOnBranch = true;
      }
    }

    function checkCompletion() {
      if (hasBranch && hasCommittedOnBranch && hasSwitched && !state.chapterComplete) {
        state.chapterComplete = true;
        onComplete();
      }
    }

    function renderView() {
      // Clear content but keep the narrative
      const existing = content.querySelector(".fc-workspace");
      if (existing) existing.remove();
      const existingBar = content.querySelector(".fc-branch-bar");
      if (existingBar) existingBar.remove();
      const existingBtnRow = content.querySelectorAll(".fc-btn-row");
      existingBtnRow.forEach((el) => el.remove());
      const existingHint = content.querySelectorAll(".fc-hint");
      existingHint.forEach((el) => el.remove());
      const existingStatus = content.querySelectorAll(".fc-status-bar");
      existingStatus.forEach((el) => el.remove());

      // Branch bar
      const branchBar = document.createElement("div");
      branchBar.className = "fc-branch-bar";

      const label = document.createElement("span");
      label.className = "fc-branch-label";
      label.textContent = "On branch:";
      branchBar.appendChild(label);

      // Branch switch buttons
      for (const branch of state.branches) {
        const btn = document.createElement("button");
        btn.className = "fc-branch-btn";
        if (branch.name === state.currentBranch) {
          btn.classList.add("fc-active-branch");
        }
        btn.textContent = branch.name;
        btn.addEventListener("click", () => {
          if (branch.name !== state.currentBranch) {
            switchBranch(state, branch.name);
            hasSwitched = true;
            renderView();
            checkCompletion();
          }
        });
        branchBar.appendChild(btn);
      }

      content.appendChild(branchBar);

      // Workspace
      const workspace = createWorkspace(content, state, {
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

      // Action buttons
      const actionBar = document.createElement("div");
      actionBar.className = "fc-btn-row";
      content.appendChild(actionBar);

      if (!hasBranch) {
        // Create branch button
        const branchBtn = document.createElement("button");
        branchBtn.className = "fc-btn fc-btn-primary";
        branchBtn.textContent = "Create a new branch";
        branchBtn.addEventListener("click", () => {
          const name = prompt("Branch name:", "experiment");
          if (!name || !name.trim()) return;
          const trimmed = name.trim().replace(/\s+/g, "-");
          if (state.branches.find((b) => b.name === trimmed)) return;
          createBranch(state, trimmed);
          switchBranch(state, trimmed);
          hasBranch = true;
          renderView();
        });
        actionBar.appendChild(branchBtn);
        renderHint(content, "Create a new branch to try something different without affecting main.");
      } else if (!hasCommittedOnBranch) {
        // On the branch, prompt a commit
        const commitBtn = document.createElement("button");
        commitBtn.className = "fc-btn fc-btn-primary";
        commitBtn.textContent = "Make a change on this branch";
        commitBtn.addEventListener("click", () => {
          const branchName = state.currentBranch;
          // Add a new file unique to this branch
          const newFile = `${branchName}-idea.txt`;
          state.workingDir.push({
            name: newFile,
            content: `An experimental idea from the ${branchName} branch.`,
            status: "untracked",
          });
          stageFile(state, newFile);
          commitFiles(state, `add ${newFile} on ${branchName}`);
          hasCommittedOnBranch = true;
          renderView();
          checkCompletion();
        });
        actionBar.appendChild(commitBtn);
        renderHint(content, `You're on the "${state.currentBranch}" branch. Make a change here.`);
      } else if (!hasSwitched) {
        renderHint(content, "Now switch back to 'main' using the branch buttons above. Watch the files change!");
      } else {
        renderHint(content, "Notice how each branch has its own set of files. Branching lets you experiment safely.");
      }

      // Status
      const statusBar = document.createElement("div");
      statusBar.className = "fc-status-bar";
      statusBar.textContent = `Branch: ${state.currentBranch} | ${state.commits.length} total commits | ${state.branches.length} branches`;
      content.appendChild(statusBar);
    }

    renderView();
    checkCompletion();
  },
};

export default chapter;
