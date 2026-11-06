import { loadSocial, updateSocial } from "./storage";

// Denunciar um perfil. Por enquanto só fica registrado (a moderação vem com o backend).

export const USER_REPORT_REASONS = ["spam", "perfil_falso", "assedio", "conteudo_improprio", "outro"] as const;

export function hasReported(reporterId: string, targetId: string): boolean {
  return loadSocial().reports.some((item) => item.reporterId === reporterId && item.targetId === targetId);
}

// Uma denúncia por pessoa; nunca de si mesmo; só motivos da lista. Devolve se registrou agora.
export function reportUser(reporterId: string, targetId: string, reason: string, now = Date.now()): boolean {
  if (reporterId === targetId || !(USER_REPORT_REASONS as readonly string[]).includes(reason)) return false;
  if (hasReported(reporterId, targetId)) return false;
  updateSocial((state) => ({
    ...state,
    reports: [...state.reports, { reporterId, targetId, reason, createdAt: new Date(now).toISOString() }],
  }));
  return true;
}
