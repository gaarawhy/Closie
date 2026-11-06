// Ícones pequenos de mídia, no traço do menu (linha grossa, cantos redondos). Desenhos próprios.

type GlyphProps = { className?: string };

// Vários itens (álbum com várias fotos, dump com vários stories): dois retângulos lado a lado
export function StackIcon({ className }: GlyphProps) {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" className={className}>
      <rect x="3.5" y="5" width="7" height="14" rx="2" />
      <rect x="13.5" y="5" width="7" height="14" rx="2" />
    </svg>
  );
}

export function PlayIcon({ className }: GlyphProps) {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" className={className}>
      <path d="M8 5.5v13l10.5-6.5z" />
    </svg>
  );
}
