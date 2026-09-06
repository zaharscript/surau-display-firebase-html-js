import { ArrowRight } from "lucide-react";
import { formatShortMalayDate, timeRangeDisplay, type Activity } from "@/lib/surau";

function Row({ a }: { a: Activity }) {
  const d = formatShortMalayDate(a.tarikh);
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-gold/12 bg-emerald-dark/50 px-3 py-3">
      <div className="w-16 shrink-0 text-center">
        <p className="text-lg leading-none font-extrabold text-gold">{timeRangeDisplay(a).split(" - ")[0]}</p>
        <p className="mt-1 text-[0.65rem] tracking-widest text-cream/60 uppercase">
          {d.dd} {d.mon}
        </p>
      </div>
      <div className="min-w-0">
        <h4 className="truncate text-base font-extrabold text-cream uppercase">
          {a.tajuk}
          {a.is_batal && <span className="ml-2 text-xs text-destructive">(DITANGGUHKAN)</span>}
        </h4>
        <p className="truncate text-xs tracking-wide text-cream/60 uppercase">{a.penceramah || "-"}</p>
        {a.nota && <p className="truncate text-xs text-cream/50">{a.nota}</p>}
      </div>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-sm font-bold text-gold">
        {(a.penceramah || a.tajuk).slice(0, 2).toUpperCase()}
      </div>
    </div>
  );
}

export function ActivityBoard({ activities }: { activities: Activity[] }) {
  const list = activities.slice(0, 12);
  const duration = Math.max(24, list.length * 6);

  return (
    <div className="glass-panel flex h-full min-h-0 flex-col rounded-3xl p-4">
      <h3 className="text-sm font-extrabold tracking-[0.25em] text-gold uppercase">Aktiviti Seterusnya</h3>
      <div className="mt-3 min-h-0 flex-1 overflow-hidden">
        {list.length === 0 ? (
          <p className="py-8 text-center text-sm text-cream/60">Tiada aktiviti dijadualkan.</p>
        ) : list.length <= 3 ? (
          <div className="space-y-3">
            {list.map((a) => (
              <Row key={a.id} a={a} />
            ))}
          </div>
        ) : (
          <div
            className="animate-marquee-y space-y-3"
            style={{ ["--marquee-duration" as string]: `${duration}s` }}
          >
            {[...list, ...list].map((a, i) => (
              <Row key={`${a.id}-${i}`} a={a} />
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-gold/20 bg-emerald-dark/50 py-3 text-sm font-semibold text-cream">
        Lihat jadual penuh <ArrowRight className="h-4 w-4 text-gold" />
      </div>
    </div>
  );
}
