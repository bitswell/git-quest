// All tuning values for Merge Conflict

// Canvas
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;

// Columns — two branches, left ("ours") and right ("theirs")
export const LEFT_COL_X = CANVAS_WIDTH * 0.25;
export const RIGHT_COL_X = CANVAS_WIDTH * 0.75;
export const COL_WIDTH = 280;

// Merge zone — horizontal band across the middle
export const MERGE_ZONE_TOP = 280;
export const MERGE_ZONE_BOTTOM = 360;
export const MERGE_ZONE_CENTER = (MERGE_ZONE_TOP + MERGE_ZONE_BOTTOM) / 2;

// Block dimensions
export const BLOCK_WIDTH = 260;
export const BLOCK_HEIGHT = 60;
export const BLOCK_RADIUS = 8;

// Physics
export const BASE_FALL_SPEED = 80; // pixels per second
export const SPEED_INCREMENT = 0.2; // multiplier per difficulty level

// Spawn timing (seconds between block pairs)
export const SPAWN_INTERVALS = [3.0, 2.5, 2.0, 1.5, 1.2];

// Difficulty thresholds (seconds of elapsed play time)
export const DIFFICULTY_THRESHOLDS = [0, 30, 60, 90, 120];
export const MAX_DIFFICULTY = 5;

// Scoring
export const BASE_SCORE = 100;
export const STREAK_BONUS = 0.1; // 10% per consecutive correct
export const MAX_STREAK_MULTIPLIER = 2.0;

// Health
export const MAX_HEALTH = 5;
export const WRONG_DAMAGE = 1;

// Animation
export const RESOLUTION_ANIM_DURATION = 0.5; // seconds
export const POST_RESOLUTION_DELAY = 0.8; // seconds before next spawn

// Colors
export const COLORS = {
  background: "#0d1117",
  accent: "#bc8cff",
  accentDim: "rgba(188, 140, 255, 0.3)",
  accentGlow: "rgba(188, 140, 255, 0.15)",
  leftBranch: "#3fb950",
  rightBranch: "#58a6ff",
  blockBg: "#161b22",
  blockBorder: "#30363d",
  text: "#e6edf3",
  textDim: "#8b949e",
  panelBg: "rgba(13, 17, 23, 0.95)",
  panelBorder: "#bc8cff",
  correct: "#3fb950",
  wrong: "#f85149",
  healthFull: "#bc8cff",
  healthEmpty: "#21262d",
  mergeZone: "rgba(188, 140, 255, 0.08)",
  mergeZoneLine: "rgba(188, 140, 255, 0.4)",
  overlay: "rgba(0, 0, 0, 0.6)",

  // Syntax-ish coloring
  keyword: "#d2a8ff",
  string: "#a5d6ff",
  number: "#ffa657",
  func: "#d2a8ff",
  type: "#ff7b72",
} as const;

// Font
export const CODE_FONT = '14px "Courier New", Courier, monospace';
export const UI_FONT = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
export const TITLE_FONT =
  'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
export const BIG_FONT =
  'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// HUD
export const HUD_PADDING = 20;
export const HEALTH_ICON_SIZE = 20;
export const HEALTH_ICON_GAP = 6;

// Conflict panel
export const PANEL_WIDTH = 700;
export const PANEL_HEIGHT = 340;
export const PANEL_PADDING = 24;
export const BUTTON_WIDTH = 140;
export const BUTTON_HEIGHT = 40;
export const BUTTON_GAP = 20;
