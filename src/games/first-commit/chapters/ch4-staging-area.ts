/** Chapter 4: The Staging Area — drag/click files to staging (KEY chapter) */

import { Chapter } from "../types";
import { renderNarrative, renderHint } from "../narrative";
import { createWorkspace } from "../workspace";
import { stageFile, unstageFile } from "../state";

const chapter: Chapter = {
  id: 4,
  title: "The Staging Area",

  enter(root, state, onComplete) {
    root.innerHTML = "";

    const content = document.createElement("div");
    content.className = "fc-content";
    root.appendChild(content);

    renderNarrative(
      content,
      "The Staging Area",
      "Before saving a snapshot, you choose WHICH changes to include. Think of it like packing a box before shipping it. The file stays in your folder — a copy goes to the staging area."
    );

    // Ensure there are files to stage
    if (state.workingDir.length === 0) {
      state.workingDir.push(
        {
          name: "my-story.txt",
          content: state.storyText || "Once upon a time...",
          status: "untracked",
        },
        {
          name: "notes.txt",
          content: "Some notes about the story.",
          status: "untracked",
        }
      );
    }

    // Make sure at least some files are stageable
    for (const f of state.workingDir) {
      if (f.status === "committed") {
        // If they haven't modified it since last commit, leave it. But if this is ch4
        // and nothing is stageable, mark story as modified to give them something to do.
      }
    }

    const stageableFiles = state.workingDir.filter(
      (f) => f.status === "untracked" || f.status === "modified"
    );
    if (stageableFiles.length === 0 && state.workingDir.length > 0) {
      // Force at least one file to be modified so user has something to stage
      state.workingDir[0].status = "modified";
    }

    function handleStage(fileName: string) {
      stageFile(state, fileName);
      workspace.update();
      checkCompletion();
    }

    function handleUnstage(fileName: string) {
      unstageFile(state, fileName);
      workspace.update();
    }

    const workspace = createWorkspace(content, state, {
      onFileAdd: handleStage,
      onFileUnstage: handleUnstage,
      onDragStage: handleStage,
      draggable: true,
    });

    // Status bar showing git add command
    const statusBar = document.createElement("div");
    statusBar.className = "fc-status-bar";
    statusBar.innerHTML =
      'Drag files to the Staging Area, or click <span class="fc-cmd">git add</span> on each file card.';
    content.appendChild(statusBar);

    renderHint(
      content,
      "Notice: staging a file creates a COPY in the staging area. The original stays in your working directory."
    );

    function checkCompletion() {
      if (state.stagingArea.length > 0 && !state.chapterComplete) {
        state.chapterComplete = true;
        onComplete();
      }
    }

    // Check if already complete
    checkCompletion();
  },
};

export default chapter;
