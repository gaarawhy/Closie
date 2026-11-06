import clsx from "clsx";
import { CircleAlert } from "lucide-react";
import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "prefix" | "size"> & {
  ref?: Ref<HTMLInputElement>;
  label: string;
  // Texto fixo antes do valor (ex.: "closie.co/@"). Com prefixo o rótulo fica sempre no alto.
  prefix?: string;
  // Botões no fim do campo (mostrar senha, ajuda, calendário).
  actions?: ReactNode;
  error?: string;
  hint?: ReactNode;
  // Pinta o campo como inválido sem mostrar mensagem aqui (quando a mensagem fica em outro lugar).
  invalid?: boolean;
  // Mude a cada tentativa de envio para o leitor de tela anunciar o mesmo erro de novo.
  errorKey?: string | number;
};

// Campo alto (56px) no estilo do Pinterest: o rótulo aparece como placeholder e sobe quando
// a pessoa foca ou digita. Funciona só como campo controlado (precisa de `value`).
export function TextField({
  label,
  prefix,
  actions,
  error,
  hint,
  invalid = false,
  errorKey,
  className,
  id,
  ref,
  type = "text",
  value,
  "aria-describedby": describedByProp,
  ...props
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-msg`;
  const filled = value !== undefined && String(value).length > 0;
  const floated = filled || Boolean(prefix);
  const hasError = Boolean(error) || invalid;
  const describedBy = clsx(error || hint ? messageId : null, describedByProp) || undefined;

  return (
    <div className={clsx("flex w-full flex-col gap-1.5", className)}>
      <div
        className={clsx(
          "relative flex h-14 w-full items-center rounded-2xl border bg-closie-bg pr-2 pl-4 transition-[border-color,box-shadow]",
          // Com erro ou foco, o contorno engrossa para 2px (borda + ring interno de 1px)
          hasError
            ? "border-closie-red ring-1 ring-closie-red ring-inset"
            : "border-closie-border-strong hover:border-closie-text focus-within:border-closie-text focus-within:ring-1 focus-within:ring-closie-text focus-within:ring-inset",
        )}
      >
        {prefix && (
          <span aria-hidden className="shrink-0 select-none pt-5 text-base text-closie-muted">
            {prefix}
          </span>
        )}
        <input
          {...props}
          id={inputId}
          ref={ref}
          type={type}
          value={value}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={clsx(
            // O foco aparece no contorno do campo inteiro
            "peer h-full min-w-0 flex-1 bg-transparent pt-5 text-base text-closie-text focus-visible:outline-none",
            // Data vazia: esconde o "dd/mm/aaaa" nativo enquanto o rótulo ocupa o lugar dele
            type === "date" && !filled && "[&:not(:focus)]:text-transparent",
          )}
        />
        <label
          htmlFor={inputId}
          className={clsx(
            "pointer-events-none absolute left-4 max-w-[calc(100%-6rem)] truncate text-closie-muted motion-safe:transition-all motion-safe:duration-150",
            floated
              ? "top-2 text-xs"
              : // Também sobe quando o navegador autopreenche (o React só recebe o valor depois que a pessoa interage)
                "top-1/2 -translate-y-1/2 text-base peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-autofill:top-2 peer-autofill:translate-y-0 peer-autofill:text-xs",
          )}
        >
          {label}
        </label>
        {actions && <div className="ml-1 flex shrink-0 items-center gap-0.5">{actions}</div>}
      </div>
      {/* Keys diferentes: o erro é montado como nó novo e o role="alert" é anunciado.
          Um errorKey novo também cria um nó novo, então o alerta é anunciado de novo. */}
      {error ? (
        <p
          key={`error-${errorKey ?? ""}`}
          id={messageId}
          role="alert"
          className="flex items-start gap-1.5 px-1 text-sm text-closie-red-hover"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p key="hint" id={messageId} className="px-1 text-xs text-closie-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// Botão redondo de ícone usado dentro dos campos (mostrar senha, calendário).
export const fieldIconButton =
  "flex size-9 items-center justify-center rounded-full text-closie-text transition-colors hover:bg-closie-panel active:bg-closie-panel-strong";
