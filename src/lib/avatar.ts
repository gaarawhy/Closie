const MAX_AVATAR_BYTES = 10 * 1024 * 1024; // 10 MB
const AVATAR_SIZE = 512;

export type CropArea = { x: number; y: number; width: number; height: number };

// Valida antes de tentar abrir a foto (rápido, sem ler o arquivo).
export function checkAvatarFile(file: { type: string; size: number }): string | null {
  if (!file.type.startsWith("image/")) return "Escolha uma imagem (JPG, PNG ou WebP).";
  if (file.size > MAX_AVATAR_BYTES) return "Essa foto é grande demais. Escolha uma de até 10 MB.";
  return null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não deu pra abrir essa foto."));
    image.src = src;
  });
}

// Recorta o enquadramento escolhido (em pixels da foto original) num quadrado de 512px e
// devolve como data URL (WebP; PNG se o navegador não codificar WebP). Só roda no navegador
// (canvas), por isso não tem teste automatizado — o fluxo é conferido no navegador.
export async function cropAvatar(imageSrc: string, area: CropArea): Promise<string> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não deu pra preparar a foto.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  return canvas.toDataURL("image/webp", 0.85);
}
