// Privacidade do perfil (diferente da visibilidade de cada dump, em mock.ts). Ainda sem tela:
// fica no padrão até existirem as configurações.
export type ProfilePrivacy = "public" | "private";

export const PROFILE_PRIVACY_OPTIONS: readonly ProfilePrivacy[] = ["public", "private"];

// Começa privado: combina com "seu daily, só pra quem você escolhe".
export const DEFAULT_PROFILE_PRIVACY: ProfilePrivacy = "private";

export const profilePrivacyLabels: Record<ProfilePrivacy, string> = {
  public: "Público",
  private: "Privado",
};
