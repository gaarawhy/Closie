import type { Metadata } from "next";
import { Search } from "@/components/daily/Search";

export const metadata: Metadata = { title: "Pesquisar" };

export default function SearchPage() {
  return <Search />;
}
