/** Narrative text rendering — chapter intro and recap */

export function renderNarrative(
  container: HTMLElement,
  title: string,
  text: string
): HTMLElement {
  const el = document.createElement("div");
  el.className = "fc-narrative";

  const h2 = document.createElement("h2");
  h2.textContent = title;
  el.appendChild(h2);

  const p = document.createElement("p");
  p.textContent = text;
  el.appendChild(p);

  container.appendChild(el);
  return el;
}

export function renderHint(container: HTMLElement, text: string): HTMLElement {
  const hint = document.createElement("div");
  hint.className = "fc-hint";
  hint.textContent = text;
  container.appendChild(hint);
  return hint;
}

/** Spawn confetti particles from a point */
export function celebrate(container: HTMLElement): void {
  const colors = ["#f0883e", "#3fb950", "#58a6ff", "#bc8cff", "#e8a838"];
  const rect = container.getBoundingClientRect();

  for (let i = 0; i < 30; i++) {
    const particle = document.createElement("div");
    particle.className = "fc-confetti-particle";
    particle.style.backgroundColor = colors[i % colors.length];
    particle.style.left = `${rect.width / 2 + (Math.random() - 0.5) * 200}px`;
    particle.style.top = `${rect.height / 2}px`;
    particle.style.animationDelay = `${Math.random() * 0.5}s`;
    particle.style.animationDuration = `${1 + Math.random() * 1}s`;
    container.appendChild(particle);
    setTimeout(() => particle.remove(), 2500);
  }
}
