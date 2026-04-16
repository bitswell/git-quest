// Conflict scenarios — the core content of the game

export type Resolution = "LEFT" | "RIGHT" | "BOTH";

export interface ConflictScenario {
  id: number;
  leftCode: string;
  rightCode: string;
  leftLabel: string;
  rightLabel: string;
  correct: Resolution;
  explanation: string;
  /** Minimum difficulty level (1-5) for this scenario to appear */
  minDifficulty: number;
}

export const SCENARIOS: ConflictScenario[] = [
  {
    id: 1,
    leftCode: "const timeout = 3000;",
    rightCode: "const timeout = 5000;",
    leftLabel: "Lower timeout",
    rightLabel: "Higher timeout",
    correct: "RIGHT",
    explanation: "Higher timeout is a safer default — prevents premature failures.",
    minDifficulty: 1,
  },
  {
    id: 2,
    leftCode: "import { log } from './utils';",
    rightCode: "import { log } from './utils/logger';",
    leftLabel: "Barrel import",
    rightLabel: "Direct import",
    correct: "RIGHT",
    explanation: "More specific import path avoids barrel re-export issues.",
    minDifficulty: 1,
  },
  {
    id: 3,
    leftCode: "function greet(name: string) {",
    rightCode: "function greet(name: string, formal?: boolean) {",
    leftLabel: "One parameter",
    rightLabel: "Optional parameter added",
    correct: "RIGHT",
    explanation: "The optional parameter is backwards compatible and adds functionality.",
    minDifficulty: 1,
  },
  {
    id: 4,
    leftCode: "function getCount(): number {",
    rightCode: "function getCount(): number | null {",
    leftLabel: "Always returns number",
    rightLabel: "Nullable return",
    correct: "RIGHT",
    explanation: "Nullable return type handles missing data safely.",
    minDifficulty: 2,
  },
  {
    id: 5,
    leftCode: "let items = getItem();",
    rightCode: "let items = getItems();",
    leftLabel: "Singular getter",
    rightLabel: "Plural getter",
    correct: "RIGHT",
    explanation: "Variable name is plural — the getter should return a collection.",
    minDifficulty: 1,
  },
  {
    id: 6,
    leftCode: "console.log(error);",
    rightCode: "reportError(error);",
    leftLabel: "Log to console",
    rightLabel: "Report to service",
    correct: "BOTH",
    explanation: "Keep both — log locally AND report to the error tracking service.",
    minDifficulty: 2,
  },
  {
    id: 7,
    leftCode: "showBanner();",
    rightCode: "if (flags.banner) showBanner();",
    leftLabel: "Always show",
    rightLabel: "Feature-flagged",
    correct: "RIGHT",
    explanation: "Feature flag was added intentionally for controlled rollout.",
    minDifficulty: 2,
  },
  {
    id: 8,
    leftCode: 'class="btn primary"',
    rightCode: 'class="btn btn-primary"',
    leftLabel: "Loose class names",
    rightLabel: "BEM-style names",
    correct: "RIGHT",
    explanation: "BEM naming convention is more specific and maintainable.",
    minDifficulty: 1,
  },
  {
    id: 9,
    leftCode: "return user.name;",
    rightCode: "return user?.name ?? 'Anonymous';",
    leftLabel: "Direct access",
    rightLabel: "Null-safe access",
    correct: "RIGHT",
    explanation: "Optional chaining and nullish coalescing prevent runtime errors.",
    minDifficulty: 3,
  },
  {
    id: 10,
    leftCode: "expect(add(1,2)).toBe(3);",
    rightCode: "function add(a, b) { return a+b; }",
    leftLabel: "Test assertion",
    rightLabel: "Implementation",
    correct: "BOTH",
    explanation: "Both the test and the implementation are needed.",
    minDifficulty: 3,
  },
  {
    id: 11,
    leftCode: 'port: "8080"',
    rightCode: "port: 8080",
    leftLabel: "String value",
    rightLabel: "Number value",
    correct: "RIGHT",
    explanation: "Port should be a number, not a string — avoids type coercion bugs.",
    minDifficulty: 2,
  },
  {
    id: 12,
    leftCode: "const data = fetchData();",
    rightCode: "const data = await fetchData();",
    leftLabel: "Missing await",
    rightLabel: "Awaited call",
    correct: "RIGHT",
    explanation: "Async function must be awaited — otherwise data is a Promise, not the result.",
    minDifficulty: 3,
  },
];

/** Pick a random scenario appropriate for the current difficulty level */
export function pickScenario(
  difficulty: number,
  recentIds: number[]
): ConflictScenario {
  const eligible = SCENARIOS.filter(
    (s) => s.minDifficulty <= difficulty && !recentIds.includes(s.id)
  );
  // Fallback to all eligible if we've exhausted non-recent ones
  const pool = eligible.length > 0 ? eligible : SCENARIOS.filter((s) => s.minDifficulty <= difficulty);
  return pool[Math.floor(Math.random() * pool.length)];
}
