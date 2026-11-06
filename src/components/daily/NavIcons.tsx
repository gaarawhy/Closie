// Ícones do menu: traço fino (1,5) e cantos redondos, no estilo da referência do Pinterest.
// Ativo = forma preenchida (casa, sino) ou traço mais forte (lupa, +). Desenhos próprios.

// `on`: cor do fundo atrás do ícone. O recorte da casa preenchida (a porta) usa essa cor; no
// cartão vermelho do item ativo da barra, fica vermelho.
type IconProps = { active?: boolean; className?: string; on?: "light" | "red" };

const cut = { light: "stroke-closie-bg", red: "stroke-closie-red" } as const;

const THIN = 1.5;
const BOLD = 2.25;

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: THIN,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function HomeIcon({ active, className, on = "light" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.75 10.25 12 3.75l8.25 6.5v8.95a1.8 1.8 0 0 1-1.8 1.8H5.55a1.8 1.8 0 0 1-1.8-1.8z" fill={active ? "currentColor" : "none"} />
      <path d="M9.6 21v-4.4a2.4 2.4 0 0 1 4.8 0V21" strokeWidth={active ? 2 : THIN} className={active ? cut[on] : undefined} />
    </svg>
  );
}

export function SearchIcon({ active, className }: IconProps) {
  return (
    <svg {...base} strokeWidth={active ? BOLD : THIN} className={className}>
      <circle cx="10.75" cy="10.75" r="6.5" />
      <path d="m15.6 15.6 4.65 4.65" />
    </svg>
  );
}

export function CreateIcon({ active, className }: IconProps) {
  return (
    <svg {...base} strokeWidth={active ? BOLD : THIN} className={className}>
      <path d="M12 4.25v15.5M4.25 12h15.5" />
    </svg>
  );
}

export function BellIcon({ active, className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path
        d="M18 15.75V11a6 6 0 0 0-12 0v4.75l-1.55 2.1a.6.6 0 0 0 .48.95h14.14a.6.6 0 0 0 .48-.95z"
        fill={active ? "currentColor" : "none"}
      />
      <path d="M10.25 21.25a2 2 0 0 0 3.5 0" />
    </svg>
  );
}
