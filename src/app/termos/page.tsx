import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Termos de uso" };

const link = "font-semibold underline underline-offset-2";

export default function TermosPage() {
  return (
    <LegalPage title="Termos de uso">
      <section aria-labelledby="creditos" className="mt-8">
        <h2 id="creditos" className="text-lg font-semibold">
          Créditos
        </h2>
        <p className="mt-2 text-sm text-closie-muted">
          Os rabiscos à mão dos adesivos vêm do{" "}
          <a href="https://fffuel.co/dddoodle/" target="_blank" rel="noreferrer" className={link}>
            dddoodle
          </a>
          , de fffuel, sob a licença{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/deed.pt-br" target="_blank" rel="noreferrer" className={link}>
            Creative Commons Atribuição 4.0
          </a>
          . As cores foram adaptadas para combinar com cada perfil.
        </p>
      </section>
    </LegalPage>
  );
}
