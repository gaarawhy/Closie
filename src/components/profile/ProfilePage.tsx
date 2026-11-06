"use client";

import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNotify } from "@/components/daily/DailyShell";
import { followMessage } from "@/components/daily/messages";
import { firstName } from "@/components/stories/StoriesRail";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { useViewerState } from "@/components/stories/useViewerState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { signOut, useSession } from "@/lib/account";
import { resolveAppearance, seedDemoAppearances, useSavedAppearance } from "@/lib/appearance";
import { displayProfileUrl } from "@/lib/mock";
import { canViewPosts, countPosts, listPosts, seedDemoPosts, usePostsSnapshot } from "@/lib/posts";
import {
  USER_REPORT_REASONS,
  block,
  follow,
  followerIds,
  followingIds,
  getPerson,
  listPeople,
  relationship,
  reportUser,
  unblock,
  unfollow,
  useSocialSnapshot,
} from "@/lib/social";
import { buildPersonGroup, hasDemoNetwork, useNow, useStoriesSnapshot } from "@/lib/stories";
import { normalizeUsername } from "@/lib/validation";
import { AlbumViewer } from "./AlbumViewer";
import { ConnectionsSheet, type ConnectionsTab } from "./ConnectionsSheet";
import { profileHref, shareLink, shareableUrl } from "./links";
import { MomentComposer } from "./MomentComposer";
import { ProfileCorner } from "./ProfileCorner";
import { ProfileView } from "./ProfileView";

const REPORT_LABELS: Record<(typeof USER_REPORT_REASONS)[number], string> = {
  spam: "Spam ou golpe",
  perfil_falso: "Perfil falso ou se passando por alguém",
  assedio: "Assédio ou bullying",
  conteudo_improprio: "Conteúdo impróprio",
  outro: "Outro motivo",
};

// Perfil de outra pessoa pelo @ do endereço (/daily/perfil/[username]).
export function ProfileByUsername() {
  const params = useParams<{ username: string }>();
  let username = params?.username ?? "";
  try {
    username = decodeURIComponent(username);
  } catch {
    // Endereço quebrado: segue com o texto como veio (vai dar "não encontrado")
  }
  return <ProfilePage username={username} />;
}

// Esqueleto enquanto o endereço é lido: só blocos cinza, nenhum dado de ninguém.
export function ProfileSkeleton() {
  return (
    <div aria-hidden className="mx-auto w-full max-w-6xl md:px-6 md:pt-6">
      <span className="block h-40 bg-closie-panel motion-safe:animate-pulse md:rounded-3xl" />
      <div className="px-5 md:px-0">
        <span className="-mt-12 block size-[104px] rounded-full border-4 border-closie-bg bg-closie-panel" />
        <span className="mt-4 block h-6 w-48 rounded-full bg-closie-panel motion-safe:animate-pulse" />
        <span className="mt-2 block h-4 w-32 rounded-full bg-closie-panel motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

// Dados do perfil para a tela (e para a prévia da personalização)
export function useProfileData(viewerId: string | null, personId: string | null, now: number) {
  const social = useSocialSnapshot();
  const postsSnapshot = usePostsSnapshot();
  const storiesSnapshot = useStoriesSnapshot();
  return useMemo(() => {
    void social;
    void postsSnapshot;
    void storiesSnapshot;
    if (!viewerId || !personId) return null;
    const rel = relationship(viewerId, personId);
    const blockedAny = rel === "blocked" || rel === "blocked_by";
    const canSee = !blockedAny && canViewPosts(viewerId, personId);
    return {
      rel,
      canSee,
      followsYou: rel !== "self" && followerIds(viewerId).includes(personId),
      stats: { posts: countPosts(personId), followers: followerIds(personId).length, following: followingIds(personId).length },
      // Nada de momentos (nem capa) para quem não pode ver
      moments: canSee ? listPosts(viewerId, personId) : [],
      stories: blockedAny ? null : buildPersonGroup(viewerId, personId, now),
    };
  }, [social, postsSnapshot, storiesSnapshot, viewerId, personId, now]);
}

// Página de perfil. Sem `username`, é o seu perfil.
export function ProfilePage({ username }: { username?: string }) {
  const session = useSession();
  const viewerId = session?.id ?? null;
  const viewerUsername = session?.profile.username ?? null;
  const notify = useNotify();
  const social = useSocialSnapshot();
  const now = useNow(60_000);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { viewer, open: openViewer, close: closeViewer } = useViewerState();
  const [connections, setConnections] = useState<ConnectionsTab | null>(null);
  const [composing, setComposing] = useState(false);
  const [dialog, setDialog] = useState<null | "unfollow" | "report" | "block">(null);
  // Se o álbum foi aberto aqui (e não por um link), fechar volta no histórico
  const pushedAlbum = useRef(false);

  // Modo demonstração: os perfis de exemplo ganham álbuns e um estilo cada (uma vez só)
  useEffect(() => {
    if (!hasDemoNetwork()) return;
    seedDemoPosts();
    seedDemoAppearances();
  }, []);

  const person = useMemo(() => {
    void social;
    if (!viewerId) return null;
    if (!username) return getPerson(viewerId);
    const wanted = normalizeUsername(username);
    return listPeople().find((item) => item.username === wanted) ?? null;
  }, [social, viewerId, username]);

  const data = useProfileData(viewerId, person?.id ?? null, now);
  const saved = useSavedAppearance(person?.id ?? null);
  const look = useMemo(() => resolveAppearance(saved), [saved]);

  if (!session || !viewerId) return null;

  if (!person) {
    return (
      <Centered title={`Não achamos @${normalizeUsername(username ?? "")}`} text="Confira o @ ou procure a pessoa na Pesquisa.">
        <Link href="/daily/pesquisar" className="mt-4 inline-flex h-11 items-center rounded-full bg-closie-red px-5 text-sm font-semibold text-closie-on-red hover:bg-closie-red-hover">
          Ir para a Pesquisa
        </Link>
      </Centered>
    );
  }
  if (!data) return null;
  if (data.rel === "blocked_by") {
    return <Centered title="Esse perfil não está disponível" text="Não dá pra ver esse perfil agora." />;
  }

  const owner = person;
  const me = viewerId;
  const isOwn = data.rel === "self";
  const first = firstName(owner);
  const momentId = searchParams.get("momento");
  const openPost = momentId ? (data.moments.find((post) => post.id === momentId) ?? null) : null;

  function openAlbum(postId: string) {
    pushedAlbum.current = true;
    window.history.pushState(null, "", `${pathname}?momento=${encodeURIComponent(postId)}`);
  }

  function closeAlbum() {
    if (pushedAlbum.current) {
      pushedAlbum.current = false;
      window.history.back();
    } else {
      window.history.replaceState(null, "", pathname);
    }
  }

  function doFollow() {
    notify(followMessage(follow(me, owner.id), first));
  }

  async function share() {
    const result = await shareLink(shareableUrl(profileHref(owner.username)), `${owner.displayName ?? owner.username} na Closie`);
    if (result === "copied") notify("Link do perfil copiado.");
    else if (result === "failed") notify("Não deu pra compartilhar agora.");
  }

  async function copyMyLink() {
    const link = displayProfileUrl(owner.username);
    try {
      await navigator.clipboard.writeText(`https://${link}`);
      notify("Link copiado. Agora é só colar na bio.");
    } catch {
      notify(`Não deu pra copiar. Seu link é ${link}`);
    }
  }

  return (
    <div className="w-full">
      <ProfileView
        person={owner}
        look={look}
        rel={data.rel}
        followsYou={data.followsYou}
        canSee={data.canSee}
        stats={data.stats}
        storyCount={data.stories?.stories.length ?? 0}
        moments={data.moments}
        now={now}
        // O fundo do perfil vai até o pé da página (por baixo da folga da barra do celular)
        className="-mb-[calc(5.5rem+env(safe-area-inset-bottom))] min-h-dvh pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:-mb-12 md:pb-12"
        actions={{
          onOpenStories: () => data.stories && openViewer([{ ...data.stories, startIndex: isOwn ? 0 : data.stories.startIndex }], 0),
          onOpenConnections: setConnections,
          onFollow: doFollow,
          onUnfollow: () => setDialog("unfollow"),
          onCancelRequest: () => {
            unfollow(me, owner.id);
            notify("Pedido cancelado.");
          },
          onUnblock: () => {
            unblock(me, owner.id);
            notify(`Você desbloqueou ${first}.`);
          },
          onOpenMoment: openAlbum,
          onCreateMoment: () => setComposing(true),
        }}
        corner={
          <ProfileCorner
            isOwn={isOwn}
            blocked={data.rel === "blocked"}
            firstName={first}
            onShare={share}
            onCopyLink={copyMyLink}
            onSignOut={() => signOut()}
            onReport={() => setDialog("report")}
            onBlock={() => setDialog("block")}
          />
        }
      />

      {openPost && (
        <AlbumViewer
          key={openPost.id}
          post={openPost}
          owner={owner}
          viewerId={me}
          viewerUsername={viewerUsername}
          now={now}
          onClose={closeAlbum}
          onDeleted={() => {
            closeAlbum();
            notify("Momento excluído.");
          }}
          onNotify={notify}
        />
      )}
      {composing && (
        <MomentComposer
          viewerId={me}
          onClose={() => setComposing(false)}
          onPublished={() => {
            setComposing(false);
            notify("Momento publicado!");
          }}
        />
      )}
      {connections && (
        <ConnectionsSheet
          owner={owner}
          viewerId={me}
          viewerUsername={viewerUsername}
          initialTab={connections}
          onClose={() => setConnections(null)}
          onNotify={notify}
        />
      )}
      {viewer && <StoryViewer viewerId={me} groups={viewer.groups} startGroupIndex={viewer.start} onClose={closeViewer} onNotify={notify} />}

      {dialog === "unfollow" && (
        <Modal title={`Deixar de seguir ${first}?`} onClose={() => setDialog(null)}>
          <p className="text-sm text-closie-muted">
            {owner.privacy === "private"
              ? "O perfil é privado: para ver os momentos e os stories de novo, você vai precisar pedir de novo."
              : "Os stories deixam de aparecer no seu Início."}
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setDialog(null)}>
              Cancelar
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => {
                unfollow(me, owner.id);
                setDialog(null);
                notify(`Você deixou de seguir ${first}.`);
              }}
            >
              Deixar de seguir
            </Button>
          </div>
        </Modal>
      )}
      {dialog === "report" && (
        <Modal title={`Denunciar @${owner.username}`} onClose={() => setDialog(null)}>
          <p className="text-sm text-closie-muted">Ninguém fica sabendo que foi você. Qual é o problema?</p>
          <div className="mt-3 flex flex-col gap-1">
            {USER_REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => {
                  const added = reportUser(me, owner.id, reason);
                  setDialog(null);
                  notify(added ? "Obrigado por avisar. A denúncia foi registrada." : "Você já denunciou esse perfil.");
                }}
                className="rounded-2xl px-3 py-3 text-left text-sm font-medium hover:bg-closie-panel"
              >
                {REPORT_LABELS[reason]}
              </button>
            ))}
          </div>
        </Modal>
      )}
      {dialog === "block" && (
        <Modal title={`Bloquear ${first}?`} onClose={() => setDialog(null)}>
          <p className="text-sm text-closie-muted">
            Vocês deixam de se seguir e não veem os momentos nem os stories um do outro. Dá pra desbloquear depois, aqui no perfil ou em Amigos.
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setDialog(null)}>
              Cancelar
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => {
                block(me, owner.id);
                setDialog(null);
                notify(`Você bloqueou ${first}.`);
              }}
            >
              Bloquear
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Centered({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 pt-24 text-center">
      <p className="text-lg font-bold">{title}</p>
      <p className="mt-1 text-sm text-closie-muted">{text}</p>
      {children}
    </div>
  );
}
