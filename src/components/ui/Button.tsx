import clsx from "clsx";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "inactive";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-closie-red text-closie-on-red hover:bg-closie-red-hover active:bg-closie-red-hover",
  secondary:
    "border border-closie-border-strong bg-closie-bg text-closie-text hover:bg-closie-panel active:bg-closie-panel-strong",
  ghost: "text-closie-text hover:bg-closie-panel active:bg-closie-panel-strong",
  // Aparência de "ainda não dá" (como o Entrar vazio do Pinterest), mas continua clicável
  // para explicar o que falta preencher.
  inactive: "bg-closie-panel-strong text-closie-muted",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

type StyleOptions = { variant?: Variant; size?: Size; className?: string };

// Exportado para links com cara de botão (ex.: âncora "Reservar meu @").
export function buttonStyles({ variant = "primary", size = "md", className }: StyleOptions = {}) {
  return clsx(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading && <Loader2 aria-hidden className="size-4 motion-safe:animate-spin" />}
      {children}
    </button>
  );
}
