/**
 * Abilities — git commands as metroidvania power-ups.
 * Each ability is unlocked by reaching a specific room.
 * Once unlocked, the player can use it anywhere.
 */

export type AbilityId = "git-add" | "git-commit" | "git-branch" | "git-checkout" | "git-merge";

export interface Ability {
  id: AbilityId;
  name: string;
  key: string;
  description: string;
  /** Room ID where this ability is unlocked */
  unlockedIn: string;
}

export const ABILITIES: Record<AbilityId, Ability> = {
  "git-add": {
    id: "git-add",
    name: "git add",
    key: "E",
    description: "Stage objects near you",
    unlockedIn: "staging",
  },
  "git-commit": {
    id: "git-commit",
    name: "git commit",
    key: "Enter",
    description: "Commit staged changes",
    unlockedIn: "first-commit",
  },
  "git-branch": {
    id: "git-branch",
    name: "git branch",
    key: "B",
    description: "Create a new branch",
    unlockedIn: "branch-point",
  },
  "git-checkout": {
    id: "git-checkout",
    name: "git checkout",
    key: "C",
    description: "Switch to another branch",
    unlockedIn: "branch-point",
  },
  "git-merge": {
    id: "git-merge",
    name: "git merge",
    key: "M",
    description: "Merge branches together",
    unlockedIn: "merge-zone",
  },
};

export class AbilityTracker {
  unlocked = new Set<AbilityId>();

  unlock(id: AbilityId): boolean {
    if (this.unlocked.has(id)) return false;
    this.unlocked.add(id);
    return true;
  }

  has(id: AbilityId): boolean {
    return this.unlocked.has(id);
  }

  /** Check if entering a room should unlock abilities */
  checkRoomUnlocks(roomId: string): AbilityId[] {
    const newlyUnlocked: AbilityId[] = [];
    for (const ability of Object.values(ABILITIES)) {
      if (ability.unlockedIn === roomId && this.unlock(ability.id)) {
        newlyUnlocked.push(ability.id);
      }
    }
    return newlyUnlocked;
  }

  /** Get all unlocked abilities in display order */
  list(): Ability[] {
    const order: AbilityId[] = ["git-add", "git-commit", "git-branch", "git-checkout", "git-merge"];
    return order.filter((id) => this.unlocked.has(id)).map((id) => ABILITIES[id]);
  }
}
