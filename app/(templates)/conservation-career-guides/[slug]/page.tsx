import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGuideData } from "@/lib/public-guides";
import { GuidePage } from "@/components/guides/guide-page";
import { pilotGuides } from "@/lib/guide-content";
import { guideMetadata } from "@/lib/guide-seo";
type Props = { params: Promise<{ slug: string }> };
async function dataFor(params: Props["params"]) {
  const { slug } = await params;
  if (!pilotGuides.some((g) => g.slug === slug && g.kind === "career")) notFound();
  return getGuideData(slug);
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await dataFor(params);
  return guideMetadata(data);
}
export default async function CareerGuide({ params }: Props) {
  return <GuidePage data={await dataFor(params)} />;
}
