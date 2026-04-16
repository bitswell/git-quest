/** Scoped CSS injection for First Commit — warm, welcoming tutorial aesthetic */

const STYLES = `
/* ── First Commit — Root ──────────────────────────────── */

.fc-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1a1a2e;
  color: #e6e6e6;
  overflow: hidden;
  position: relative;
}

/* ── Chapter Navigation ───────────────────────────────── */

.fc-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #12122a;
  border-bottom: 1px solid #2a2a4e;
  flex-shrink: 0;
}

.fc-nav-title {
  font-size: 14px;
  font-weight: 600;
  color: #f0883e;
  white-space: nowrap;
}

.fc-progress {
  display: flex;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.fc-progress-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2a2a4e;
  transition: background 0.3s, transform 0.3s;
}

.fc-progress-dot.done {
  background: #f0883e;
}

.fc-progress-dot.active {
  background: #f0883e;
  transform: scale(1.3);
  box-shadow: 0 0 8px rgba(240, 136, 62, 0.5);
}

.fc-nav-btn {
  padding: 6px 16px;
  background: transparent;
  border: 1px solid #3a3a5e;
  color: #8b949e;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  transition: border-color 0.2s, color 0.2s;
}

.fc-nav-btn:hover:not(:disabled) {
  border-color: #f0883e;
  color: #f0883e;
}

.fc-nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

/* ── Narrative ────────────────────────────────────────── */

.fc-narrative {
  padding: 20px 24px;
  text-align: center;
  flex-shrink: 0;
}

.fc-narrative h2 {
  margin: 0 0 8px;
  font-size: 22px;
  color: #f0883e;
  font-weight: 700;
}

.fc-narrative p {
  margin: 0;
  font-size: 16px;
  color: #8b949e;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

/* ── Content Area ─────────────────────────────────────── */

.fc-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 20px 20px;
}

/* ── Three-Zone Workspace ─────────────────────────────── */

.fc-workspace {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  min-height: 0;
}

.fc-workspace.fc-single-zone {
  grid-template-columns: 1fr;
}

.fc-workspace.fc-single-zone .fc-zone:not(.fc-zone-workdir) {
  display: none;
}

.fc-zone {
  background: #16213e;
  border-radius: 8px;
  border: 1px solid #2a2a4e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fc-zone-appear 0.5s ease-out;
}

@keyframes fc-zone-appear {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fc-zone-header {
  padding: 12px 16px;
  border-bottom: 1px solid #2a2a4e;
  flex-shrink: 0;
}

.fc-zone-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.fc-zone-workdir .fc-zone-header h3 { color: #e8a838; }
.fc-zone-staging .fc-zone-header h3 { color: #3fb950; }
.fc-zone-repo .fc-zone-header h3 { color: #58a6ff; }

.fc-zone-subtitle {
  font-size: 11px;
  color: #6a6a8e;
  margin-top: 2px;
}

.fc-zone-body {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fc-zone-body::-webkit-scrollbar { width: 4px; }
.fc-zone-body::-webkit-scrollbar-track { background: transparent; }
.fc-zone-body::-webkit-scrollbar-thumb { background: #2a2a4e; border-radius: 2px; }

/* ── Staging zone drop target ─────────────────────────── */

.fc-zone-staging.fc-drag-over {
  border-color: #3fb950;
  background: #16213e;
  box-shadow: inset 0 0 20px rgba(63, 185, 80, 0.1);
}

.fc-zone-staging .fc-zone-body {
  border: 2px dashed #2a2a4e;
  border-radius: 6px;
  margin: 8px;
  padding: 8px;
  transition: border-color 0.2s;
}

.fc-zone-staging.fc-drag-over .fc-zone-body {
  border-color: #3fb950;
}

/* ── File Cards ───────────────────────────────────────── */

.fc-file-card {
  background: #1a1a36;
  border: 1px solid #2a2a4e;
  border-left: 3px solid #8b949e;
  border-radius: 6px;
  padding: 10px 12px;
  cursor: default;
  transition: border-color 0.2s, transform 0.15s;
}

.fc-file-card.fc-untracked { border-left-color: #8b949e; }
.fc-file-card.fc-modified { border-left-color: #e8a838; }
.fc-file-card.fc-staged { border-left-color: #3fb950; }
.fc-file-card.fc-committed { border-left-color: #58a6ff; }

.fc-file-card.fc-draggable {
  cursor: grab;
}

.fc-file-card.fc-draggable:active {
  cursor: grabbing;
}

.fc-file-card:hover {
  transform: translateY(-1px);
}

.fc-file-name {
  font-size: 13px;
  font-weight: 600;
  color: #e6e6e6;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fc-file-status {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(139, 148, 158, 0.15);
}

.fc-untracked .fc-file-status { color: #8b949e; }
.fc-modified .fc-file-status { color: #e8a838; background: rgba(232, 168, 56, 0.15); }
.fc-staged .fc-file-status { color: #3fb950; background: rgba(63, 185, 80, 0.15); }
.fc-committed .fc-file-status { color: #58a6ff; background: rgba(88, 166, 255, 0.15); }

.fc-file-preview {
  font-size: 11px;
  color: #6a6a8e;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 4px;
}

.fc-file-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.fc-file-btn {
  padding: 4px 10px;
  font-size: 11px;
  font-family: inherit;
  border: 1px solid #3a3a5e;
  background: transparent;
  color: #8b949e;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
}

.fc-file-btn:hover {
  border-color: #f0883e;
  color: #f0883e;
}

.fc-file-btn.fc-add-btn:hover {
  border-color: #3fb950;
  color: #3fb950;
}

.fc-file-btn.fc-unstage-btn:hover {
  border-color: #e8a838;
  color: #e8a838;
}

/* ── Commit Timeline ──────────────────────────────────── */

.fc-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}

.fc-commit-node {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 4px;
  padding: 8px;
}

.fc-commit-node:hover {
  background: rgba(240, 136, 62, 0.05);
}

.fc-commit-node.fc-active {
  background: rgba(240, 136, 62, 0.1);
}

.fc-commit-dot-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
  flex-shrink: 0;
}

.fc-commit-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #f0883e;
  border: 2px solid #1a1a2e;
  z-index: 1;
  flex-shrink: 0;
}

.fc-commit-dot.fc-branch-main { background: #58a6ff; }
.fc-commit-dot.fc-branch-secondary { background: #bc8cff; }

.fc-commit-line {
  width: 2px;
  flex: 1;
  background: #2a2a4e;
  min-height: 8px;
}

.fc-commit-info {
  flex: 1;
  min-width: 0;
}

.fc-commit-hash {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #f0883e;
}

.fc-commit-msg {
  font-size: 12px;
  color: #e6e6e6;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fc-commit-branch-tag {
  display: inline-block;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  margin-left: 6px;
  font-weight: 600;
}

.fc-branch-tag-main {
  background: rgba(88, 166, 255, 0.15);
  color: #58a6ff;
}

.fc-branch-tag-secondary {
  background: rgba(188, 140, 255, 0.15);
  color: #bc8cff;
}

/* ── Chapter 1: Story Editor ──────────────────────────── */

.fc-editor-wrap {
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  background: #16213e;
  border-radius: 8px;
  border: 1px solid #2a2a4e;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.fc-editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #12122a;
  border-bottom: 1px solid #2a2a4e;
  gap: 8px;
}

.fc-editor-filename {
  font-size: 13px;
  color: #8b949e;
  font-family: 'Courier New', monospace;
}

.fc-editor-textarea {
  flex: 1;
  width: 100%;
  padding: 16px;
  background: transparent;
  border: none;
  outline: none;
  color: #e6e6e6;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.7;
  resize: none;
}

.fc-editor-textarea::placeholder {
  color: #3a3a5e;
}

/* ── Buttons ──────────────────────────────────────────── */

.fc-btn {
  padding: 10px 20px;
  font-size: 14px;
  font-family: inherit;
  font-weight: 600;
  border: 1px solid #f0883e;
  background: transparent;
  color: #f0883e;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.fc-btn:hover {
  background: rgba(240, 136, 62, 0.1);
}

.fc-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.fc-btn.fc-btn-primary {
  background: #f0883e;
  color: #1a1a2e;
}

.fc-btn.fc-btn-primary .fc-cmd {
  color: #1a1a2e;
  background: rgba(0, 0, 0, 0.15);
}

.fc-btn.fc-btn-primary:hover {
  background: #e07a30;
}

.fc-btn.fc-btn-danger {
  border-color: #f85149;
  color: #f85149;
}

.fc-btn.fc-btn-danger:hover {
  background: rgba(248, 81, 73, 0.1);
}

.fc-btn.fc-btn-success {
  border-color: #3fb950;
  color: #3fb950;
}

.fc-btn.fc-btn-success:hover {
  background: rgba(63, 185, 80, 0.1);
}

.fc-btn-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  padding: 12px 0;
}

/* ── Command prompt (visual git commands) ─────────────── */

.fc-cmd {
  display: inline-block;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  background: rgba(240, 136, 62, 0.1);
  color: #f0883e;
  padding: 2px 8px;
  border-radius: 3px;
}

/* ── Text input ───────────────────────────────────────── */

.fc-input {
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
  background: #12122a;
  border: 1px solid #3a3a5e;
  color: #e6e6e6;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s;
}

.fc-input:focus {
  border-color: #f0883e;
}

.fc-input::placeholder {
  color: #3a3a5e;
}

/* ── Celebration ──────────────────────────────────────── */

.fc-celebration {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 46, 0.95);
  z-index: 20;
  animation: fc-fade-in 0.5s ease-out;
  gap: 16px;
}

.fc-celebration h2 {
  font-size: 28px;
  color: #f0883e;
  margin: 0;
}

.fc-celebration p {
  font-size: 16px;
  color: #8b949e;
  max-width: 500px;
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

/* ── Status / hint text ───────────────────────────────── */

.fc-hint {
  font-size: 13px;
  color: #6a6a8e;
  text-align: center;
  padding: 8px;
  font-style: italic;
}

.fc-status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 16px;
  background: #12122a;
  border-top: 1px solid #2a2a4e;
  font-size: 12px;
  color: #6a6a8e;
  flex-shrink: 0;
}

.fc-empty-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #3a3a5e;
  font-size: 13px;
  font-style: italic;
}

/* ── Branch selector ──────────────────────────────────── */

.fc-branch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #12122a;
  border-bottom: 1px solid #2a2a4e;
  flex-shrink: 0;
}

.fc-branch-label {
  font-size: 12px;
  color: #6a6a8e;
}

.fc-branch-name {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #58a6ff;
  font-weight: 600;
}

.fc-branch-btn {
  padding: 3px 10px;
  font-size: 11px;
  font-family: inherit;
  border: 1px solid #3a3a5e;
  background: transparent;
  color: #8b949e;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
}

.fc-branch-btn:hover {
  border-color: #bc8cff;
  color: #bc8cff;
}

.fc-branch-btn.fc-active-branch {
  border-color: #58a6ff;
  color: #58a6ff;
  background: rgba(88, 166, 255, 0.1);
}

/* ── Merge visualization ──────────────────────────────── */

.fc-merge-commit .fc-commit-dot {
  width: 16px;
  height: 16px;
  background: #3fb950;
}

/* ── Animations ───────────────────────────────────────── */

@keyframes fc-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fc-slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fc-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(240, 136, 62, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(240, 136, 62, 0); }
}

.fc-pulse {
  animation: fc-pulse 2s infinite;
}

/* Particle celebration effect */
@keyframes fc-confetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(-200px) rotate(720deg); opacity: 0; }
}

.fc-confetti-particle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: fc-confetti 1.5s ease-out forwards;
  pointer-events: none;
}

/* ── Viewing snapshot overlay ─────────────────────────── */

.fc-snapshot-label {
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: #f0883e;
  background: rgba(240, 136, 62, 0.1);
  padding: 4px 10px;
  border-radius: 4px;
  text-align: center;
  margin-bottom: 8px;
}

/* ── Completion screen ────────────────────────────────── */

.fc-complete {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex: 1;
  animation: fc-slide-up 0.6s ease-out;
}

.fc-complete h2 {
  font-size: 32px;
  color: #3fb950;
  margin: 0;
}

.fc-complete p {
  font-size: 16px;
  color: #8b949e;
  max-width: 500px;
  text-align: center;
  line-height: 1.7;
  margin: 0;
}

.fc-complete .fc-skills {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.fc-skill-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(240, 136, 62, 0.1);
  color: #f0883e;
  border: 1px solid rgba(240, 136, 62, 0.3);
}
`;

let injected = false;

export function injectStyles(): void {
  if (injected) return;
  const style = document.createElement("style");
  style.setAttribute("data-first-commit", "");
  style.textContent = STYLES;
  document.head.appendChild(style);
  injected = true;
}
