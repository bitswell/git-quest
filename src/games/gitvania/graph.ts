/**
 * CommitGraph — the game world IS this graph.
 * Rooms are nodes. Parent-child edges are corridors.
 * Branch refs point to room IDs, exactly like real git.
 */

import { Room } from "./room";

export interface GraphNode {
  room: Room;
  parents: string[];
  children: string[];
}

export interface BranchRef {
  name: string;
  /** Room ID this branch points to (its tip) */
  tipId: string;
}

export class CommitGraph {
  nodes = new Map<string, GraphNode>();
  branches = new Map<string, BranchRef>();
  head: { type: "branch"; name: string } | { type: "detached"; roomId: string } = {
    type: "branch",
    name: "main",
  };

  addRoom(room: Room, parentIds: string[] = []): void {
    const node: GraphNode = {
      room,
      parents: parentIds,
      children: [],
    };
    this.nodes.set(room.id, node);

    for (const pid of parentIds) {
      const parent = this.nodes.get(pid);
      if (parent) parent.children.push(room.id);
    }
  }

  setBranch(name: string, tipId: string): void {
    this.branches.set(name, { name, tipId });
  }

  getBranch(name: string): BranchRef | undefined {
    return this.branches.get(name);
  }

  getRoom(id: string): Room | undefined {
    return this.nodes.get(id)?.room;
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  /** Get the room ID that HEAD currently points to */
  headRoomId(): string {
    if (this.head.type === "branch") {
      const branch = this.branches.get(this.head.name);
      return branch ? branch.tipId : "";
    }
    return this.head.roomId;
  }

  /** Current branch name or "(detached)" */
  currentBranchName(): string {
    return this.head.type === "branch" ? this.head.name : "(detached)";
  }

  /** Checkout a branch — HEAD moves to that branch's tip */
  checkout(branchName: string): Room | undefined {
    const branch = this.branches.get(branchName);
    if (!branch) return undefined;
    this.head = { type: "branch", name: branchName };
    return this.getRoom(branch.tipId);
  }

  /** List all branch names */
  branchNames(): string[] {
    return Array.from(this.branches.keys());
  }

  /** Get all rooms in topological order (parents before children) */
  topoOrder(): GraphNode[] {
    const visited = new Set<string>();
    const result: GraphNode[] = [];

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const node = this.nodes.get(id);
      if (!node) return;
      for (const pid of node.parents) visit(pid);
      result.push(node);
    };

    for (const id of this.nodes.keys()) visit(id);
    return result;
  }

  /** Get all rooms that a branch can reach (walk from tip back through parents) */
  reachableFrom(roomId: string): Set<string> {
    const reached = new Set<string>();
    const stack = [roomId];
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (reached.has(id)) continue;
      reached.add(id);
      const node = this.nodes.get(id);
      if (node) {
        for (const pid of node.parents) stack.push(pid);
      }
    }
    return reached;
  }
}
