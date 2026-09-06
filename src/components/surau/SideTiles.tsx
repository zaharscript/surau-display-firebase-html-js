import { Quote, QrCode } from "lucide-react";
import arabesque from "@/assets/arabesque.jpg";

export function HadisCard() {
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
        <p className="mt-4 text-center font-arabic text-3xl leading-relaxed text-gold-soft" dir="rtl">
          الرَّحْمَنُ الرَّحِيمُ
        </p>
        <p className="mt-4 font-serif text-lg leading-relaxed text-cream">
          &ldquo;Orang yang penyayang akan disayangi Allah.&rdquo;
        </p>
        <p className="mt-3 text-xs tracking-wide text-gold/80">HR. Tirmizi</p>
      </div>
    </div>
  );
}

export function QrCard() {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-gold/25 bg-cream p-5 text-emerald-dark">
      <p className="text-xs font-extrabold tracking-widest text-emerald-deep uppercase">
        Imbas Untuk Menyumbang
      </p>
      <p className="text-[0.7rem] text-bronze">DuitNow QR</p>
      <div className="mt-3 grid aspect-square w-full max-w-[190px] place-items-center rounded-2xl border-2 border-dashed border-bronze/40 bg-white">
        <QrCode className="h-20 w-20 text-emerald-deep/70" />
      </div>
      <p className="mt-3 text-sm font-bold text-emerald-deep">Surau Seri Dahlia</p>
    </div>
  );
}
