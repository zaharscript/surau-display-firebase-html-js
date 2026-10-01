import { useEffect, useState } from "react";
import quote from "@/assets/surau_poster/quote.jpg";
import qurban from "@/assets/surau_poster/Tabung_qurban27.jpeg";
import quote2 from "@/assets/surau_poster/quote_2.jpg";
import quote3 from "@/assets/surau_poster/quote_3.jpg";
import quote4 from "@/assets/surau_poster/quote_4.jpg";
import quote5 from "@/assets/surau_poster/quote_5.jpg";
import quote6 from "@/assets/surau_poster/quote_6.jpg";
import mesyuarat from "@/assets/surau_poster/mesyuarat.jpeg";
import tahlil from "@/assets/surau_poster/jemputan_tahlil.jpeg";
// import selawat from "@/assets/surau_poster/Selawat_bulanan.jpg";
import { subscribeUploadedPosters, type UploadedPoster } from "@/lib/posterStorage";

const PRESET_POSTERS = [
  { src: quote, alt: "Poster kata-kata hikmah" },
  { src: qurban, alt: "Poster tabung qurban" },
  { src: quote2, alt: "Poster kata-kata hikmah" },
  { src: quote3, alt: "Poster kata-kata hikmah" },
  { src: quote4, alt: "Poster kata-kata hikmah" },
  { src: quote5, alt: "Poster kata-kata hikmah" },
  { src: quote6, alt: "Poster kata-kata hikmah" },
];

export function PosterSlider({ className = "" }: { className?: string }) {
  const [current, setCurrent] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [uploadedPosters, setUploadedPosters] = useState<UploadedPoster[]>([]);
  const posterCount = PRESET_POSTERS.length + uploadedPosters.length;

  useEffect(() => {
    return subscribeUploadedPosters(setUploadedPosters, (error) => {
      console.error("Failed to load uploaded posters; using preset posters:", error);
      setUploadedPosters([]);
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((value) => {
        setPrevious(value);
        return (value + 1) % posterCount;
      });
    }, 20_000);
    return () => clearInterval(id);
  }, [posterCount]);

  const allPosters = [
    ...PRESET_POSTERS,
    ...uploadedPosters.map((poster) => ({
      src: poster.downloadUrl,
      alt: poster.originalName,
    })),
  ];
  const currentIndex = current % allPosters.length;
  const previousIndex = previous === null ? null : previous % allPosters.length;

  return (
    <div
      className={`relative h-full min-h-0 w-full overflow-hidden rounded-3xl border border-gold/20 bg-emerald-dark ${className}`}
    >
      {allPosters.map((p, idx) => {
        const isCurrent = idx === currentIndex;
        const isPrevious = idx === previousIndex;
        return (
          <img
            key={idx < PRESET_POSTERS.length ? `preset-${idx}` : p.src}
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
