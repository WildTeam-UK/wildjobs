export const DEFAULT_COURSE_THEME_COLOUR = "#e60088";

export type Course = Readonly<{
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  trainingUrl: string;
  themeColour: string;
}>;

export function courseBySlug(courses: readonly Course[], slug: string) {
  return courses.find((course) => course.slug === slug);
}
