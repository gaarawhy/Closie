import { POST_PHOTOS_MAX, type NewPhoto } from "@/lib/posts";

// Preparar as fotos de um novo momento. Enquanto não há backend elas viram data URL no
// localStorage (o navegador guarda só uns 5 MB), então cada foto é reduzida antes de salvar.

const MB = 1024 * 1024;
export const POST_PHOTO_MAX_BYTES = 15 * MB;
const MAX_SIDE = 960;
const QUALITY = 0.78;

// Confere o que a pessoa escolheu antes de preparar (current = quantas já estão no álbum).
export function checkPostFiles(files: { type: string; size: number }[], current: number): string | null {
  if (files.some((file) => !file.type.startsWith("image/"))) return "Um momento junta só fotos.";
  if (files.some((file) => file.size > POST_PHOTO_MAX_BYTES)) return "Cada foto pode ter até 15 MB.";
  if (current + files.length > POST_PHOTOS_MAX) return `Um momento tem até ${POST_PHOTOS_MAX} fotos.`;
  return null;
}

// Lado maior até 960 px, JPEG 0,78; guarda o tamanho para montar o mosaico. Só no navegador.
export function preparePostPhoto(file: File): Promise<NewPhoto> {
  return shrinkPhoto(file, MAX_SIDE, QUALITY);
}

// Capa do perfil: mais larga (até 1600 px), porque ocupa a largura toda no computador.
export function prepareCoverPhoto(file: File): Promise<NewPhoto> {
  return shrinkPhoto(file, 1600, 0.8);
}

async function shrinkPhoto(file: File, maxSide: number, quality: number): Promise<NewPhoto> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não deu pra preparar a foto.");
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);
    return { url: canvas.toDataURL("image/jpeg", quality), width, height };
  } finally {
    bitmap.close();
  }
}
