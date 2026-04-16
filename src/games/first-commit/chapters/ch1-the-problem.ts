/** Chapter 1: The Problem — story editor, disaster loses work */

import { GameState, Chapter } from "../types";
import { renderNarrative } from "../narrative";

const STARTER_TEXT = `Once upon a time, in a small town by the sea, there lived a programmer who loved to write stories...`;

const chapter: Chapter = {
  id: 1,
  title: "The Problem",

  enter(root, state, onComplete) {
    root.innerHTML = "";

    const content = document.createElement("div");
    content.className = "fc-content";
    root.appendChild(content);

    renderNarrative(
      content,
      "The Problem",
      "You're writing a story. You make changes. Everything is going great. But what happens when disaster strikes?"
    );

    // Editor card
    const editorWrap = document.createElement("div");
    editorWrap.className = "fc-editor-wrap";
    content.appendChild(editorWrap);

    const toolbar = document.createElement("div");
    toolbar.className = "fc-editor-toolbar";
    const filename = document.createElement("span");
    filename.className = "fc-editor-filename";
    filename.textContent = "my-story.txt";
    toolbar.appendChild(filename);
    editorWrap.appendChild(toolbar);

    const textarea = document.createElement("textarea");
    textarea.className = "fc-editor-textarea";
    textarea.placeholder = "Start writing your story...";
    textarea.value = state.storyText || STARTER_TEXT;
    editorWrap.appendChild(textarea);

    // Track edits
    let editCount = 0;
    let savedText = textarea.value;

    textarea.addEventListener("input", () => {
      editCount++;
      state.storyText = textarea.value;
      if (editCount >= 3 && !disasterBtn.classList.contains("fc-pulse")) {
        disasterBtn.classList.add("fc-pulse");
      }
    });

    // Disaster button row
    const btnRow = document.createElement("div");
    btnRow.className = "fc-btn-row";
    content.appendChild(btnRow);

    const disasterBtn = document.createElement("button");
    disasterBtn.className = "fc-btn fc-btn-danger";
    disasterBtn.textContent = "Simulate Disaster (power outage!)";
    disasterBtn.addEventListener("click", () => {
      // Save current text before disaster
      savedText = textarea.value;
      // Revert to a truncated/corrupted version
      const lines = STARTER_TEXT.split(" ");
      const corrupted = lines.slice(0, Math.ceil(lines.length / 3)).join(" ") + "...";
      textarea.value = corrupted;
      state.storyText = corrupted;
      textarea.disabled = true;

      // Show loss message
      disasterBtn.remove();

      const lossMsg = document.createElement("div");
      lossMsg.className = "fc-narrative";
      lossMsg.innerHTML = "";

      const h2 = document.createElement("h2");
      h2.textContent = "Your work is gone.";
      h2.style.color = "#f85149";
      lossMsg.appendChild(h2);

      const p = document.createElement("p");
      p.textContent =
        "No undo. No backup. All those edits, lost. This is what happens without version control. But what if your folder could remember every version of every file?";
      lossMsg.appendChild(p);

      btnRow.innerHTML = "";
      btnRow.appendChild(lossMsg);

      state.chapterComplete = true;
      onComplete();
    });

    btnRow.appendChild(disasterBtn);

    // Hint
    const hint = document.createElement("div");
    hint.className = "fc-hint";
    hint.textContent = "Try editing the story above, then click the disaster button to see what happens.";
    content.appendChild(hint);
  },
};

export default chapter;
