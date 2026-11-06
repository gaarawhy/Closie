"use client";

import type { FormEvent, ReactNode, Ref } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { displayProfileUrl } from "@/lib/mock";
import { StepHeader } from "./StepHeader";

type ReviewStepProps = {
  username: string;
  displayName: string;
  bio: string;
  avatar: string | null;
  loading: boolean;
  headingRef?: Ref<HTMLHeadingElement>;
  onEditUsername: () => void;
  onEditProfile: () => void;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function Row({ label, editLabel, onEdit, children }: { label: string; editLabel: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-closie-border py-3.5 last:border-none">
      <div className="min-w-0">
        <p className="text-xs text-closie-muted">{label}</p>
        <div className="mt-0.5 break-words">{children}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={editLabel}
        className="shrink-0 rounded px-1 text-sm font-semibold text-closie-link hover:underline"
      >
        Editar
      </button>
    </div>
  );
}

// Último passo: confere tudo antes de concluir, com "Editar" voltando direto para a parte certa.
export function ReviewStep({
  username,
  displayName,
  bio,
  avatar,
  loading,
  headingRef,
  onEditUsername,
  onEditProfile,
  onBack,
  onSubmit,
}: ReviewStepProps) {
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col">
      <StepHeader title="Confira antes de concluir" onBack={onBack} headingRef={headingRef} />

      <div className="mt-6 flex flex-col items-center text-center">
        <Avatar name={displayName || username} src={avatar ?? undefined} size={88} />
        <p className="mt-3 text-xl font-semibold">{displayName}</p>
        <p className="text-closie-muted">{displayProfileUrl(username)}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-closie-border px-4">
        <Row label="Seu @" editLabel="Editar o @" onEdit={onEditUsername}>
          <p className="font-medium">@{username}</p>
        </Row>
        <Row label="Nome e foto" editLabel="Editar nome e foto" onEdit={onEditProfile}>
          <p className="font-medium">
            {displayName}
            <span className="font-normal text-closie-muted"> · {avatar ? "com foto" : "sem foto"}</span>
          </p>
        </Row>
        <Row label="Bio" editLabel="Editar a bio" onEdit={onEditProfile}>
          <p className={bio.trim() ? "font-medium" : "text-closie-muted"}>{bio.trim() || "Sem bio por enquanto"}</p>
        </Row>
      </div>

      <Button type="submit" size="lg" loading={loading} className="mt-6 w-full">
        {loading ? "Concluindo…" : "Concluir"}
      </Button>
    </form>
  );
}
