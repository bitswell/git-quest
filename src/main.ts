interface GameEntry {
  id: string;
  title: string;
  genre: string;
  description: string;
  color: string;
}

const GAMES: GameEntry[] = [
  {
    id: "first-commit",
    title: "First Commit",
    genre: "Interactive Tutorial",
    description:
      "Learn git from scratch. Create files, stage changes, make commits, branch, and merge — all visually.",
    color: "#f0883e",
  },
  {
    id: "gitvania",
    title: "GitVania",
    genre: "Metroidvania",
    description:
      "Explore a commit-graph world. Unlock git commands as abilities to branch paths, merge areas, and rebase terrain.",
    color: "#f778ba",
  },
  {
    id: "git-detective",
    title: "Git Detective",
    genre: "Investigation",
    description:
      "Use git forensics — log, blame, bisect, diff — to track down bugs and solve cases.",
    color: "#58a6ff",
  },
  {
    id: "rebase-racer",
    title: "Rebase Racer",
    genre: "Side-scroll Runner",
    description:
      "Run along branch tracks. Obstacles require the right git command — fast recall under pressure.",
    color: "#3fb950",
  },
  {
    id: "merge-conflict",
    title: "Merge Conflict",
    genre: "Falling-block Puzzle",
    description:
      "Code blocks fall from two branches. Resolve conflicts — keep left, keep right, or combine.",
    color: "#bc8cff",
  },
];

const selectEl = document.getElementById("game-select")!;
const containerEl = document.getElementById("game-container")!;

function renderMenu() {
  selectEl.style.display = "grid";
  containerEl.classList.remove("active");
  containerEl.innerHTML = "";

  selectEl.innerHTML = GAMES.map(
    (g) => `
    <div class="game-card" data-game="${g.id}" style="border-left: 3px solid ${g.color}">
      <h2>${g.title}</h2>
      <div class="genre">${g.genre}</div>
      <p>${g.description}</p>
    </div>
  `
  ).join("");

  selectEl.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = (card as HTMLElement).dataset.game!;
      launchGame(id);
    });
  });
}

async function launchGame(id: string) {
  selectEl.style.display = "none";
  containerEl.classList.add("active");
  containerEl.innerHTML = `<button class="back-btn">&larr; Back to games</button><div id="game-root"></div>`;

  containerEl.querySelector(".back-btn")!.addEventListener("click", renderMenu);

  try {
    const module = await import(`./games/${id}/index.ts`);
    module.default(document.getElementById("game-root")!);
  } catch {
    containerEl.querySelector("#game-root")!.innerHTML = `
      <p style="text-align:center;padding:4rem;color:#8b949e;">Game "${id}" is not yet implemented.</p>
    `;
  }
}

renderMenu();
