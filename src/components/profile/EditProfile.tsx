"use client";

import clsx from "clsx";
import { Camera, Globe, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useUsernameAvailability } from "@/components/auth/useUsernameAvailability";
import { useNotify } from "@/components/daily/DailyShell";
import { AvatarCropDialog } from "@/components/onboarding/AvatarCropDialog";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { updateProfile, useSession, type OnboardingField, type Session } from "@/lib/account";
import { checkAvatarFile } from "@/lib/avatar";
import { type ProfilePrivacy } from "@/lib/profile";
import { approveAllPending, pendingFollowRequests } from "@/lib/social";
import {
  BIO_MAX,
  DISPLAY_NAME_MAX,
  USERNAME_MAX,
  checkUsernameFormat,
  normalizeUsername,
  validateBio,
  validateDisplayName,
  validateUsername,
} from "@/lib/validation";
import { PROFILE_PATH } from "./links";

// Editar perfil: foto (com recorte), nome, @, bio e privacidade da conta. Salvar ou cancelar.
export function EditProfile() {
  const session = useSession();
  // O formulário só nasce com a sessão em mãos (os campos começam com os dados salvos)
  if (!session) return null;
  return <EditProfileForm key={session.id} session={session} />;
}

type Errors = Partial<Record<OnboardingField | "general", string>>;

const PRIVACY_OPTIONS: { value: ProfilePrivacy; icon: typeof Globe; label: string; text: string }[] = [
  { value: "public", icon: Globe, label: "Público", text: "Qualquer pessoa vê seus momentos e pode seguir você na hora." },
  { value: "private", icon: Lock, label: "Privado", text: "Só quem você aprovar vê seus momentos, stories e conexões." },
];

function EditProfileForm({ session }: { session: Session }) {
  const router = useRouter();
  const notify = useNotify();
  const original = session.profile;
  const fileId = useId();
  const [avatar, setAvatar] = useState(original.avatar);
  const [displayName, setDisplayName] = useState(original.displayName ?? "");
  const [username, setUsername] = useState(original.username ?? "");
  const [bio, setBio] = useState(original.bio ?? "");
  const [privacy, setPrivacy] = useState<ProfilePrivacy>(original.privacy);
  const [errors, setErrors] = useState<Errors>({});
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const pending = useMemo(() => pendingFollowRequests(session.id).length, [session.id]);
  const availability = useUsernameAvailability(username);

  const usernameChanged = username !== (original.username ?? "");
  const dirty =
    avatar !== original.avatar ||
    displayName !== (original.displayName ?? "") ||
    usernameChanged ||
    bio !== (original.bio ?? "") ||
    privacy !== original.privacy;

  const format = checkUsernameFormat(username);
  const usernameError =
    errors.username ?? (usernameChanged && availability === "taken" ? "Esse @ já está em uso. Tente outro." : undefined);
  const usernameHint = !usernameChanged
    ? `Seu link: closie.co/@${username}`
    : !format.ok
      ? format.message
      : availability === "checking"
        ? "Conferindo se está livre…"
        : availability === "available"
          ? `Boa! closie.co/@${username} está livre.`
          : undefined;

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = checkAvatarFile(file);
    if (problem) {
      setErrors((current) => ({ ...current, avatar: problem }));
      return;
    }
    setErrors((current) => ({ ...current, avatar: undefined }));
    setCropSrc(URL.createObjectURL(file));
  }

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function leave() {
    if (dirty) setLeaving(true);
    else router.push(PROFILE_PATH);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempt((value) => value + 1);
    const found: Errors = {
      displayName: validateDisplayName(displayName) ?? undefined,
      username: validateUsername(username) ?? (usernameChanged && availability === "taken" ? "Esse @ já está em uso. Tente outro." : undefined),
      bio: validateBio(bio) ?? undefined,
    };
    if (found.displayName || found.username || found.bio) {
      setErrors(found);
      return;
    }
    setSaving(true);
    const result = await updateProfile({ username, displayName, bio, avatar, privacy });
    setSaving(false);
    if (!result.ok) {
      setErrors(result.field ? { [result.field]: result.message } : { general: result.message });
      return;
    }
    // Virou público: quem estava esperando aprovação passa a seguir (como num perfil público)
    const accepted = privacy === "public" && original.privacy === "private" ? approveAllPending(session.id) : 0;
    notify(
      accepted > 0
        ? `Perfil atualizado. ${accepted === 1 ? "1 pedido para seguir foi aceito" : `${accepted} pedidos para seguir foram aceitos`}.`
        : "Perfil atualizado.",
    );
    router.push(PROFILE_PATH);
  }

  return (
    <>
      <form noValidate onSubmit={save} className="mx-auto w-full max-w-2xl pb-10">
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-closie-border bg-closie-bg/95 px-3 py-2.5 backdrop-blur">
          <button type="button" onClick={leave} className="h-10 rounded-full px-3 text-sm font-semibold transition-colors hover:bg-closie-panel">
            Cancelar
          </button>
          <h1 className="flex-1 text-center text-base font-bold">Editar perfil</h1>
          <Button type="submit" size="sm" className="rounded-full px-5" loading={saving} disabled={!dirty}>
            Salvar
          </Button>
        </div>

        {errors.general && (
          <p role="alert" className="mx-4 mt-4 rounded-2xl bg-closie-red-soft px-4 py-3 text-sm text-closie-red-hover">
            {errors.general}
          </p>
        )}

        <section aria-label="Foto de perfil" className="flex flex-col items-center px-4 pt-7">
          <div className="relative">
            <Avatar name={displayName || username} src={avatar ?? undefined} size={112} />
            <label
              htmlFor={fileId}
              aria-label="Trocar foto"
              className="absolute right-0 bottom-0 flex size-10 cursor-pointer items-center justify-center rounded-full border-4 border-closie-bg bg-closie-red text-closie-on-red transition-colors hover:bg-closie-red-hover"
            >
              <Camera aria-hidden className="size-4" />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-1">
            <label
              htmlFor={fileId}
              className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold text-closie-link hover:underline has-[+input:focus-visible]:outline-2"
            >
              {avatar ? "Trocar foto" : "Adicionar foto"}
            </label>
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar(null)}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-closie-muted hover:text-closie-red-hover hover:underline"
              >
                Remover
              </button>
            )}
          </div>
          <input id={fileId} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
          {errors.avatar && (
            <p role="alert" className="mt-1 text-sm text-closie-red-hover">
              {errors.avatar}
            </p>
          )}
        </section>

        <section aria-labelledby="titulo-sobre" className="mx-4 mt-6 rounded-[28px] border border-closie-border p-4 md:p-5">
          <h2 id="titulo-sobre" className="text-base font-bold">
            Sobre você
          </h2>
          <TextField
            className="mt-3"
            label="Nome de exibição"
            autoComplete="name"
            maxLength={DISPLAY_NAME_MAX}
            value={displayName}
            error={errors.displayName}
            errorKey={attempt}
            onChange={(event) => setDisplayName(event.target.value)}
          />
          <TextField
            className="mt-3"
            label="Seu @"
            prefix="closie.co/@"
            autoCapitalize="none"
            autoComplete="username"
            spellCheck={false}
            maxLength={USERNAME_MAX}
            value={username}
            error={usernameError}
            errorKey={attempt}
            hint={usernameHint}
            onChange={(event) => setUsername(normalizeUsername(event.target.value))}
          />
          <TextArea
            className="mt-3"
            label="Bio"
            maxLength={BIO_MAX}
            value={bio}
            error={errors.bio}
            errorKey={attempt}
            hint="Conte um pouco de você: o que gosta, onde está, o que anda fazendo."
            onChange={(event) => setBio(event.target.value)}
          />
        </section>

        <section id="privacidade" aria-labelledby="titulo-privacidade" className="mx-4 mt-4 scroll-mt-20 rounded-[28px] border border-closie-border p-4 md:p-5">
          <h2 id="titulo-privacidade" className="text-base font-bold">
            Privacidade da conta
          </h2>
          <fieldset className="mt-3">
            <legend className="sr-only">Quem vê o seu perfil</legend>
            <div className="flex flex-col gap-2">
              {PRIVACY_OPTIONS.map((option) => {
                const Icon = option.icon;
                const checked = privacy === option.value;
                return (
                  <label
                    key={option.value}
                    className={clsx(
                      "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-closie-text",
                      checked ? "border-closie-text ring-1 ring-closie-text ring-inset" : "border-closie-border-strong/60 hover:border-closie-text",
                    )}
                  >
                    <input
                      type="radio"
                      name="privacidade-conta"
                      value={option.value}
                      checked={checked}
                      onChange={() => setPrivacy(option.value)}
                      className="sr-only"
                    />
                    <Icon aria-hidden className={clsx("size-5 shrink-0", checked ? "text-closie-red" : "text-closie-muted")} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="block text-xs text-closie-muted">{option.text}</span>
                    </span>
                    <span
                      aria-hidden
                      className={clsx(
                        "size-5 shrink-0 rounded-full border-2",
                        checked ? "border-closie-red bg-closie-red shadow-[inset_0_0_0_3px_white]" : "border-closie-border-strong",
                      )}
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>
          {privacy === "public" && original.privacy === "private" && pending > 0 && (
            <p className="mt-3 rounded-2xl bg-closie-panel px-4 py-3 text-sm text-closie-muted">
              {pending === 1
                ? "Ao salvar, o pedido para seguir que está esperando será aceito."
                : `Ao salvar, os ${pending} pedidos para seguir que estão esperando serão aceitos.`}
            </p>
          )}
        </section>
      </form>

      {cropSrc && (
        <AvatarCropDialog
          src={cropSrc}
          onCancel={closeCrop}
          onConfirm={(dataUrl) => {
            setAvatar(dataUrl);
            closeCrop();
          }}
        />
      )}
      {leaving && (
        <Modal title="Descartar as alterações?" onClose={() => setLeaving(false)}>
          <p className="text-sm text-closie-muted">O que você mudou aqui não vai ser salvo.</p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setLeaving(false)}>
              Continuar editando
            </Button>
            <Button size="lg" className="flex-1" onClick={() => router.push(PROFILE_PATH)}>
              Descartar
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
