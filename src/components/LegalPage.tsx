import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";

type LegalPageProps = {
  title: string;
};

// Página provisória para Termos e Privacidade (texto final ainda não existe).
export function LegalPage({ title }: LegalPageProps) {
  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-closie-muted">
        Estamos escrevendo este texto com calma. Ele vai estar aqui antes do Closie abrir.
      </p>
      <Link
        href="/cadastro"
        className="mt-8 self-start rounded font-semibold underline underline-offset-2"
      >
        Voltar para o cadastro
      </Link>
    </AuthShell>
  );
}
