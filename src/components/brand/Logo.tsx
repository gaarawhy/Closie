import { LOCKUP_VIEWBOX, LOGO_INK, LOGO_RED, MARK_PATH, MARK_VIEWBOX, WORD_PATH } from "./logo-paths";

// Logo da Closie em SVG (vetorizado do arquivo original): nítido em qualquer tamanho, sem fundo.
// Dimensione pela altura (ex.: className="h-8 w-auto"); a largura acompanha a proporção.

type LogoProps = {
  className?: string;
  // "ink" = nome em preto (fundo claro), "white" = nome em branco (fundo escuro),
  // "current" = nome na cor do texto ao redor
  tone?: "ink" | "white" | "current";
  // Texto para leitor de tela; vazio quando já existe um rótulo por perto (ex.: link com aria-label)
  label?: string;
};

// Logo completo: o símbolo + CLOSIE.
export function Logo({ className, tone = "ink", label = "Closie" }: LogoProps) {
  const word = tone === "white" ? "#FFFFFF" : tone === "current" ? "currentColor" : LOGO_INK;
  return (
    <svg viewBox={LOCKUP_VIEWBOX} className={className} {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}>
      <path d={MARK_PATH} fill={LOGO_RED} fillRule="evenodd" />
      <path d={WORD_PATH} fill={word} fillRule="evenodd" />
    </svg>
  );
}

// Só o símbolo (o "C" entrelaçado): no vermelho da marca ou em branco (sobre fundo vermelho).
export function LogoMark({ className, label = "Closie", tone = "red" }: Omit<LogoProps, "tone"> & { tone?: "red" | "white" }) {
  return (
    <svg viewBox={MARK_VIEWBOX} className={className} {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}>
      <path d={MARK_PATH} fill={tone === "white" ? "#FFFFFF" : LOGO_RED} fillRule="evenodd" />
    </svg>
  );
}
