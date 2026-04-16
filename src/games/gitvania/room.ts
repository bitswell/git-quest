/** Room model — a commit in the graph, a room in the world. */

export type RoomType =
  | "init"
  | "staging"
  | "commit"
  | "branch"
  | "checkout"
  | "merge";

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Door {
  /** Room ID this door leads to */
  targetId: string;
  /** Position of the door in the room */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Label shown above the door */
  label: string;
  /** Is this door currently passable? */
  open: boolean;
  /** Direction hint: "left" or "right" */
  side: "left" | "right";
}

export interface Interactable {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  staged: boolean;
}

export interface Room {
  id: string;
  hash: string;
  type: RoomType;
  title: string;
  platforms: Platform[];
  doors: Door[];
  interactables: Interactable[];
  tutorialText: string[];
  /** Branch this room belongs to */
  branch: string;
  /** Width/height of the room in pixels */
  width: number;
  height: number;
}

export function createRoom(partial: Partial<Room> & Pick<Room, "id" | "hash" | "type" | "title" | "branch">): Room {
  return {
    width: 960,
    height: 640,
    platforms: [],
    doors: [],
    interactables: [],
    tutorialText: [],
    ...partial,
  };
}
