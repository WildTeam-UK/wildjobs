import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGuideData } from "@/lib/public-guides";
import { GuidePage } from "@/components/guides/guide-page";
import { guidePath, pilotGuides } from "@/lib/guide-content";
type Props = { params: Promise<{ slug: string }> };
async function dataFor(params: Props["params"]) {
  const { slug } = await params;
  if (!pilotGuides.some((g) => g.slug === slug && g.kind === "career")) notFound();
  return getGuideData(slug);
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await dataFor(params);
  return {
    title: `How to become an ${data.guide.accent} — career guide`,
    description: data.guide.description,
    alternates: { canonical: guidePath(data.guide) },
    robots: data.isDraft ? { index: false, follow: true } : undefined,
  };
}
export default async function CareerGuide({ params }: Props) {
  return <GuidePage data={await dataFor(params)} />;
}
