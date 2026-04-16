// ── Rebase Racer — obstacle definitions and spawn logic ─────────

import type { Obstacle, ObstacleKind, ObstacleType, Phase } from "./types";

// ── Obstacle type catalogue ─────────────────────────────────────

const OBSTACLE_TYPES: Record<ObstacleKind, ObstacleType> = {
  fork: {
    kind: "fork",
    displayName: "Fork",
    hint: "Try: git branch <name>",
    points: 100,
    baseTimer: 8,
    acceptedCommands: [/^git\s+branch\s+\S+$/i],
    color: "#3fb950",
    minPhase: 1,
  },
  "dead-end": {
    kind: "dead-end",
    displayName: "Dead End",
    hint: "Try: git checkout <branch>",
    points: 100,
    baseTimer: 8,
    acceptedCommands: [
      /^git\s+checkout\s+\S+$/i,
      /^git\s+switch\s+\S+$/i,
    ],
    color: "#f85149",
    minPhase: 1,
  },
  tangle: {
    kind: "tangle",
    displayName: "Tangle",
    hint: "Try: git rebase <branch>",
    points: 200,
    baseTimer: 6,
    acceptedCommands: [/^git\s+rebase\s+\S+$/i, /^git\s+rebase$/i],
    color: "#d29922",
    minPhase: 2,
  },
  convergence: {
    kind: "convergence",
    displayName: "Convergence",
    hint: "Try: git merge <branch>",
    points: 200,
    baseTimer: 6,
    acceptedCommands: [/^git\s+merge\s+\S+$/i],
    color: "#58a6ff",
    minPhase: 2,
  },
  clutter: {
    kind: "clutter",
    displayName: "Clutter",
    hint: "Try: git stash",
    points: 300,
    baseTimer: 4,
    acceptedCommands: [/^git\s+stash$/i, /^git\s+stash\s+push$/i],
    color: "#bc8cff",
    minPhase: 3,
  },
  "time-warp": {
    kind: "time-warp",
    displayName: "Time Warp",
    hint: "Try: git checkout <hash>",
    points: 300,
    baseTimer: 4,
    acceptedCommands: [
      /^git\s+checkout\s+[a-f0-9]+$/i,
      /^git\s+checkout\s+HEAD~\d*$/i,
    ],
    color: "#8b949e",
    minPhase: 3,
  },
};

// ── Public accessors ────────────────────────────────────────────

export function getObstacleType(kind: ObstacleKind): ObstacleType {
  return OBSTACLE_TYPES[kind];
}

export function allObstacleTypes(): ObstacleType[] {
  return Object.values(OBSTACLE_TYPES);
}

/** Return the pool of obstacle types available in the given phase. */
export function obstaclePool(phase: Phase): ObstacleType[] {
  return allObstacleTypes().filter((t) => t.minPhase <= phase);
}

// ── Spawn ───────────────────────────────────────────────────────

/** Timer multiplier per phase — makes timers shorter as difficulty rises. */
function timerMultiplier(phase: Phase): number {
  if (phase === 1) return 1.0;
  if (phase === 2) return 0.75;
  return 0.55;
}

let lastSpawnedKind: ObstacleKind | null = null;

/**
 * Pick a random obstacle from the current phase pool,
 * avoiding back-to-back duplicates.
 */
export function spawnObstacle(worldX: number, phase: Phase): Obstacle {
  const pool = obstaclePool(phase);
  let pick: ObstacleType;
  if (pool.length > 1) {
    const filtered = pool.filter((t) => t.kind !== lastSpawnedKind);
    pick = filtered[Math.floor(Math.random() * filtered.length)];
  } else {
    pick = pool[0];
  }
  lastSpawnedKind = pick.kind;

  return {
    type: pick,
    worldX,
    status: "approaching",
    timerRemaining: pick.baseTimer * timerMultiplier(phase),
    wrongAttempts: 0,
  };
}

/** Check if a typed command matches an obstacle's accepted patterns. */
export function checkCommand(obstacle: Obstacle, input: string): boolean {
  const trimmed = input.trim();
  return obstacle.type.acceptedCommands.some((re) => re.test(trimmed));
}

/** Reset the spawn dedup tracker (for new games). */
export function resetSpawnState(): void {
  lastSpawnedKind = null;
}
