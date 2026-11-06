// Tokens da identidade Closie (branco + vermelho, com cinzas quentes nas superfícies).
// Fonte única das cores: usados no tailwind.config.mts e onde for preciso o valor cru (ex.: themeColor, QR code).
export const colors = {
  bg: "#FFFFFF",
  surface: "#FAFAFA",
  // Cinza quente: bloco do logo, painel do QR code, cartões de prévia
  panel: "#F1F1EC",
  // Fundo do botão que ainda não tem o que enviar (ex.: "Entrar" com os campos vazios)
  "panel-strong": "#E5E5E0",
  border: "#EDEDED",
  // Contorno dos campos e botões claros (contraste 3:1 com o branco)
  "border-strong": "#91918C",
  text: "#1A1A1A",
  muted: "#62625D",
  red: "#D62828",
  "red-hover": "#B01E1E",
  "red-soft": "#FDECEC",
  "on-red": "#FFFFFF",
  // Links de ação secundária (ex.: "Esqueceu sua senha?")
  link: "#2B4FD6",
  // Confirmações (ex.: "@ disponível")
  success: "#0F7B3F",
} as const;
