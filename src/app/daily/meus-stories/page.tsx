import type { Metadata } from "next";
import { MyStories } from "@/components/daily/MyStories";

export const metadata: Metadata = { title: "Meus stories" };

export default function MyStoriesPage() {
  return <MyStories />;
}
