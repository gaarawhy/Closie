import clsx from "clsx";
import { CircleAlert } from "lucide-react";
import { useId, type Ref, type TextareaHTMLAttributes } from "react";

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value"> & {
  ref?: Ref<HTMLTextAreaElement>;
  label: string;
  value: string;
  error?: string;
  hint?: string;
  errorKey?: string | number;
  // Mostra "n/limite" no canto; omitido quando não há limite a comunicar.
  maxLength?: number;
};

// Igual ao TextField, mas de várias linhas e com o rótulo sempre no alto (não dá pra
// centralizar verticalmente um placeholder numa área que cresce).
export function TextArea({
  label,
  value,
  error,
  hint,
  errorKey,
  maxLength,
  className,
  id,
  ref,
  rows = 3,
  ...props
}: TextAreaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const messageId = `${fieldId}-msg`;
  const hasError = Boolean(error);
  const count = value.length;

  return (
    <div className={clsx("flex w-full flex-col gap-1.5", className)}>
      <div
        className={clsx(
          "relative flex w-full flex-col rounded-2xl border bg-closie-bg px-4 pt-6 pb-2 transition-[border-color,box-shadow]",
          hasError
            ? "border-closie-red ring-1 ring-closie-red ring-inset"
            : "border-closie-border-strong hover:border-closie-text focus-within:border-closie-text focus-within:ring-1 focus-within:ring-closie-text focus-within:ring-inset",
        )}
      >
        <label htmlFor={fieldId} className="pointer-events-none absolute top-2 left-4 text-xs text-closie-muted">
          {label}
        </label>
        <textarea
          {...props}
          id={fieldId}
          ref={ref}
          value={value}
          maxLength={maxLength}
          rows={rows}
          aria-invalid={hasError || undefined}
          aria-describedby={error || hint || maxLength ? messageId : undefined}
          className="min-w-0 resize-none bg-transparent text-base text-closie-text focus-visible:outline-none"
        />
        {maxLength && (
          <span aria-hidden className="self-end text-xs text-closie-muted">
            {count}/{maxLength}
          </span>
        )}
      </div>
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
