import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseHTML } from "linkedom";
import { expect, it } from "vitest";
import { CourseRecommendationsLink } from "../components/course-recommendations-link";

it("renders the course link with its accessible tooltip inside the client boundary", () => {
  const { document } = parseHTML(renderToStaticMarkup(createElement(CourseRecommendationsLink)));
  const link = document.querySelector("a");
  expect(link?.getAttribute("href")).toBe("/course-recommendations");
  expect(link?.textContent).toBe("Recommended courses");
  const tooltip = document.getElementById(link!.getAttribute("aria-describedby")!);
  expect(tooltip?.getAttribute("role")).toBe("tooltip");
  expect(tooltip?.textContent).toContain("Read how WildJobs recommends training.");
});
