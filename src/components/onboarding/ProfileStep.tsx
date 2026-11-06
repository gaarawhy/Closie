"use client";

import { Camera, X } from "lucide-react";
import { useId, useState, type ChangeEvent, type FormEvent, type Ref } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { checkAvatarFile } from "@/lib/avatar";
import { BIO_MAX, DISPLAY_NAME_MAX } from "@/lib/validation";
import { AvatarCropDialog } from "./AvatarCropDialog";
import { StepHeader } from "./StepHeader";

type ProfileStepProps = {
  username: string;
  displayName: string;
  bio: string;
  avatar: string | null;
  // Erros vindos do envio, por campo
  nameError?: string;
  bioError?: string;
  avatarError?: string;
  errorKey?: number;
  nameRef?: Ref<HTMLInputElement>;
  onChangeName: (value: string) => void;
  onChangeBio: (value: string) => void;
  onChangeAvatar: (value: string | null) => void;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

// Passo 2: nome de exibição (obrigatório), foto (com enquadramento) e bio. Foto e bio podem ficar em branco.
export function ProfileStep({
  username,
  displayName,
  bio,
  avatar,
  nameError,
  bioError,
  avatarError,
  errorKey,
  nameRef,
  onChangeName,
  onChangeBio,
  onChangeAvatar,
  onBack,
  onSubmit,
}: ProfileStepProps) {
  const fileInputId = useId();
  const [photoError, setPhotoError] = useState<string | null>(null);
  // Foto escolhida esperando o enquadramento (endereço temporário do arquivo)
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite escolher o mesmo arquivo de novo depois
    if (!file) return;
    const problem = checkAvatarFile(file);
    if (problem) {
      setPhotoError(problem);
      return;
    }
    setPhotoError(null);
    setCropSrc(URL.createObjectURL(file));
  }

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  const shownPhotoError = photoError ?? avatarError;

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col">
      <StepHeader
        title="Monte seu perfil"
        subtitle="O nome aparece para quem vê seus dumps. A foto e a bio são opcionais."
        onBack={onBack}
      />

      <div className="mt-6 flex flex-col items-center">
        <div className="relative">
          {avatar ? (
            <Avatar name={displayName || username} src={avatar} size={96} />
          ) : (
            // Sem foto: círculo com câmera (clicável), em vez de iniciais tiradas do @
            <label
              htmlFor={fileInputId}
              aria-hidden
              className="flex size-24 cursor-pointer items-center justify-center rounded-full bg-closie-panel text-closie-muted transition-colors hover:bg-closie-panel-strong"
            >
              <Camera className="size-8" />
            </label>
          )}
          {avatar && (
            <button
              type="button"
              onClick={() => onChangeAvatar(null)}
              aria-label="Remover foto"
              className="absolute -top-1 -right-1 flex size-7 items-center justify-center rounded-full bg-closie-text text-closie-bg"
            >
              <X aria-hidden className="size-4" />
            </button>
          )}
        </div>
        <label
          htmlFor={fileInputId}
          className="mt-3 flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-closie-link hover:underline has-[+input:focus-visible]:outline-2 has-[+input:focus-visible]:outline-closie-red"
        >
          <Camera aria-hidden className="size-4" />
          {avatar ? "Trocar foto" : "Adicionar foto"}
        </label>
        <input id={fileInputId} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
        {shownPhotoError && (
          <p role="alert" className="mt-1.5 text-sm text-closie-red-hover">
            {shownPhotoError}
          </p>
        )}
      </div>

      <TextField
        ref={nameRef}
        className="mt-6"
        label="Nome de exibição"
        autoComplete="name"
        maxLength={DISPLAY_NAME_MAX}
        value={displayName}
        error={nameError}
        errorKey={errorKey}
        onChange={(e) => onChangeName(e.target.value)}
      />
      <TextArea
        className="mt-3"
        label="Bio (opcional)"
        maxLength={BIO_MAX}
        value={bio}
        error={bioError}
        errorKey={errorKey}
        onChange={(e) => onChangeBio(e.target.value)}
      />

      <Button type="submit" size="lg" className="mt-6 w-full">
        Continuar
      </Button>

      {cropSrc && (
        <AvatarCropDialog
          src={cropSrc}
          onCancel={closeCrop}
          onConfirm={(dataUrl) => {
            onChangeAvatar(dataUrl);
            closeCrop();
          }}
        />
      )}
    </form>
  );
}
