/** Chapter 3: Making Changes — create/edit files, see status colors */

import { Chapter } from "../types";
import { renderNarrative, renderHint } from "../narrative";
import { createWorkspace } from "../workspace";

const chapter: Chapter = {
  id: 3,
  title: "Making Changes",

  enter(root, state, onComplete) {
    root.innerHTML = "";

    const content = document.createElement("div");
    content.className = "fc-content";
    root.appendChild(content);

    renderNarrative(
      content,
      "Making Changes",
      "Git can see your files, but it doesn't track them automatically. Let's see what git notices when you create and edit files."
    );

    let hasCreated = false;
    let hasModified = false;

    function checkCompletion() {
      if (hasCreated && hasModified && !state.chapterComplete) {
        state.chapterComplete = true;
        onComplete();

        const msg = document.createElement("div");
        msg.className = "fc-hint";
        msg.style.color = "#3fb950";
        msg.textContent = "You can see how git tracks the status of each file. Untracked files are new. Modified files have changed since git last saved them.";
        content.appendChild(msg);
      }
    }

    // Ensure the story file is in working dir
    if (state.workingDir.length === 0 && state.initialized) {
      state.workingDir.push({
        name: "my-story.txt",
        content: state.storyText || "Once upon a time...",
        status: "untracked",
      });
    }

    // Check existing state
    if (state.workingDir.some((f) => f.status === "untracked" && f.name !== "my-story.txt")) {
      hasCreated = true;
    }
    if (state.workingDir.some((f) => f.status === "modified")) {
      hasModified = true;
    }

    const { update } = createWorkspace(content, state);

    // Action bar
    const actionBar = document.createElement("div");
    actionBar.className = "fc-btn-row";
    content.appendChild(actionBar);

    // Create new file button
    const createBtn = document.createElement("button");
    createBtn.className = "fc-btn";
    createBtn.textContent = "Create New File";
    createBtn.addEventListener("click", () => {
      const name = prompt("File name:", "notes.txt");
      if (!name || !name.trim()) return;
      const trimmed = name.trim();
      if (state.workingDir.find((f) => f.name === trimmed)) {
        return; // Already exists
      }
      state.workingDir.push({
        name: trimmed,
        content: "",
        status: "untracked",
      });
      hasCreated = true;
      update();
      checkCompletion();
    });
    actionBar.appendChild(createBtn);

    // Edit file button
    const editBtn = document.createElement("button");
    editBtn.className = "fc-btn";
    editBtn.textContent = "Edit a File";
    editBtn.addEventListener("click", () => {
      if (state.workingDir.length === 0) return;
      // Let user pick which file to edit
      const names = state.workingDir.map((f) => f.name);
      const choice = prompt(`Which file to edit?\n${names.join(", ")}`, names[0]);
      if (!choice) return;
      const file = state.workingDir.find((f) => f.name === choice.trim());
      if (!file) return;

      const newContent = prompt(`Edit content of ${file.name}:`, file.content);
      if (newContent === null) return;
      file.content = newContent;
      if (file.status === "committed") {
        file.status = "modified";
      }
      hasModified = true;
      update();
      checkCompletion();
    });
    actionBar.appendChild(editBtn);

    renderHint(
      content,
      "Create a new file and edit an existing one to see how git tracks file status."
    );

    // Check if already complete
    checkCompletion();
  },
};

export default chapter;
