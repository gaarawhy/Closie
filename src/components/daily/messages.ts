import type { NotificationItem } from "@/lib/notifications";
import type { FollowResult } from "@/lib/social";
import type { StoryPrivacy, Suggestion } from "@/lib/stories";

// Avisos (toasts) da área logada. Regras do texto: nunca presumir o gênero de ninguém
// ("dela", "amigo próximo" para todo mundo) e dizer a verdade sobre quem vê o quê.

export const WELCOME_MESSAGE = "Perfil pronto! Boas-vindas ao seu daily.";

// Depois de tocar em "Seguir". Fora do Início (na Pesquisa), lembra onde os stories passam a aparecer.
export function followMessage(result: FollowResult, name: string, options: { hint?: "home" } = {}): string {
  if (result === "approved") {
    return options.hint === "home" ? `Agora você segue ${name}. Os stories aparecem no Início.` : `Agora você segue ${name}.`;
  }
  if (result === "pending") return `Pedido enviado para ${name}.`;
  return "Não deu pra seguir agora.";
}

export function closeFriendMessage(name: string, added: boolean): string {
  return added ? `${name} entrou nos seus amigos próximos.` : `${name} saiu dos seus amigos próximos.`;
}

// O que vem depois do nome em cada notificação ("Ana" + "curtiu seu story.").
export function notificationText(item: NotificationItem): string {
  switch (item.kind) {
    case "follow_request":
      return "pediu para seguir você.";
    case "new_follower":
      return "começou a seguir você.";
    case "request_accepted":
      return "aceitou seu pedido para seguir.";
    case "like":
      return "curtiu seu story.";
    case "reply":
      return `respondeu ao seu story: “${item.text}”`;
    case "reaction":
      return `reagiu ${item.emoji} ao seu story.`;
  }
}

// Embaixo do nome, nas sugestões: por que essa pessoa aparece.
export function suggestionReasonText(item: Suggestion): string {
  switch (item.reason) {
    case "follows_you":
      return "Segue você";
    case "followed_by":
      return item.via ? `Seguido(a) por ${(item.via.displayName ?? item.via.username).split(/\s+/)[0]}` : "Amigo(a) de amigos";
    case "posted_today":
      return "Postou hoje";
    case "new":
      return `@${item.person.username}`;
  }
}

// Depois de mudar quem pode ver um story. Perfil privado limita o "Público" aos seguidores.
export function privacyChangeMessage(privacy: StoryPrivacy, profilePrivate: boolean): string {
  if (privacy === "followers") return "Agora só seus seguidores veem esse story.";
  if (privacy === "close_friends") return "Agora só seus amigos próximos veem esse story.";
  return profilePrivate
    ? "Marcado como público, mas seu perfil é privado: só seus seguidores veem."
    : "Agora qualquer pessoa pode ver esse story, inclusive no Descobrir.";
}
