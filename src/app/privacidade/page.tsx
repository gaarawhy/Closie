import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacidadePage() {
  return <LegalPage title="Política de privacidade" />;
}
