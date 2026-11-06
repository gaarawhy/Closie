import clsx from "clsx";
import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full bg-closie-red-soft px-3 py-1 text-xs font-medium text-closie-red-hover",
        className,
      )}
    >
      {children}
    </span>
  );
}
