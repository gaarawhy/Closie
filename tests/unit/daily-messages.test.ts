import { describe, expect, it } from "vitest";
import {
  closeFriendMessage,
  followMessage,
  notificationText,
  privacyChangeMessage,
  suggestionReasonText,
  WELCOME_MESSAGE,
} from "@/components/daily/messages";

// Avisos (toasts) da área logada: nunca presumem o gênero de ninguém e dizem a verdade
// sobre quem vê o quê.
describe("avisos do daily", () => {
  it("seguir: frase neutra, e pela Pesquisa lembra que os stories aparecem no Início", () => {
    expect(followMessage("approved", "Davi", { hint: "home" })).toBe("Agora você segue Davi. Os stories aparecem no Início.");
    expect(followMessage("approved", "Davi")).toBe("Agora você segue Davi.");
    expect(followMessage("pending", "Nina")).toBe("Pedido enviado para Nina.");
    expect(followMessage("blocked", "Nina")).toBe("Não deu pra seguir agora.");
    expect(followMessage("self", "Nina")).toBe("Não deu pra seguir agora.");
  });

  it("amigos próximos: entrar e sair com frase neutra", () => {
    expect(closeFriendMessage("Lia", true)).toBe("Lia entrou nos seus amigos próximos.");
    expect(closeFriendMessage("Lia", false)).toBe("Lia saiu dos seus amigos próximos.");
  });

  it("privacidade do story: a frase certa para cada opção", () => {
    expect(privacyChangeMessage("followers", false)).toBe("Agora só seus seguidores veem esse story.");
    expect(privacyChangeMessage("close_friends", false)).toBe("Agora só seus amigos próximos veem esse story.");
    expect(privacyChangeMessage("public", false)).toBe("Agora qualquer pessoa pode ver esse story, inclusive no Descobrir.");
  });

  it("story público com perfil privado: avisa que só os seguidores veem", () => {
    expect(privacyChangeMessage("public", true)).toBe("Marcado como público, mas seu perfil é privado: só seus seguidores veem.");
  });

  it("boas-vindas sem gênero", () => {
    expect(WELCOME_MESSAGE).toBe("Perfil pronto! Boas-vindas ao seu daily.");
  });

  it("notificações: o texto de cada tipo, sem gênero", () => {
    const from = { id: "ana", username: "ana", displayName: "Ana", avatar: null, privacy: "public" as const };
    const story = {
      id: "s1",
      ownerId: "eu",
      media: { type: "image" as const, url: "https://picsum.photos/1080/1920" },
      caption: null,
      privacy: "followers" as const,
      createdAt: "2026-11-05T12:00:00.000Z",
      expiresAt: "2026-11-06T12:00:00.000Z",
      deletedAt: null,
    };
    const base = { id: "n", from, at: "2026-11-05T12:30:00.000Z" };
    expect(notificationText({ ...base, kind: "follow_request" })).toBe("pediu para seguir você.");
    expect(notificationText({ ...base, kind: "new_follower" })).toBe("começou a seguir você.");
    expect(notificationText({ ...base, kind: "request_accepted" })).toBe("aceitou seu pedido para seguir.");
    expect(notificationText({ ...base, kind: "like", story })).toBe("curtiu seu story.");
    expect(notificationText({ ...base, kind: "reply", story, text: "que lindo!" })).toBe("respondeu ao seu story: “que lindo!”");
    expect(notificationText({ ...base, kind: "reaction", story, emoji: "😂" })).toBe("reagiu 😂 ao seu story.");
  });

  it("sugestões: por que a pessoa aparece", () => {
    const person = { id: "bia", username: "bia.costa", displayName: "Bia Costa", avatar: null, privacy: "public" as const };
    const via = { id: "lia", username: "lia", displayName: "Lia Mendes", avatar: null, privacy: "public" as const };
    expect(suggestionReasonText({ person, reason: "follows_you", via: null })).toBe("Segue você");
    expect(suggestionReasonText({ person, reason: "followed_by", via })).toBe("Seguido(a) por Lia");
    expect(suggestionReasonText({ person, reason: "posted_today", via: null })).toBe("Postou hoje");
    expect(suggestionReasonText({ person, reason: "new", via: null })).toBe("@bia.costa");
  });
});
