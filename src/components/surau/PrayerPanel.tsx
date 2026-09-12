import { useEffect, useState } from "react";
import { Moon } from "lucide-react";
import { fetchPrayerTimes, currentAndNext, countdownTo, addMinutes, type PrayerSlot } from "@/lib/prayer";
import { formatTime12h, pad } from "@/lib/surau";
import { useNow } from "@/hooks/useNow";

export function PrayerPanel() {
  const now = useNow();
  const [slots, setSlots] = useState<PrayerSlot[]>([]);

  useEffect(() => {
    let active = true;
    fetchPrayerTimes().then((s) => active && setSlots(s));
    const id = setInterval(
      () => {
        fetchPrayerTimes().then((s) => active && setSlots(s));
      },
      60 * 60 * 1000,
    );
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (!slots.length) {
    return <div className="glass-panel h-full min-h-40 animate-pulse rounded-2xl" />;
  }

  const { current, next } = currentAndNext(slots, now);
  const c = countdownTo(next.time, now);

  return (
    <div className="glass-panel relative overflow-hidden rounded-3xl p-5">
      <div className="pointer-events-none absolute inset-x-6 top-3 h-24 rounded-t-full border border-gold/25" />
      <div className="relative text-center">
        <p className="text-[0.7rem] font-semibold tracking-[0.3em] text-gold/80">SEKARANG</p>
        <h2 className="mt-1 text-3xl font-extrabold text-cream xl:text-4xl">{current.name}</h2>
        <p className="font-arabic text-xl text-gold-soft/80">{current.arabic}</p>
        <p className="mt-1 text-2xl font-bold text-gold xl:text-3xl">{formatTime12h(current.time)}</p>

        <div className="my-4 h-px bg-gold/20" />

        <p className="text-[0.7rem] font-semibold tracking-[0.3em] text-gold/80">SETERUSNYA</p>
        <h3 className="mt-1 text-2xl font-extrabold text-cream xl:text-3xl">{next.name}</h3>
        <p className="text-2xl font-bold text-gold">{formatTime12h(next.time)}</p>
        <p className="mt-1 text-xs text-cream/70">Iqamah {formatTime12h(addMinutes(next.time, 10))}</p>

        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-emerald-dark/60 px-4 py-1.5 text-sm font-semibold text-gold">
          <Moon className="h-4 w-4" />
          {pad(c.hours)}:{pad(c.minutes)}:{pad(c.seconds)}
        </div>
      </div>

      {/* <div className="mt-5 grid grid-cols-3 gap-2 lg:grid-cols-6 xl:grid-cols-3">
        {slots.map((s) => {
          const active = s.key === current.key;
          return (
            <div
              key={s.key}
              className={`rounded-xl border px-2 py-2 text-center transition-colors ${
                active
                  ? "border-gold/70 bg-gold/15 text-gold"
                  : "border-gold/15 bg-emerald-dark/40 text-cream/80"
              }`}
            >
              <p className="text-[0.65rem] font-semibold tracking-widest uppercase">{s.name}</p>
              <p className="text-sm font-bold">{formatTime12h(s.time)}</p>
            </div>
          );
        })}
      </div> */}
    </div>
  );
}
