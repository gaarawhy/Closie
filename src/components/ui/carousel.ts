// Qual foto de um carrossel (rolagem para o lado com encaixe) está na tela, pelo quanto rolou.
export function slideIndexFromScroll(scrollLeft: number, slideWidth: number, count: number): number {
  if (slideWidth <= 0 || count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(scrollLeft / slideWidth)));
}
