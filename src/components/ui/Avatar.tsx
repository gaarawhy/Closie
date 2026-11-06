"use client";

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";

type AvatarProps = {
  name: string;
  src?: string;
  size?: number;
  className?: string;
};

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

// Mostra a foto; sem foto (ou se ela falhar) mostra as iniciais.
export function Avatar({ name, src, size = 48, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={clsx(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-closie-red-soft font-medium text-closie-red-hover",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {showImage ? (
        <Image
          src={src}
          alt={`Foto de ${name}`}
          width={size}
          height={size}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span role="img" aria-label={name}>
          <span aria-hidden>{initials(name)}</span>
        </span>
      )}
    </span>
  );
}
