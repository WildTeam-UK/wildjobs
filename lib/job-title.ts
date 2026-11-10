// Presentation only: the original source title and advert remain untouched.
export function cleanJobTitle(value: string) {
  let title = value.normalize("NFKC").replace(/\s+/g, " ").trim();
  for (let i = 0; i < 3; i++) {
    title = title
      .replace(/^(?:job\s+title|job\s+role|role|position|vacancy)\s*:\s*/i, "")
      .replace(/^we(?:\s+are|['’]re)\s+hiring\s*[!:.–—-]*\s*/i, "")
      .replace(/^(?:become|join\s+us\s+as)\s+(?:our\s+)?(?:new\s+)?/i, "")
      .trim();
  }
  if (!/(?:\b[A-Za-z]\.){2,}$/.test(title)) title = title.replace(/[.!]+$/, "").trim();
  if (!title) return value.trim();
  return title[0].toLocaleUpperCase("en-GB") + title.slice(1);
}
