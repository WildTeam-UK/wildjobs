export type Course = Readonly<{
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  trainingUrl: string;
}>;

export function courseBySlug(courses: readonly Course[], slug: string) {
  return courses.find((course) => course.slug === slug);
}
