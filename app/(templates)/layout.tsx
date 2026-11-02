import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./templates.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function TemplateLayout({ children }: { children: ReactNode }) {
  return <div className="template-design">{children}</div>;
}
