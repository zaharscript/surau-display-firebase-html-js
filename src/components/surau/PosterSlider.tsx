import { useEffect, useState } from "react";
import qurban from "@/assets/qurban.jpg";
import quran from "@/assets/quran-lantern.jpg";
import arabesque from "@/assets/arabesque.jpg";

const POSTERS = [
  { src: quran, alt: "Poster kelas Al-Quran" },
  { src: qurban, alt: "Poster tabung qurban" },
  { src: arabesque, alt: "Poster hiasan arabesk" },
];

export function PosterSlider({ className = "" }: { className?: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % POSTERS.length), 9000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-gold/20 ${className}`}>
      {POSTERS.map((p, idx) => (
        <img
          key={p.src}
          src={p.src}
          alt={p.alt}
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            idx === i ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-dark/80 to-transparent" />
    </div>
  );
}
