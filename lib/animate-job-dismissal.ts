function layoutKey(element: HTMLElement) {
  return element.dataset.jobDismissal ?? element.getAttribute("aria-labelledby") ?? element.id;
}

// Remove first, then animate surviving cards from their old positions to the new layout.
// No collapsed-height/grid-gap handoff at the end of the animation.
export async function animateJobDismissal(row: HTMLElement | null, remove: () => void) {
  if (!row || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !row.animate) {
    remove();
    return;
  }
  const card = row.firstElementChild as HTMLElement | null;
  if (!card?.animate) {
    remove();
    return;
  }
  const list = row.parentElement;
  const selector = "[data-job-dismissal], .job-training-promo";
  const positions = new Map(
    Array.from(list?.querySelectorAll<HTMLElement>(selector) ?? []).map((element) => [
      layoutKey(element),
      element.getBoundingClientRect().top + window.scrollY,
    ]),
  );
  let exit: Animation | undefined;
  row.inert = true;
  try {
    exit = card.animate(
      [
        { opacity: 1, transform: "translateX(0) rotate(0) scale(1)" },
        { opacity: 0, transform: "translateX(-18px) rotate(-2deg) scale(0.97)" },
      ],
      { duration: 180, easing: "ease-in", fill: "forwards" },
    );
    await exit.finished;
  } catch {
    // A cancelled animation must not prevent the requested dismissal.
  } finally {
    row.inert = false;
  }
  // The caller commits React's update synchronously so these are the final layout positions.
  remove();
  exit?.cancel();
  if (!list?.isConnected) return;
  for (const element of list.querySelectorAll<HTMLElement>(selector)) {
    const previousTop = positions.get(layoutKey(element));
    const offset =
      previousTop === undefined ? 10 : previousTop - element.getBoundingClientRect().top - window.scrollY;
    if (Math.abs(offset) < 1) continue;
    element.animate(
      [
        { transform: `translateY(${offset}px)`, opacity: previousTop === undefined ? 0 : 1 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }
}
