// Endereços do perfil dentro do app. O seu perfil tem um endereço curto (/daily/perfil).
export const PROFILE_PATH = "/daily/perfil";
export const EDIT_PROFILE_PATH = "/daily/perfil/editar";
export const CUSTOMIZE_PATH = "/daily/perfil/personalizar";

export function profileHref(username: string, viewerUsername?: string | null): string {
  return viewerUsername && username === viewerUsername ? PROFILE_PATH : `${PROFILE_PATH}/${encodeURIComponent(username)}`;
}

// Link para compartilhar (abre no app; com backend vira o endereço público closie.co/@).
export function shareableUrl(path: string): string {
  return `${window.location.origin}${path}`;
}

// Compartilha pelo menu do celular quando existe; no computador, copia o link.
// Devolve "copied" (copiou), "shared" (abriu o menu do sistema) ou "failed".
export async function shareLink(url: string, title: string): Promise<"copied" | "shared" | "failed"> {
  try {
    if (typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ title, url });
      return "shared";
    }
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch (error) {
    // Fechar o menu do sistema sem escolher nada não é erro
    if (error instanceof DOMException && error.name === "AbortError") return "shared";
    return "failed";
  }
}
