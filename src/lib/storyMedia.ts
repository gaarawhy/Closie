import type { StoryMedia } from "@/lib/stories";

// Preparar a mídia escolhida para publicar. Enquanto não há backend, ela vira data URL no
// localStorage (o navegador guarda só uns 5 MB), então a foto é reduzida e o vídeo é limitado.

const MB = 1024 * 1024;
export const STORY_IMAGE_MAX_BYTES = 15 * MB;
export const STORY_VIDEO_MAX_BYTES = 2 * MB;
const IMAGE_MAX_SIDE = 1080;

export function checkStoryFile(
  file: { type: string; size: number },
): { ok: true; kind: "image" | "video" } | { ok: false; message: string } {
  if (file.type.startsWith("image/")) {
    return file.size > STORY_IMAGE_MAX_BYTES
      ? { ok: false, message: "Essa foto é grande demais. Escolha uma de até 15 MB." }
      : { ok: true, kind: "image" };
  }
  if (file.type.startsWith("video/")) {
    return file.size > STORY_VIDEO_MAX_BYTES
      ? { ok: false, message: "Esse vídeo é grande demais para o modo de demonstração. Escolha um de até 2 MB." }
      : { ok: true, kind: "video" };
  }
  return { ok: false, message: "Escolha uma foto ou um vídeo." };
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Não deu pra ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

// Foto: lado maior até 1080 px, JPEG 0,8. Vídeo: como veio (já limitado em 2 MB).
// Só roda no navegador (canvas/FileReader).
export async function prepareStoryMedia(file: File): Promise<StoryMedia> {
  if (file.type.startsWith("video/")) return { type: "video", url: await readAsDataUrl(file) };
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não deu pra preparar a foto.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { type: "image", url: canvas.toDataURL("image/jpeg", 0.8) };
  } finally {
    bitmap.close();
  }
}
