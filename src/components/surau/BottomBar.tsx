import { CalendarDays, Clock } from "lucide-react";
import surauLogo from "@/assets/ssd-logo.jpg";
import { useNow } from "@/hooks/useNow";
import { formatHijri, formatMalayDate, pad } from "@/lib/surau";

const NOTICES = [
  "Sesiapa yang berhajat untuk mengadakan Doa Selamat atau Tahlil, sila maklumkan kepada Imam Surau atau AJK Surau.",
  "Sumbangan infak makanan amatlah dialu-alukan.",
  "Semoga menjadi amal jariah kita bersama.",
];

export function BottomBar() {
  const now = useNow();
  const h12 = now.getHours() % 12 || 12;
  const ampm = now.getHours() >= 12 ? "PM" : "AM";

  return (
    <footer className="rounded-3xl border border-gold/20 bg-cream/95 text-emerald-dark">
      <div className="grid grid-cols-1 items-center gap-4 px-5 py-4 sm:grid-cols-[auto_auto_minmax(0,1fr)]">
        <div className="flex items-center justify-center gap-3 text-center sm:justify-start sm:text-left">
          <img
            src={surauLogo}
            alt="Surau Seri Dahlia"
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
          <div>
            <p className="font-serif text-xl font-bold text-emerald-deep">Surau Seri Dahlia</p>
            <p className="text-[0.7rem] tracking-widest text-bronze uppercase">Bandar Seri Putra</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Clock className="h-7 w-7 text-emerald-deep" />
          <p className="text-3xl font-black text-emerald-deep tabular-nums xl:text-4xl">
            {h12}:{pad(now.getMinutes())}
            <span className="ml-1 text-base font-bold">:{pad(now.getSeconds())}</span>
            <span className="ml-2 text-lg font-bold">{ampm}</span>
          </p>
        </div>
        <div className="flex min-w-0 items-center justify-center gap-2 sm:justify-end">
          <CalendarDays className="h-5 w-5 shrink-0 text-emerald-deep" />
          <div className="min-w-0 text-center sm:text-right">
            <p className="truncate text-sm font-bold text-emerald-deep">{formatMalayDate(now)}</p>
            <p className="truncate text-sm text-bronze">{formatHijri(now)}</p>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-b-3xl border-t border-bronze/20 bg-emerald-deep py-2">
        <div className="animate-marquee-x flex w-max gap-12 pl-4 text-sm text-cream/90">
          {[...NOTICES, ...NOTICES].map((n, i) => (
            <span key={i} className="whitespace-nowrap">
              ✦ {n}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
