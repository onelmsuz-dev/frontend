/** Figma'ning "tanlangan element" belgisi: ko'k ramka + 4 burchak dastagi. */
export function Selection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <span aria-hidden className="pointer-events-none absolute -inset-1.5 rounded-xl border-[1.5px] border-blue-600" />
      {["-left-2.5 -top-2.5", "-right-2.5 -top-2.5", "-bottom-2.5 -left-2.5", "-bottom-2.5 -right-2.5"].map((pos) => (
        <span key={pos} aria-hidden className={`pointer-events-none absolute ${pos} h-2 w-2 border-[1.5px] border-blue-600 bg-white`} />
      ))}
      {children}
    </div>
  );
}

/**
 * Imkoniyatlar taymeri: progress chizig'i (`home-progress`), halqa (`home-ring`) va
 * qo'lda tanlagandan keyingi 30s teskari sanoq halqasi (`home-ring-drain`).
 * Davomiylik inline `animationDuration` bilan beriladi. Harakatni kamaytirish yoqilgan
 * bo'lsa animatsiya o'chadi (avto-almashish ham to'xtaydi — u animatsiya tugashiga bog'liq).
 */
export function HomeKeyframes() {
  return (
    <style>{`
      @keyframes home-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      @keyframes home-ring { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
      @keyframes home-ring-drain { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 100; } }
      .home-progress { transform-origin: left center; animation: home-progress 3s linear forwards; }
      .home-ring { stroke-dashoffset: 100; animation: home-ring 3s linear forwards; }
      .home-ring-drain { animation: home-ring-drain 30s linear forwards; }
      @media (prefers-reduced-motion: reduce) { .home-progress, .home-ring, .home-ring-drain { animation: none; } }
    `}</style>
  );
}
