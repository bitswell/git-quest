/** Chapter 8: Merging — merge branches, timeline converges, completion */

import { GameState, Chapter } from "../types";
import { renderNarrative, celebrate } from "../narrative";
import { createWorkspace } from "../workspace";
import {
  switchBranch,
  createBranch,
  commitFiles,
  stageFile,
} from "../state";

const chapter: Chapter = {
  id: 8,
  title: "Merging",

  enter(root, state, onComplete) {
    root.innerHTML = "";

    const content = document.createElement("div");
    content.className = "fc-content";
    root.appendChild(content);

    renderNarrative(
      content,
      "Merging",
      "Your experiment worked! Time to bring those changes back to main. Merging combines work from two branches."
    );

    // Ensure we're on main for the merge
    if (state.currentBranch !== "main") {
      switchBranch(state, "main");
    }

    // Find the other branch
    let otherBranch = state.branches.find((b) => b.name !== "main");
    if (!otherBranch) {
      // Edge case: no other branch exists. Create one with a commit.
      createBranch(state, "experiment");
      switchBranch(state, "experiment");
      state.workingDir.push({
        name: "experiment-idea.txt",
        content: "An experimental idea.",
        status: "untracked",
      });
      stageFile(state, "experiment-idea.txt");
      commitFiles(state, "add experiment idea");
      switchBranch(state, "main");
      otherBranch = state.branches.find((b) => b.name === "experiment");
    }

    const mergeBranchName = otherBranch ? otherBranch.name : "experiment";

    // Branch bar (read-only indicator)
    const branchBar = document.createElement("div");
    branchBar.className = "fc-branch-bar";

    const label = document.createElement("span");
    label.className = "fc-branch-label";
    label.textContent = "On branch:";
    branchBar.appendChild(label);

    const branchName = document.createElement("span");
    branchName.className = "fc-branch-name";
    branchName.textContent = "main";
    branchBar.appendChild(branchName);

    content.appendChild(branchBar);

    const workspace = createWorkspace(content, state);

    // Merge button
    const actionBar = document.createElement("div");
    actionBar.className = "fc-btn-row";
    content.appendChild(actionBar);

    const mergeBtn = document.createElement("button");
    mergeBtn.className = "fc-btn fc-btn-success fc-pulse";
    mergeBtn.innerHTML = `<span class="fc-cmd">git merge ${mergeBranchName}</span>`;
    mergeBtn.addEventListener("click", () => {
      performMerge(state, mergeBranchName);
      workspace.update();
      mergeBtn.remove();

      // Show completion
      celebrate(root);

      setTimeout(() => {
        showCompletion(root, state);
        state.chapterComplete = true;
        onComplete();
      }, 1000);
    });
    actionBar.appendChild(mergeBtn);

    const hint = document.createElement("div");
    hint.className = "fc-hint";
    hint.textContent = `Click merge to bring the "${mergeBranchName}" branch into main.`;
    content.appendChild(hint);
  },
};

function performMerge(state: GameState, branchName: string): void {
  const otherBranch = state.branches.find((b) => b.name === branchName);
  if (!otherBranch) return;

  // Get files from the other branch's HEAD
  const otherHead = state.commits.find((c) => c.hash === otherBranch.headHash);
  if (!otherHead) return;

  // Add any files from the other branch that aren't already in working dir
  for (const file of otherHead.files) {
    const existing = state.workingDir.find((f) => f.name === file.name);
    if (!existing) {
      state.workingDir.push({
        name: file.name,
        content: file.content,
        status: "untracked",
      });
    }
  }

  // Stage all new files and commit as merge
  for (const f of state.workingDir) {
    if (f.status === "untracked" || f.status === "modified") {
      stageFile(state, f.name);
    }
  }

  // If nothing staged, stage everything
  if (state.stagingArea.length === 0) {
    for (const f of state.workingDir) {
      stageFile(state, f.name);
    }
  }

  const mergeCommit = commitFiles(state, `Merge branch '${branchName}' into main`);

  // Also add the other branch's commits to main's commit list
  const mainBranch = state.branches.find((b) => b.name === "main");
  if (mainBranch) {
    for (const hash of otherBranch.commits) {
      if (!mainBranch.commits.includes(hash)) {
        // Insert before the merge commit
        const mergeIdx = mainBranch.commits.indexOf(mergeCommit.hash);
        mainBranch.commits.splice(mergeIdx, 0, hash);
      }
    }
  }
}

function showCompletion(root: HTMLElement, state: GameState): void {
  const overlay = document.createElement("div");
  overlay.className = "fc-celebration";

  const completeDiv = document.createElement("div");
  completeDiv.className = "fc-complete";

  const h2 = document.createElement("h2");
  h2.textContent = "You Did It!";
  completeDiv.appendChild(h2);

  const p = document.createElement("p");
  p.textContent =
    "You now understand the fundamentals of git. You can track files, stage changes, commit snapshots, explore history, create branches, and merge them together. These are the building blocks of every git workflow.";
  completeDiv.appendChild(p);

  // Skills earned
  const skills = document.createElement("div");
  skills.className = "fc-skills";
  const badges = [
    "git init",
    "git add",
    "git commit",
    "git log",
    "git branch",
    "git merge",
  ];
  for (const badge of badges) {
    const el = document.createElement("span");
    el.className = "fc-skill-badge";
    el.textContent = badge;
    skills.appendChild(el);
  }
  completeDiv.appendChild(skills);

  // Stats
  const stats = document.createElement("p");
  stats.style.fontSize = "14px";
  stats.textContent = `${state.commits.length} commits made across ${state.branches.length} branches.`;
  completeDiv.appendChild(stats);

  overlay.appendChild(completeDiv);
  root.appendChild(overlay);
}

export default chapter;
