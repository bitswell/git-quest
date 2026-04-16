/**
 * Level data — 7 hand-authored rooms forming the git teaching sequence.
 *
 * Room layout:
 *   [init] --> [staging] --> [first-commit] --> [branch-point]
 *                                                  |         \
 *                                           [main-cont]   [feature-a]
 *                                                  \         /
 *                                                [merge-zone]
 */

import { Room, createRoom } from "./room";
import { CommitGraph } from "./graph";

const W = 960;
const H = 640;
const FLOOR = H - 48;

export function buildWorld(): { graph: CommitGraph; startRoom: Room } {
  const graph = new CommitGraph();

  // -- Room 1: init --
  const init = createRoom({
    id: "init",
    hash: "a1b2c3d",
    type: "init",
    title: "Initial Commit",
    branch: "main",
    tutorialText: [
      "Welcome to GitVania.",
      "You're standing inside a commit — a snapshot of your project.",
      "Each room is a commit. Doors lead to other commits.",
      "Walk right to continue. Use WASD or arrow keys to move, SPACE to jump.",
    ],
    platforms: [
      { x: 200, y: FLOOR - 80, w: 160, h: 16 },
      { x: 500, y: FLOOR - 140, w: 160, h: 16 },
    ],
    doors: [
      {
        targetId: "staging",
        x: W - 40,
        y: FLOOR - 56,
        w: 32,
        h: 56,
        label: "staging area",
        open: true,
        side: "right",
      },
    ],
  });

  // -- Room 2: staging --
  const staging = createRoom({
    id: "staging",
    hash: "e4f5a6b",
    type: "staging",
    title: "The Staging Area",
    branch: "main",
    tutorialText: [
      "This is the staging area.",
      "Before you can commit, you need to stage your changes.",
      "Walk near the glowing objects and press E to stage them (git add).",
      "Stage all objects to open the door forward.",
    ],
    platforms: [
      { x: 120, y: FLOOR - 100, w: 140, h: 16 },
      { x: 400, y: FLOOR - 80, w: 120, h: 16 },
      { x: 640, y: FLOOR - 120, w: 160, h: 16 },
    ],
    interactables: [
      { id: "file-a", x: 160, y: FLOOR - 100 - 24, w: 20, h: 20, label: "index.html", staged: false },
      { id: "file-b", x: 430, y: FLOOR - 80 - 24, w: 20, h: 20, label: "style.css", staged: false },
      { id: "file-c", x: 700, y: FLOOR - 120 - 24, w: 20, h: 20, label: "app.js", staged: false },
    ],
    doors: [
      {
        targetId: "init",
        x: 8,
        y: FLOOR - 56,
        w: 32,
        h: 56,
        label: "back",
        open: true,
        side: "left",
      },
      {
        targetId: "first-commit",
        x: W - 40,
        y: FLOOR - 56,
        w: 32,
        h: 56,
        label: "commit",
        open: false, // opens when all items staged + commit
        side: "right",
      },
    ],
  });

  // -- Room 3: first-commit --
  const firstCommit = createRoom({
    id: "first-commit",
    hash: "c7d8e9f",
    type: "commit",
    title: "First Real Commit",
    branch: "main",
    tutorialText: [
      "You made your first commit!",
      "A commit saves your staged changes as a permanent snapshot.",
      "The commit hash (c7d8e9f) identifies it uniquely.",
      "Continue right to learn about branches.",
    ],
    platforms: [
      { x: 180, y: FLOOR - 120, w: 200, h: 16 },
      { x: 560, y: FLOOR - 90, w: 180, h: 16 },
    ],
    doors: [
      {
        targetId: "staging",
        x: 8,
        y: FLOOR - 56,
        w: 32,
        h: 56,
        label: "back",
        open: true,
        side: "left",
      },
      {
        targetId: "branch-point",
        x: W - 40,
        y: FLOOR - 56,
        w: 32,
        h: 56,
        label: "branch point",
        open: true,
        side: "right",
      },
    ],
  });

  // -- Room 4: branch-point --
  const branchPoint = createRoom({
    id: "branch-point",
    hash: "f0a1b2c",
    type: "branch",
    title: "Branch Point",
    branch: "main",
    tutorialText: [
      "This is a branch point — the path forks here.",
      "Right now, only the MAIN path is open.",
      "Press B near the upper door to create a new branch (git branch).",
      "Press C to open the branch selector (git checkout).",
      "Explore BOTH branches, then find the merge zone.",
    ],
    platforms: [
      { x: 300, y: FLOOR - 100, w: 360, h: 16 },
      { x: 580, y: FLOOR - 200, w: 160, h: 16 },
    ],
    doors: [
      {
        targetId: "first-commit",
        x: 8,
        y: FLOOR - 56,
        w: 32,
        h: 56,
        label: "back",
        open: true,
        side: "left",
      },
      {
        targetId: "main-continues",
        x: W - 40,
        y: FLOOR - 56,
        w: 32,
        h: 56,
        label: "main",
        open: true,
        side: "right",
      },
      {
        targetId: "feature-a",
        x: 620,
        y: FLOOR - 200 - 56,
        w: 32,
        h: 56,
        label: "feature",
        open: false, // opens when player creates the branch
        side: "right",
      },
    ],
  });

  // -- Room 5: feature-a (on branch "feature") --
  const featureA = createRoom({
    id: "feature-a",
    hash: "d3e4f5a",
    type: "checkout",
    title: "Feature Branch",
    branch: "feature",
    tutorialText: [
      "You're on the 'feature' branch now.",
      "Notice the branch name changed in the HUD.",
      "This room has a KEY ITEM. Collect it!",
      "You'll need items from BOTH branches to open the merge door.",
      "Press C to checkout back to main when you're done.",
    ],
    platforms: [
      { x: 140, y: FLOOR - 120, w: 200, h: 16 },
      { x: 500, y: FLOOR - 80, w: 180, h: 16 },
      { x: 300, y: FLOOR - 200, w: 160, h: 16 },
    ],
    interactables: [
      { id: "key-feature", x: 360, y: FLOOR - 200 - 24, w: 24, h: 24, label: "feature-key", staged: false },
    ],
    doors: [
      {
        targetId: "branch-point",
        x: 8,
        y: FLOOR - 56,
        w: 32,
        h: 56,
        label: "branch-point",
        open: true,
        side: "left",
      },
    ],
  });

  // -- Room 6: main-continues (on branch "main") --
  const mainContinues = createRoom({
    id: "main-continues",
    hash: "b6c7d8e",
    type: "commit",
    title: "Main Continues",
    branch: "main",
    tutorialText: [
      "Meanwhile on main...",
      "Work continues on the main branch while 'feature' diverges.",
      "Grab the KEY ITEM here too.",
      "Once you have both keys, find the merge zone.",
    ],
    platforms: [
      { x: 200, y: FLOOR - 90, w: 180, h: 16 },
      { x: 520, y: FLOOR - 160, w: 200, h: 16 },
    ],
    interactables: [
      { id: "key-main", x: 580, y: FLOOR - 160 - 24, w: 24, h: 24, label: "main-key", staged: false },
    ],
    doors: [
      {
        targetId: "branch-point",
        x: 8,
        y: FLOOR - 56,
        w: 32,
        h: 56,
        label: "branch-point",
        open: true,
        side: "left",
      },
      {
        targetId: "merge-zone",
        x: W - 40,
        y: FLOOR - 56,
        w: 32,
        h: 56,
        label: "merge",
        open: false, // opens when both keys collected
        side: "right",
      },
    ],
  });

  // -- Room 7: merge-zone --
  const mergeZone = createRoom({
    id: "merge-zone",
    hash: "9f0a1b2",
    type: "merge",
    title: "The Merge Zone",
    branch: "main",
    tutorialText: [
      "This is a merge commit!",
      "It combines the work from both branches into one.",
      "The two key items you collected represent changes from each branch.",
      "In real git, 'git merge feature' brings feature's changes into main.",
      "Congratulations — you've learned the fundamentals of git!",
    ],
    platforms: [
      { x: 200, y: FLOOR - 100, w: 560, h: 16 },
      { x: 350, y: FLOOR - 200, w: 260, h: 16 },
    ],
    doors: [
      {
        targetId: "main-continues",
        x: 8,
        y: FLOOR - 56,
        w: 32,
        h: 56,
        label: "back",
        open: true,
        side: "left",
      },
    ],
  });

  // Build the graph
  graph.addRoom(init);
  graph.addRoom(staging, ["init"]);
  graph.addRoom(firstCommit, ["staging"]);
  graph.addRoom(branchPoint, ["first-commit"]);
  graph.addRoom(featureA, ["branch-point"]);
  graph.addRoom(mainContinues, ["branch-point"]);
  graph.addRoom(mergeZone, ["main-continues", "feature-a"]);

  // Set up branches
  graph.setBranch("main", "main-continues");
  // "feature" branch is created dynamically when the player uses git-branch

  graph.head = { type: "branch", name: "main" };

  return { graph, startRoom: init };
}
