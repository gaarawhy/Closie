"use client";

import clsx from "clsx";
import { Ban, BellOff, Bell, MoreHorizontal, Star, UserMinus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { profileHref } from "@/components/profile/links";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/account";
import {
  approveFollow,
  block,
  blockedIds,
  follow,
  followStatus,
  followingIds,
  getCloseFriends,
  getPerson,
  isBlockedEitherWay,
  isMuted,
  listPeople,
  mute,
  pendingFollowRequests,
  rejectFollow,
  setCloseFriends,
  unblock,
  unfollow,
  unmute,
  useSocialSnapshot,
  type Person,
} from "@/lib/social";
import { followDemoFriends, isDemoPerson } from "@/lib/stories";
import { useNotify } from "./DailyShell";
import { closeFriendMessage, followMessage } from "./messages";

// Quem você segue e quem segue você: pedidos, amigos próximos, silenciar, bloquear e achar gente.
export function Friends() {
  return (
    <div className="mx-auto w-full max-w-2xl pt-6 md:pt-10">
      <h1 className="px-4 text-2xl font-bold tracking-tight">Amigos</h1>
      <FriendsContent />
    </div>
  );
}

const first = (person: Person) => (person.displayName ?? person.username).split(/\s+/)[0];

function FriendsContent() {
  const session = useSession();
  const notify = useNotify();
  const social = useSocialSnapshot();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const me = session?.id ?? null;

  const data = useMemo(() => {
    void social;
    if (!me) return null;
    const people = (ids: string[]) => ids.map(getPerson).filter((person): person is Person => person !== null);
    const following = people(followingIds(me));
    const followingSet = new Set(following.map((person) => person.id));
    const blocked = people(blockedIds(me));
    return {
      requests: people(pendingFollowRequests(me)),
      following,
      blocked,
      closeFriends: new Set(getCloseFriends(me)),
      muted: new Set(following.filter((person) => isMuted(me, person.id)).map((person) => person.id)),
      suggestions: listPeople()
        .filter((person) => person.id !== me && !followingSet.has(person.id) && !isBlockedEitherWay(me, person.id))
        .map((person) => ({ person, pending: followStatus(me, person.id) === "pending" })),
    };
  }, [social, me]);

  if (!me || !data) return null;
  const viewer = me;

  function toggleClose(person: Person) {
    const list = getCloseFriends(viewer);
    const isClose = list.includes(person.id);
    setCloseFriends(viewer, isClose ? list.filter((id) => id !== person.id) : [...list, person.id]);
    notify(closeFriendMessage(first(person), !isClose));
  }

  function act(message: string, run: () => void) {
    run();
    setMenuFor(null);
    notify(message);
  }

  return (
    <div className="flex flex-col gap-8 px-4 pt-6">
      {data.requests.length > 0 && (
        <Section title="Pedidos para seguir você" count={data.requests.length}>
          {data.requests.map((person) => (
            <PersonRow key={person.id} person={person}>
              <Button size="sm" className="rounded-full" onClick={() => act(`${first(person)} agora segue você.`, () => approveFollow(viewer, person.id))}>
                Aceitar
              </Button>
              <Button variant="secondary" size="sm" className="rounded-full" onClick={() => act("Pedido recusado.", () => rejectFollow(viewer, person.id))}>
                Recusar
              </Button>
            </PersonRow>
          ))}
        </Section>
      )}

      <Section
        title="Seguindo"
        count={data.following.length}
        description={data.following.length > 0 ? "Toque na estrela para escolher seus amigos próximos (eles veem os stories marcados assim)." : undefined}
      >
        {data.following.length === 0 ? (
          <li className="py-4 text-sm text-closie-muted">Você ainda não segue ninguém.</li>
        ) : (
          data.following.map((person) => {
            const isClose = data.closeFriends.has(person.id);
            const isMutedPerson = data.muted.has(person.id);
            return (
              <PersonRow key={person.id} person={person} note={isMutedPerson ? "silenciado" : undefined}>
                <button
                  type="button"
                  onClick={() => toggleClose(person)}
                  aria-pressed={isClose}
                  aria-label={`${first(person)} nos amigos próximos`}
                  className={clsx(
                    "flex size-10 items-center justify-center rounded-full transition-colors",
                    isClose ? "bg-closie-red-soft text-closie-red" : "text-closie-muted hover:bg-closie-panel",
                  )}
                >
                  <Star aria-hidden className={clsx("size-5", isClose && "fill-current")} />
                </button>
                <button
                  type="button"
                  onClick={() => setMenuFor(menuFor === person.id ? null : person.id)}
                  aria-label={`Mais opções para ${first(person)}`}
                  aria-expanded={menuFor === person.id}
                  className="flex size-10 items-center justify-center rounded-full text-closie-muted hover:bg-closie-panel"
                >
                  <MoreHorizontal aria-hidden className="size-5" />
                </button>
                {menuFor === person.id && (
                  <div className="flex w-full basis-full flex-wrap gap-2 pt-2 sm:justify-end">
                    <Chip
                      icon={isMutedPerson ? <Bell aria-hidden className="size-4" /> : <BellOff aria-hidden className="size-4" />}
                      onClick={() =>
                        isMutedPerson
                          ? act(`Os stories de ${first(person)} voltaram para o seu daily.`, () => unmute(viewer, person.id))
                          : act(`Você não vai mais ver os stories de ${first(person)} no seu daily.`, () => mute(viewer, person.id))
                      }
                    >
                      {isMutedPerson ? "Reativar stories" : "Silenciar stories"}
                    </Chip>
                    <Chip icon={<UserMinus aria-hidden className="size-4" />} onClick={() => act(`Você deixou de seguir ${first(person)}.`, () => unfollow(viewer, person.id))}>
                      Deixar de seguir
                    </Chip>
                    <Chip danger icon={<Ban aria-hidden className="size-4" />} onClick={() => act(`Você bloqueou ${first(person)}.`, () => block(viewer, person.id))}>
                      Bloquear
                    </Chip>
                  </div>
                )}
              </PersonRow>
            );
          })
        )}
      </Section>

      <Section title="Encontrar pessoas" description="No modo demonstração aparecem os perfis de exemplo e as outras contas criadas neste navegador.">
        {data.suggestions.length === 0 ? (
          <li className="py-4 text-sm text-closie-muted">Ninguém novo por aqui.</li>
        ) : (
          data.suggestions.map(({ person, pending }) => (
            <PersonRow key={person.id} person={person} note={person.privacy === "private" ? "perfil privado" : undefined}>
              {pending ? (
                <Button variant="secondary" size="sm" className="rounded-full" onClick={() => act("Pedido cancelado.", () => unfollow(viewer, person.id))}>
                  Pedido enviado
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={() => notify(followMessage(follow(viewer, person.id), first(person)))}
                >
                  Seguir
                </Button>
              )}
            </PersonRow>
          ))
        )}
        {data.suggestions.some(({ person }) => isDemoPerson(person.id)) && (
          <li className="pt-3">
            <button
              type="button"
              onClick={() => act("Pronto! Você segue os amigos de exemplo.", () => followDemoFriends(viewer))}
              className="text-sm font-semibold text-closie-link hover:underline"
            >
              Seguir todos os amigos de exemplo
            </button>
          </li>
        )}
      </Section>

      {data.blocked.length > 0 && (
        <Section title="Bloqueados" count={data.blocked.length} description="Vocês não veem nem interagem com os stories um do outro.">
          {data.blocked.map((person) => (
            <PersonRow key={person.id} person={person}>
              <Button variant="secondary" size="sm" className="rounded-full" onClick={() => act(`Você desbloqueou ${first(person)}.`, () => unblock(viewer, person.id))}>
                Desbloquear
              </Button>
            </PersonRow>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, count, description, children }: { title: string; count?: number; description?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold">
        {title}
        {count !== undefined && <span className="font-normal text-closie-muted"> ({count})</span>}
      </h2>
      {description && <p className="text-sm text-closie-muted">{description}</p>}
      <ul className="mt-1 divide-y divide-closie-border">{children}</ul>
    </section>
  );
}

function PersonRow({ person, note, children }: { person: Person; note?: string; children: ReactNode }) {
  const name = person.displayName ?? person.username;
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <Avatar name={name} src={person.avatar ?? undefined} size={44} />
      <div className="min-w-0 flex-1">
        <Link href={profileHref(person.username)} className="block truncate font-semibold hover:underline">
          {name}
        </Link>
        <p className="truncate text-sm text-closie-muted">
          @{person.username}
          {note && ` · ${note}`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </li>
  );
}

function Chip({ icon, danger, onClick, children }: { icon: ReactNode; danger?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-colors",
        danger ? "border-closie-red/40 text-closie-red-hover hover:bg-closie-red-soft" : "border-closie-border-strong/60 hover:bg-closie-panel",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
