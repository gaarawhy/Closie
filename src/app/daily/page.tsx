import type { Metadata } from "next";
import { DailyHome } from "@/components/daily/DailyHome";

export const metadata: Metadata = { title: "Início" };

export default function DailyPage() {
  return <DailyHome />;
}
