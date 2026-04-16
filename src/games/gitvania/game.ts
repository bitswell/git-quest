/**
 * GameState — owns the world and drives the update/render loop.
 * Holds: graph, player, current room, abilities, HUD state.
 */

import { CommitGraph } from "./graph";
import { Room } from "./room";
import {
  PlayerState,
  createPlayer,
  updatePlayer,
  renderPlayer,
  playerAtDoor,
  playerNearInteractable,
} from "./player";
import { AbilityTracker } from "./abilities";
import {
  HudState,
  createHud,
  updateHud,
  renderHud,
  showNotification,
} from "./hud";
import { renderRoom } from "./renderer";
import { renderMinimap } from "./minimap";
import { buildWorld } from "./levels";
import { C } from "./colors";
import { InputManager } from "../../shared/input";

export interface GameState {
  graph: CommitGraph;
  currentRoom: Room;
  player: PlayerState;
  abilities: AbilityTracker;
  hud: HudState;
  /** Items collected across all rooms */
  inventory: Set<string>;
  /** Rooms the player has visited */
  visited: Set<string>;
  /** Transition effect */
  transition: { active: boolean; alpha: number; targetRoomId: string; direction: "in" | "out" };
  /** Total elapsed time (for animations) */
  time: number;
  /** "just pressed" tracking */
  prevKeys: Set<string>;
}

export function createGameState(): GameState {
  const { graph, startRoom } = buildWorld();
  const player = createPlayer(80, startRoom.height - 48 - 24);

  const hud = createHud();
  hud.branchName = graph.currentBranchName();
  hud.roomHash = startRoom.hash;
  hud.tutorialLines = startRoom.tutorialText;
  hud.showTutorial = true;

  return {
    graph,
    currentRoom: startRoom,
    player,
    abilities: new AbilityTracker(),
    hud,
    inventory: new Set(),
    visited: new Set(["init"]),
    transition: { active: false, alpha: 0, targetRoomId: "", direction: "out" },
    time: 0,
    prevKeys: new Set(),
  };
}

/** Returns true if a key was just pressed this frame */
function justPressed(input: InputManager, key: string, prev: Set<string>): boolean {
  const down = input.isDown(key);
  const wasPrev = prev.has(key);
  return down && !wasPrev;
}

/** Snapshot currently-held keys for next frame's justPressed detection */
function snapshotKeys(input: InputManager): Set<string> {
  const keys = new Set<string>();
  // Check all the keys we care about
  const watched = [
    "w", "a", "s", "d",
    "W", "A", "S", "D",
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    " ", "Enter", "e", "E", "b", "B", "c", "C", "m", "M",
    "Escape", "1", "2", "3",
  ];
  for (const k of watched) {
    if (input.isDown(k)) keys.add(k);
  }
  return keys;
}

export function updateGame(state: GameState, dt: number, input: InputManager): void {
  state.time += dt;
  updateHud(state.hud, dt);

  // Handle transition animation
  if (state.transition.active) {
    updateTransition(state, dt);
    state.prevKeys = snapshotKeys(input);
    return;
  }

  // Tutorial overlay blocks gameplay input
  if (state.hud.showTutorial) {
    // Any key dismisses (but wait a moment so the key that triggered entry doesn't dismiss)
    if (state.time > 0.3) {
      // Check if any key was just pressed
      const watched = [" ", "Enter", "e", "E", "w", "a", "s", "d", "Escape"];
      for (const k of watched) {
        if (justPressed(input, k, state.prevKeys)) {
          state.hud.showTutorial = false;
          state.hud.tutorialDismissed.add(state.currentRoom.id);

          // Check for ability unlocks on first visit
          const unlocked = state.abilities.checkRoomUnlocks(state.currentRoom.id);
          for (const id of unlocked) {
            showNotification(state.hud, `Ability unlocked: ${id}`, 3);
          }
          state.hud.abilities = state.abilities.list();
          break;
        }
      }
    }
    state.prevKeys = snapshotKeys(input);
    return;
  }

  // Branch selector overlay
  if (state.hud.showBranchSelector) {
    handleBranchSelector(state, input);
    state.prevKeys = snapshotKeys(input);
    return;
  }

  // Player movement
  const moveKeys = {
    left: input.isDown("a") || input.isDown("A") || input.isDown("ArrowLeft"),
    right: input.isDown("d") || input.isDown("D") || input.isDown("ArrowRight"),
    jump: justPressed(input, " ", state.prevKeys) || justPressed(input, "ArrowUp", state.prevKeys) || justPressed(input, "w", state.prevKeys) || justPressed(input, "W", state.prevKeys),
  };

  updatePlayer(state.player, dt, moveKeys, state.currentRoom.platforms, state.currentRoom.width, state.currentRoom.height);

  // Door interaction
  const door = playerAtDoor(state.player, state.currentRoom.doors);
  if (door && door.open) {
    // Auto-enter when overlapping an open door and pressing toward it
    const enteringRight = door.side === "right" && moveKeys.right;
    const enteringLeft = door.side === "left" && moveKeys.left;
    if (enteringRight || enteringLeft) {
      startTransition(state, door.targetId);
    }
  }

  // Ability: git add (E key)
  if (justPressed(input, "e", state.prevKeys) || justPressed(input, "E", state.prevKeys)) {
    if (state.abilities.has("git-add")) {
      const item = playerNearInteractable(state.player, state.currentRoom.interactables);
      if (item && !item.staged) {
        item.staged = true;
        showNotification(state.hud, `git add ${item.label}`, 2);
        checkStagingComplete(state);
      }
    }
  }

  // Ability: git commit (Enter)
  if (justPressed(input, "Enter", state.prevKeys)) {
    if (state.abilities.has("git-commit")) {
      handleCommit(state);
    }
  }

  // Ability: git branch (B key)
  if (justPressed(input, "b", state.prevKeys) || justPressed(input, "B", state.prevKeys)) {
    if (state.abilities.has("git-branch")) {
      handleBranch(state);
    }
  }

  // Ability: git checkout (C key)
  if (justPressed(input, "c", state.prevKeys) || justPressed(input, "C", state.prevKeys)) {
    if (state.abilities.has("git-checkout")) {
      openBranchSelector(state);
    }
  }

  // Collect key items (walk over them)
  for (const item of state.currentRoom.interactables) {
    if (item.id.startsWith("key-") && !state.inventory.has(item.id)) {
      const near = playerNearInteractable(state.player, [item]);
      if (near) {
        state.inventory.add(item.id);
        item.staged = true; // visual: mark as collected
        showNotification(state.hud, `Collected: ${item.label}`, 2.5);
        checkMergeDoor(state);
      }
    }
  }

  state.prevKeys = snapshotKeys(input);
}

function startTransition(state: GameState, targetRoomId: string): void {
  state.transition = { active: true, alpha: 0, targetRoomId, direction: "out" };
}

function updateTransition(state: GameState, dt: number): void {
  const t = state.transition;
  const speed = 4;

  if (t.direction === "out") {
    t.alpha += speed * dt;
    if (t.alpha >= 1) {
      t.alpha = 1;
      // Switch room
      const newRoom = state.graph.getRoom(t.targetRoomId);
      if (newRoom) {
        enterRoom(state, newRoom);
      }
      t.direction = "in";
    }
  } else {
    t.alpha -= speed * dt;
    if (t.alpha <= 0) {
      t.alpha = 0;
      t.active = false;
    }
  }
}

function enterRoom(state: GameState, room: Room): void {
  state.currentRoom = room;
  state.visited.add(room.id);

  // Position player at the appropriate side
  const prevRoom = state.transition.targetRoomId;
  const enterDoor = room.doors.find((d) => d.targetId === state.graph.getNode(prevRoom)?.room.id || false);

  if (enterDoor && enterDoor.side === "right") {
    // Came from the left, so we entered from left side
    state.player.x = 50;
  } else {
    state.player.x = room.width - 50 - state.player.w;
  }
  state.player.y = room.height - 48 - state.player.h;
  state.player.vy = 0;

  // Update HUD
  state.hud.branchName = room.branch === "feature" && state.graph.getBranch("feature")
    ? "feature"
    : state.graph.currentBranchName();
  state.hud.roomHash = room.hash;

  // Show tutorial if first visit
  if (!state.hud.tutorialDismissed.has(room.id) && room.tutorialText.length > 0) {
    state.hud.tutorialLines = room.tutorialText;
    state.hud.showTutorial = true;
  }
}

function checkStagingComplete(state: GameState): void {
  if (state.currentRoom.id !== "staging") return;
  const allStaged = state.currentRoom.interactables.every((i) => i.staged);
  if (allStaged) {
    showNotification(state.hud, "All files staged! Press Enter to commit.", 3);
  }
}

function handleCommit(state: GameState): void {
  if (state.currentRoom.id === "staging") {
    const allStaged = state.currentRoom.interactables.every((i) => i.staged);
    if (allStaged) {
      // Open the commit door
      const commitDoor = state.currentRoom.doors.find((d) => d.targetId === "first-commit");
      if (commitDoor) {
        commitDoor.open = true;
        showNotification(state.hud, "git commit -m 'initial commit' -- door opened!", 3);
      }
    } else {
      showNotification(state.hud, "Stage all files first (press E near each)", 2);
    }
  }
}

function handleBranch(state: GameState): void {
  if (state.currentRoom.id === "branch-point") {
    if (!state.graph.getBranch("feature")) {
      // Create the feature branch
      state.graph.setBranch("feature", "feature-a");
      showNotification(state.hud, "git branch feature -- new branch created!", 3);

      // Open the feature door
      const featureDoor = state.currentRoom.doors.find((d) => d.targetId === "feature-a");
      if (featureDoor) {
        featureDoor.open = true;
      }

      state.hud.abilities = state.abilities.list();
    } else {
      showNotification(state.hud, "Branch 'feature' already exists", 2);
    }
  } else {
    showNotification(state.hud, "Not at a branch point", 1.5);
  }
}

function openBranchSelector(state: GameState): void {
  const branches = state.graph.branchNames();
  if (branches.length < 2) {
    showNotification(state.hud, "No other branches to checkout", 1.5);
    return;
  }
  state.hud.showBranchSelector = true;
  state.hud.branchList = branches;
  state.hud.branchSelectIndex = branches.indexOf(state.hud.branchName);
  if (state.hud.branchSelectIndex < 0) state.hud.branchSelectIndex = 0;
}

function handleBranchSelector(state: GameState, input: InputManager): void {
  const hud = state.hud;

  if (justPressed(input, "ArrowUp", state.prevKeys) || justPressed(input, "w", state.prevKeys) || justPressed(input, "W", state.prevKeys)) {
    hud.branchSelectIndex = Math.max(0, hud.branchSelectIndex - 1);
  }
  if (justPressed(input, "ArrowDown", state.prevKeys) || justPressed(input, "s", state.prevKeys) || justPressed(input, "S", state.prevKeys)) {
    hud.branchSelectIndex = Math.min(hud.branchList.length - 1, hud.branchSelectIndex + 1);
  }
  if (justPressed(input, "Enter", state.prevKeys)) {
    const targetBranch = hud.branchList[hud.branchSelectIndex];
    if (targetBranch && targetBranch !== hud.branchName) {
      const room = state.graph.checkout(targetBranch);
      if (room) {
        hud.showBranchSelector = false;
        showNotification(state.hud, `git checkout ${targetBranch}`, 2);
        // Flash transition for checkout
        state.transition = { active: true, alpha: 0, targetRoomId: room.id, direction: "out" };
      }
    } else {
      hud.showBranchSelector = false;
    }
  }
  if (justPressed(input, "Escape", state.prevKeys) || justPressed(input, "c", state.prevKeys) || justPressed(input, "C", state.prevKeys)) {
    hud.showBranchSelector = false;
  }
}

function checkMergeDoor(state: GameState): void {
  // The merge door opens when both keys are collected
  if (state.inventory.has("key-feature") && state.inventory.has("key-main")) {
    // Find the merge door on main-continues
    const mainRoom = state.graph.getRoom("main-continues");
    if (mainRoom) {
      const mergeDoor = mainRoom.doors.find((d) => d.targetId === "merge-zone");
      if (mergeDoor && !mergeDoor.open) {
        mergeDoor.open = true;
        showNotification(state.hud, "Both keys collected! Merge door is open.", 3);
      }
    }
  }
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { currentRoom, player, hud } = state;
  const w = currentRoom.width;
  const h = currentRoom.height;

  // Clear
  ctx.clearRect(0, 0, w, h);

  // Room
  renderRoom(ctx, currentRoom, state.time);

  // Player (don't render during full fade)
  if (!state.transition.active || state.transition.alpha < 0.9) {
    renderPlayer(ctx, player);
  }

  // Minimap
  renderMinimap(ctx, state.graph, currentRoom.id, w);

  // HUD
  renderHud(ctx, hud, w, h);

  // Transition overlay
  if (state.transition.active) {
    ctx.fillStyle = C.bg;
    ctx.globalAlpha = state.transition.alpha;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1.0;
  }

  // Interaction prompts
  if (!hud.showTutorial && !hud.showBranchSelector) {
    renderPrompts(ctx, state);
  }
}

function renderPrompts(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { player, currentRoom, abilities } = state;

  // Door prompt
  const door = playerAtDoor(player, currentRoom.doors);
  if (door) {
    if (door.open) {
      drawPrompt(ctx, door.x + door.w / 2, door.y - 20, "walk to enter");
    } else {
      drawPrompt(ctx, door.x + door.w / 2, door.y - 20, "locked");
    }
  }

  // Interactable prompt
  if (abilities.has("git-add")) {
    const item = playerNearInteractable(player, currentRoom.interactables.filter((i) => !i.staged && !i.id.startsWith("key-")));
    if (item) {
      drawPrompt(ctx, item.x + item.w / 2, item.y - 20, "[E] git add");
    }
  }

  // Branch prompt at branch-point
  if (currentRoom.id === "branch-point" && abilities.has("git-branch")) {
    if (!state.graph.getBranch("feature")) {
      drawPrompt(ctx, 480, currentRoom.height - 48 - 70, "[B] git branch feature");
    }
  }

  // Checkout prompt
  if (abilities.has("git-checkout") && state.graph.branchNames().length > 1) {
    drawPrompt(ctx, 480, 70, "[C] git checkout");
  }
}

function drawPrompt(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  const tw = ctx.measureText(text).width;

  ctx.fillStyle = C.hudBg;
  ctx.fillRect(x - tw / 2 - 6, y - 10, tw + 12, 18);
  ctx.strokeStyle = C.hudBorder;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x - tw / 2 - 6, y - 10, tw + 12, 18);

  ctx.fillStyle = C.text;
  ctx.fillText(text, x, y + 3);
}
