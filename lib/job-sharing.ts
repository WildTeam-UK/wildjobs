type ShareBrowser = {
  share?: (data: { title: string; text: string; url: string }) => Promise<void>;
  clipboard?: { writeText: (value: string) => Promise<void> };
};

export async function shareJob(title: string, url: string, browser: ShareBrowser = navigator) {
  if (browser.share) {
    try {
      await browser.share({ title, text: title, url });
      return "shared" as const;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return "cancelled" as const;
    }
  }
  try {
    if (browser.clipboard) {
      await browser.clipboard.writeText(url);
      return "copied" as const;
    }
  } catch {
    // The UI exposes a selectable link when clipboard permission is unavailable.
  }
  return "unavailable" as const;
}
