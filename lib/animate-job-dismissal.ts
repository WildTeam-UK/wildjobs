// Native animations only: a short exit, then a collapsing row (including its grid gap).
export async function animateJobDismissal(row: HTMLElement | null) {
  if (!row || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !row.animate) return;
  const card = row.firstElementChild as HTMLElement | null;
  if (!card?.animate) return;
  const animations: Animation[] = [];
  row.inert = true;
  try {
    const exit = card.animate(
      [
        { opacity: 1, transform: "translateX(0) rotate(0) scale(1)" },
        { opacity: 0, transform: "translateX(-18px) rotate(-2deg) scale(0.97)" },
      ],
      { duration: 180, easing: "ease-in", fill: "forwards" },
    );
    animations.push(exit);
    await exit.finished;
    const gap = row.parentElement ? Number.parseFloat(getComputedStyle(row.parentElement).rowGap) || 0 : 0;
    const collapse = row.animate(
      [
        { height: `${row.getBoundingClientRect().height}px`, marginBottom: "0px", opacity: 0 },
        { height: "0px", marginBottom: `${-gap}px`, opacity: 0 },
      ],
      { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
    );
    animations.push(collapse);
    await collapse.finished;
  } catch {
    // A cancelled animation must not prevent the requested dismissal.
  } finally {
    row.inert = false;
    // Keep the final frame until React removes the row in the next paint.
    requestAnimationFrame(() => animations.forEach((animation) => animation.cancel()));
  }
}
