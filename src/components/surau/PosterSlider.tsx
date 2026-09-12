import { useEffect, useState } from "react";
import quote from "@/assets/surau_poster/quote.jpg";
import qurban from "@/assets/surau_poster/Tabung_qurban27.jpeg";
import quote2 from "@/assets/surau_poster/quote_2.jpg";
import quote3 from "@/assets/surau_poster/quote_3.jpg";
import quote4 from "@/assets/surau_poster/quote_4.jpg";
import quote5 from "@/assets/surau_poster/quote_5.jpg";
import quote6 from "@/assets/surau_poster/quote_6.jpg";
import selawat from "@/assets/surau_poster/Selawat_bulanan.jpg";
import tausiah from "@/assets/surau_poster/tausiah_subuh.jpg";

const POSTERS = [
  { src: quote, alt: "Poster kata-kata hikmah" },
  { src: qurban, alt: "Poster tabung qurban" },
  { src: quote2, alt: "Poster kata-kata hikmah" },
  { src: quote3, alt: "Poster kata-kata hikmah" },
  { src: quote4, alt: "Poster kata-kata hikmah" },
  { src: tausiah, alt: "Poster tausiah subuh" },
  { src: quote5, alt: "Poster kata-kata hikmah" },
  { src: quote6, alt: "Poster kata-kata hikmah" },
  { src: selawat, alt: "Poster selawat bulanan" },
];

export function PosterSlider({ className = "" }: { className?: string }) {
  const [current, setCurrent] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((value) => {
        setPrevious(value);
        return (value + 1) % POSTERS.length;
      });
    }, 20_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-gold/20 bg-emerald-dark ${className}`}>
      {POSTERS.map((p, idx) => {
        const isCurrent = idx === current;
        const isPrevious = idx === previous;
        return (
          <img
            key={p.src}
            src={p.src}
            alt={p.alt}
            loading={idx === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[1500ms] ease-in-out ${
              isCurrent ? "translate-x-0" : isPrevious ? "-translate-x-full" : "translate-x-full"
            }`}
          />
        );
      })}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-dark/70 via-transparent to-transparent" />
    </div>
  );
}
