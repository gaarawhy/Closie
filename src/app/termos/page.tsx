import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return <LegalPage title="Termos de uso" />;
}
