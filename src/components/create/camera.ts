"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

export type Facing = "user" | "environment";
export type CameraStatus = "starting" | "ready" | "denied" | "unavailable" | "busy" | "error";

// Câmera ao vivo no navegador (getUserMedia). Só fica ligada enquanto `active`: ao sair da aba,
// tirar a foto ou fechar, as trilhas são paradas (a luz da câmera apaga).
// Precisa de https (ou localhost); sem isso o status vira "unavailable" e a tela oferece a galeria.
export function useCamera(videoRef: RefObject<HTMLVideoElement | null>, active: boolean, facing: Facing) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; status: Exclude<CameraStatus, "starting"> } | null>(null);
  const key = `${facing}#${attempt}`;

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    let stream: MediaStream | null = null;
    let cancelled = false;
    const finish = (status: Exclude<CameraStatus, "starting">) => {
      if (!cancelled) setResult({ key, status });
    };

    if (!navigator.mediaDevices?.getUserMedia) {
      queueMicrotask(() => finish("unavailable"));
      return () => {
        cancelled = true;
      };
    }

    navigator.mediaDevices
      .getUserMedia({ audio: false, video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then((granted) => {
        if (cancelled) {
          granted.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = granted;
        if (video) {
          video.srcObject = granted;
          video.play().catch(() => {});
        }
        finish("ready");
      })
      .catch((error: unknown) => {
        const name = error instanceof DOMException ? error.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") finish("denied");
        else if (name === "NotFoundError" || name === "OverconstrainedError") finish("unavailable");
        else if (name === "NotReadableError" || name === "AbortError") finish("busy");
        else finish("error");
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      if (video) video.srcObject = null;
    };
  }, [active, facing, key, videoRef]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  const status: CameraStatus = active && result?.key === key ? result.status : "starting";
  return { status, retry };
}

// Tira a foto do que está na tela: recorta o quadro do vídeo na mesma proporção da área
// visível (o que você vê é o que sai) e espelha a câmera da frente, como na prévia.
export function captureFrame(video: HTMLVideoElement, mirror: boolean): Promise<File> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  const box = video.getBoundingClientRect();
  if (!width || !height || !box.width || !box.height) return Promise.reject(new Error("câmera sem imagem"));

  const target = box.width / box.height;
  let sw = width;
  let sh = height;
  if (width / height > target) sw = height * target;
  else sh = width / target;
  const sx = (width - sw) / 2;
  const sy = (height - sh) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("sem canvas"));
  if (mirror) {
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(new File([blob], "camera.jpg", { type: "image/jpeg" })) : reject(new Error("sem imagem"))), "image/jpeg", 0.92),
  );
}
