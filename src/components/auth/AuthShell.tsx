import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { PhotoMosaic } from "./PhotoMosaic";

type AuthShellProps = {
  children: ReactNode;
};

// Moldura das telas de conta no estilo do modal do Pinterest: no celular o formulário ocupa a tela;
// do tablet pra cima vira um cartão branco centralizado sobre o mural de fotos.
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative flex flex-1 justify-center sm:items-center sm:px-6 sm:py-10">
      <PhotoMosaic />
      <main className="fade-up relative flex w-full flex-col bg-closie-bg px-6 pt-8 pb-10 sm:max-w-[484px] sm:rounded-[32px] sm:px-10 sm:pt-10 sm:shadow-2xl">
        <Logo className="mb-7 h-7 w-auto self-start sm:mb-8 sm:h-8" />
        {children}
      </main>
    </div>
  );
}
