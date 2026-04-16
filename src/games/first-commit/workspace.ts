/** Three-zone visual workspace renderer */

import { GameState, FileObj, CommitObj } from "./types";
import { getBranchCommits } from "./state";

export interface WorkspaceOptions {
  singleZone?: boolean;
  showStaging?: boolean;
  showRepo?: boolean;
  onFileAdd?: (fileName: string) => void;
  onFileUnstage?: (fileName: string) => void;
  onCommitClick?: (commit: CommitObj) => void;
  draggable?: boolean;
  onDragStage?: (fileName: string) => void;
}

/** Create the three-zone workspace DOM and return an update function */
export function createWorkspace(
  container: HTMLElement,
  state: GameState,
  opts: WorkspaceOptions = {}
): { update: () => void; el: HTMLElement } {
  const ws = document.createElement("div");
  ws.className = "fc-workspace" + (opts.singleZone ? " fc-single-zone" : "");
  container.appendChild(ws);

  // Working Directory zone
  const workZone = createZone("workdir", "Working Directory", "Your files — make changes here");
  ws.appendChild(workZone.el);

  // Staging Area zone
  const stageZone = createZone("staging", "Staging Area", "Packed and ready to save");
  ws.appendChild(stageZone.el);
  setupDropTarget(stageZone, opts);

  // Repository zone
  const repoZone = createZone("repo", "Repository", "Saved snapshots");
  ws.appendChild(repoZone.el);

  function update() {
    renderWorkingDir(workZone.body, state, opts);
    renderStagingArea(stageZone.body, state, opts);
    renderTimeline(repoZone.body, state, opts);
  }

  update();
  return { update, el: ws };
}

interface ZoneParts {
  el: HTMLElement;
  body: HTMLElement;
}

function createZone(type: string, title: string, subtitle: string): ZoneParts {
  const el = document.createElement("div");
  el.className = `fc-zone fc-zone-${type}`;

  const header = document.createElement("div");
  header.className = "fc-zone-header";

  const h3 = document.createElement("h3");
  h3.textContent = title;
  header.appendChild(h3);

  const sub = document.createElement("div");
  sub.className = "fc-zone-subtitle";
  sub.textContent = subtitle;
  header.appendChild(sub);

  const body = document.createElement("div");
  body.className = "fc-zone-body";

  el.appendChild(header);
  el.appendChild(body);

  return { el, body };
}

function setupDropTarget(zone: ZoneParts, opts: WorkspaceOptions) {
  zone.el.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.el.classList.add("fc-drag-over");
  });
  zone.el.addEventListener("dragleave", () => {
    zone.el.classList.remove("fc-drag-over");
  });
  zone.el.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.el.classList.remove("fc-drag-over");
    const fileName = e.dataTransfer?.getData("text/plain");
    if (fileName && opts.onDragStage) {
      opts.onDragStage(fileName);
    }
  });
}

function renderWorkingDir(body: HTMLElement, state: GameState, opts: WorkspaceOptions) {
  body.innerHTML = "";
  if (state.workingDir.length === 0) {
    const empty = document.createElement("div");
    empty.className = "fc-empty-zone";
    empty.textContent = "No files yet";
    body.appendChild(empty);
    return;
  }

  for (const file of state.workingDir) {
    const card = createFileCard(file, opts);
    body.appendChild(card);
  }
}

function renderStagingArea(body: HTMLElement, state: GameState, opts: WorkspaceOptions) {
  body.innerHTML = "";
  if (state.stagingArea.length === 0) {
    const empty = document.createElement("div");
    empty.className = "fc-empty-zone";
    empty.textContent = opts.onFileAdd || opts.draggable
      ? "Drag files here or click 'git add'"
      : "Nothing staged yet";
    body.appendChild(empty);
    return;
  }

  for (const file of state.stagingArea) {
    const card = createFileCard(file, opts, true);
    body.appendChild(card);
  }
}

function createFileCard(
  file: FileObj,
  opts: WorkspaceOptions,
  isStaged = false
): HTMLElement {
  const card = document.createElement("div");
  card.className = `fc-file-card fc-${file.status}`;

  if (opts.draggable && !isStaged) {
    card.className += " fc-draggable";
    card.draggable = true;
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("text/plain", file.name);
    });
  }

  // Name row
  const nameRow = document.createElement("div");
  nameRow.className = "fc-file-name";

  const nameSpan = document.createElement("span");
  nameSpan.textContent = file.name;
  nameRow.appendChild(nameSpan);

  const statusBadge = document.createElement("span");
  statusBadge.className = "fc-file-status";
  statusBadge.textContent = file.status;
  nameRow.appendChild(statusBadge);

  card.appendChild(nameRow);

  // Preview
  if (file.content) {
    const preview = document.createElement("div");
    preview.className = "fc-file-preview";
    preview.textContent = file.content.split("\n")[0].slice(0, 60);
    card.appendChild(preview);
  }

  // Actions
  const actions = document.createElement("div");
  actions.className = "fc-file-actions";

  if (!isStaged && opts.onFileAdd && (file.status === "untracked" || file.status === "modified")) {
    const addBtn = document.createElement("button");
    addBtn.className = "fc-file-btn fc-add-btn";
    addBtn.textContent = "git add";
    addBtn.addEventListener("click", () => opts.onFileAdd!(file.name));
    actions.appendChild(addBtn);
  }

  if (isStaged && opts.onFileUnstage) {
    const unstageBtn = document.createElement("button");
    unstageBtn.className = "fc-file-btn fc-unstage-btn";
    unstageBtn.textContent = "unstage";
    unstageBtn.addEventListener("click", () => opts.onFileUnstage!(file.name));
    actions.appendChild(unstageBtn);
  }

  if (actions.children.length > 0) {
    card.appendChild(actions);
  }

  return card;
}

export function renderTimeline(
  body: HTMLElement,
  state: GameState,
  opts: WorkspaceOptions
) {
  body.innerHTML = "";
  const commits = getBranchCommits(state);

  if (commits.length === 0) {
    const empty = document.createElement("div");
    empty.className = "fc-empty-zone";
    empty.textContent = "No commits yet";
    body.appendChild(empty);
    return;
  }

  const timeline = document.createElement("div");
  timeline.className = "fc-timeline";

  // Display newest first
  const reversed = [...commits].reverse();
  for (let i = 0; i < reversed.length; i++) {
    const commit = reversed[i];
    const node = document.createElement("div");
    node.className = "fc-commit-node";

    // Dot column
    const dotCol = document.createElement("div");
    dotCol.className = "fc-commit-dot-col";

    const dot = document.createElement("div");
    const branchClass = commit.branch === "main" ? "fc-branch-main" : "fc-branch-secondary";
    dot.className = `fc-commit-dot ${branchClass}`;
    dotCol.appendChild(dot);

    if (i < reversed.length - 1) {
      const line = document.createElement("div");
      line.className = "fc-commit-line";
      dotCol.appendChild(line);
    }

    node.appendChild(dotCol);

    // Info
    const info = document.createElement("div");
    info.className = "fc-commit-info";

    const hashSpan = document.createElement("span");
    hashSpan.className = "fc-commit-hash";
    hashSpan.textContent = commit.hash;
    info.appendChild(hashSpan);

    // Branch tag on latest commit of each branch
    const branch = state.branches.find((b) => b.headHash === commit.hash);
    if (branch) {
      const tag = document.createElement("span");
      const tagClass = branch.name === "main" ? "fc-branch-tag-main" : "fc-branch-tag-secondary";
      tag.className = `fc-commit-branch-tag ${tagClass}`;
      tag.textContent = branch.name;
      info.appendChild(tag);
    }

    const msgEl = document.createElement("div");
    msgEl.className = "fc-commit-msg";
    msgEl.textContent = commit.message;
    info.appendChild(msgEl);

    node.appendChild(info);

    if (opts.onCommitClick) {
      node.style.cursor = "pointer";
      node.addEventListener("click", () => opts.onCommitClick!(commit));
    }

    timeline.appendChild(node);
  }

  body.appendChild(timeline);
}
