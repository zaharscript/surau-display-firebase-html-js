import { Quote } from "lucide-react";
import arabesque from "../../assets/arabesque.jpg";
import { getDailyHadis } from "../../util/getDailyHadis";

export function HadisCard() {
  const hadis = getDailyHadis();

  return (
    <div className="glass-panel relative overflow-hidden rounded-3xl p-5">
      <img
        src={arabesque}
        alt=""
        aria-hidden
        width={1024}
        height={1024}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />

      <div className="relative">
        <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.25em] text-gold uppercase">
          <Quote className="h-4 w-4" /> Hadis Hari Ini
        </p>

        <p
          className="mt-4 text-center font-arabic text-3xl leading-relaxed text-gold-soft"
          dir="rtl"
        >
          {hadis.arabic}
        </p>

        <p className="mt-4 font-serif text-lg leading-relaxed text-cream">
          &ldquo;{hadis.text}&rdquo;
        </p>

        <p className="mt-3 text-xs tracking-wide text-gold/80">
          {hadis.source}
        </p>
      </div>
    </div>
  );
}