import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "Página não encontrada" };

// Endereço que não existe: a marca, uma frase curta e o caminho de volta.
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <Logo className="h-9 w-auto" />
      <h1 className="mt-10 text-2xl font-semibold tracking-tight">Essa página não existe</h1>
      <p className="mt-2 text-closie-muted">O link pode estar errado ou a página saiu do ar.</p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-closie-red px-5 text-sm font-semibold text-closie-on-red transition-colors hover:bg-closie-red-hover"
      >
        Ir para a Closie
      </Link>
    </main>
  );
}
