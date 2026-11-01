import { isSupportedRssSource } from "./feed-source";
import { isSupportedWwtSource } from "./wwt-source";

export type SourceConnector = "rss" | "wwt";

export function getSourceConnector(sourceType: string, sourceUrl: string | null): SourceConnector | null {
  if (sourceType === "feed" && isSupportedRssSource(sourceUrl)) return "rss";
  if (sourceType === "manual_curation" && isSupportedWwtSource(sourceUrl)) return "wwt";
  return null;
}

export function connectorActionLabel(connector: SourceConnector) {
  return connector === "rss" ? "Check feed now" : "Check WWT now";
}
