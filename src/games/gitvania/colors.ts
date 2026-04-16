/** GitVania color palette — matches the landing page dark theme + neon accents. */

export const C = {
  // Base
  bg: "#0d1117",
  surface: "#161b22",
  border: "#30363d",
  text: "#e6edf3",
  muted: "#8b949e",

  // Accents
  blue: "#58a6ff",
  purple: "#bc8cff",
  pink: "#f778ba",
  green: "#3fb950",
  orange: "#d29922",
  red: "#f85149",
  cyan: "#39d353",

  // Room-type accents
  init: "#58a6ff",
  staging: "#d29922",
  commit: "#3fb950",
  branch: "#bc8cff",
  checkout: "#f778ba",
  merge: "#39d353",

  // Player
  playerBody: "#e6edf3",
  playerOutline: "#58a6ff",

  // Platforms
  platform: "#30363d",
  platformTop: "#484f58",

  // Doors
  doorFrame: "#484f58",
  doorOpen: "#1f6feb",
  doorLocked: "#8b949e",

  // HUD
  hudBg: "rgba(13, 17, 23, 0.85)",
  hudBorder: "rgba(48, 54, 61, 0.6)",

  // Minimap
  minimapBg: "rgba(22, 27, 34, 0.9)",
  minimapEdge: "#484f58",
  minimapNode: "#58a6ff",
  minimapCurrent: "#f778ba",
} as const;
