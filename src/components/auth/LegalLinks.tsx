import clsx from "clsx";
import Link from "next/link";
import { MIN_AGE } from "@/lib/validation";

const linkClass = "rounded underline underline-offset-2 hover:text-closie-text";

// Rodapé do cartão de entrar: "Termos de Uso · Política de Privacidade".
export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Links legais" className={clsx("text-xs text-closie-muted", className)}>
      <Link href="/termos" className={linkClass}>
        Termos de Uso
      </Link>
      <span aria-hidden> </span>
      <Link href="/privacidade" className={linkClass}>
        Política de Privacidade
      </Link>
    </nav>
  );
}

// Aviso no fim do cadastro: idade mínima + aceite dos termos.
export function SignupNotice({ className }: { className?: string }) {
  return (
    <p className={clsx("text-xs leading-relaxed text-closie-muted", className)}>
      Você precisa ter pelo menos {MIN_AGE} anos de idade para usar o Closie. Ao continuar, você concorda com os{" "}
      <Link href="/termos" className={linkClass}>
        Termos de Uso
      </Link>{" "}
      do Closie e confirma que leu nossa{" "}
      <Link href="/privacidade" className={linkClass}>
        Política de Privacidade
      </Link>
      .
    </p>
  );
}
