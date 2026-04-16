/** Scoped CSS injection for the Git Detective noir aesthetic */

const STYLES = `
/* ── Git Detective — Noir Terminal ────────────────────── */

.detective-root {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 300px 1fr 280px;
  grid-template-rows: 1fr;
  gap: 0;
  font-family: 'Courier New', 'Consolas', 'Liberation Mono', monospace;
  background: #0a0a0a;
  color: #c8b87a;
  overflow: hidden;
  position: relative;
}

/* Scan-line overlay */
.detective-root::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
  z-index: 10;
}

/* ── Case Briefing Panel ─────────────────────────────── */

.detective-briefing {
  background: #0d0d0d;
  border-right: 1px solid #2a2218;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detective-briefing h2 {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #d4a44a;
  border-bottom: 1px solid #2a2218;
  padding-bottom: 8px;
  margin: 0;
}

.detective-briefing .case-title {
  font-size: 18px;
  color: #e8d48a;
  margin: 0;
}

.detective-briefing .case-subtitle {
  font-size: 11px;
  color: #6a6245;
  margin: 0;
  font-style: italic;
}

.detective-briefing .case-text {
  font-size: 12px;
  line-height: 1.6;
  color: #9a8a5a;
}

.detective-briefing .objectives {
  list-style: none;
  padding: 0;
  margin: 0;
}

.detective-briefing .objectives li {
  font-size: 12px;
  color: #7a7a5a;
  padding: 4px 0;
  padding-left: 18px;
  position: relative;
}

.detective-briefing .objectives li::before {
  content: '\\25a1';
  position: absolute;
  left: 0;
  color: #4a4a3a;
}

.detective-briefing .objectives li.done::before {
  content: '\\25a0';
  color: #58a65a;
}

/* ── Terminal Panel ──────────────────────────────────── */

.detective-terminal {
  background: #0a0a0a;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid #1a1810;
  border-right: 1px solid #1a1810;
}

.detective-terminal-output {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.detective-terminal-output::-webkit-scrollbar {
  width: 6px;
}

.detective-terminal-output::-webkit-scrollbar-track {
  background: #0a0a0a;
}

.detective-terminal-output::-webkit-scrollbar-thumb {
  background: #2a2218;
  border-radius: 3px;
}

.detective-terminal-input-row {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-top: 1px solid #1a1810;
  background: #080808;
  gap: 8px;
  flex-shrink: 0;
}

.detective-prompt {
  color: #58a65a;
  font-size: 13px;
  white-space: nowrap;
  user-select: none;
}

.detective-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #c8b87a;
  font-family: inherit;
  font-size: 13px;
  caret-color: #d4a44a;
}

.detective-input::placeholder {
  color: #3a3a2a;
}

/* Terminal output styling */
.term-prompt-echo { color: #58a65a; }
.term-hash { color: #d4a44a; }
.term-author { color: #58a6ff; }
.term-date { color: #6a6a5a; }
.term-message { color: #c8c8a8; }
.term-add { color: #3fb950; }
.term-del { color: #f85149; }
.term-hunk { color: #58a6ff; }
.term-file { color: #d4a44a; }
.term-info { color: #58a6ff; }
.term-error { color: #f85149; }
.term-clue { color: #d4a44a; font-style: italic; }
.term-success { color: #3fb950; font-weight: bold; }
.term-muted { color: #4a4a3a; }
.term-bold { font-weight: bold; }
.term-blame-hash { color: #d4a44a; display: inline-block; min-width: 60px; }
.term-blame-author { color: #58a6ff; display: inline-block; min-width: 100px; }
.term-blame-line { color: #4a4a3a; display: inline-block; min-width: 30px; text-align: right; margin-right: 8px; }

/* Welcome / intro text */
.term-welcome { color: #6a6a4a; }
.term-welcome strong { color: #d4a44a; }

/* ── Evidence Board Panel ────────────────────────────── */

.detective-evidence {
  background: #0f0e0a;
  border-left: 1px solid #2a2218;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detective-evidence h2 {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #d4a44a;
  border-bottom: 1px solid #2a2218;
  padding-bottom: 8px;
  margin: 0;
}

.detective-evidence .evidence-empty {
  font-size: 12px;
  color: #3a3a2a;
  font-style: italic;
}

.evidence-card {
  background: #141210;
  border: 1px solid #2a2218;
  border-left: 3px solid #d4a44a;
  padding: 10px 12px;
  font-size: 12px;
  animation: evidence-appear 0.3s ease-out;
}

.evidence-card h3 {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #e8d48a;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.evidence-card p {
  margin: 0;
  color: #9a8a5a;
  line-height: 1.5;
}

@keyframes evidence-appear {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Evidence count badge */
.evidence-count {
  font-size: 11px;
  color: #6a6245;
  margin-top: -4px;
}

/* ── Case Select Screen ──────────────────────────────── */

.detective-case-select {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  background: #0a0a0a;
  font-family: 'Courier New', 'Consolas', 'Liberation Mono', monospace;
  color: #c8b87a;
}

.detective-case-select h1 {
  font-size: 28px;
  color: #d4a44a;
  text-transform: uppercase;
  letter-spacing: 4px;
  margin: 0;
}

.detective-case-select .subtitle {
  font-size: 12px;
  color: #6a6245;
  margin-top: -16px;
  font-style: italic;
}

.case-select-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 400px;
  max-width: 90%;
}

.case-select-card {
  background: #0f0e0a;
  border: 1px solid #2a2218;
  border-left: 3px solid #d4a44a;
  padding: 16px 20px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.case-select-card:hover {
  border-color: #d4a44a;
  background: #141210;
}

.case-select-card h2 {
  margin: 0;
  font-size: 16px;
  color: #e8d48a;
}

.case-select-card .case-num {
  font-size: 11px;
  color: #4a4a3a;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.case-select-card p {
  margin: 6px 0 0;
  font-size: 12px;
  color: #7a7a5a;
  line-height: 1.5;
}

/* ── Solved overlay ──────────────────────────────────── */

.detective-solved-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 10, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 20;
  animation: fade-in 0.5s ease-out;
}

.detective-solved-overlay h2 {
  font-size: 24px;
  color: #3fb950;
  text-transform: uppercase;
  letter-spacing: 3px;
}

.detective-solved-overlay p {
  max-width: 500px;
  text-align: center;
  font-size: 14px;
  color: #9a8a5a;
  line-height: 1.6;
}

.detective-solved-overlay button {
  margin-top: 12px;
  padding: 10px 24px;
  background: transparent;
  border: 1px solid #d4a44a;
  color: #d4a44a;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: background 0.2s;
}

.detective-solved-overlay button:hover {
  background: #1a1810;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

let injected = false;

export function injectStyles(): void {
  if (injected) return;
  const style = document.createElement("style");
  style.setAttribute("data-detective", "");
  style.textContent = STYLES;
  document.head.appendChild(style);
  injected = true;
}
