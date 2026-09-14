import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatShortMalayDate, timeRangeDisplay, type Activity } from "@/lib/surau";
import { getSpeakerPhoto } from "@/lib/speakerPhoto";

function Row({ a }: { a: Activity }) {
  const d = formatShortMalayDate(a.tarikh);
  const speakerPhoto = getSpeakerPhoto(a.penceramah, a.tajuk);
  return (
    <div className="grid grid-cols-[4.3rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-gold/15 bg-emerald-dark/55 px-3 py-2.5 transition-colors hover:border-gold/35 hover:bg-emerald-dark/75 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:px-4">
      <div className="shrink-0">
        <p className="text-xl leading-none font-extrabold text-gold sm:text-2xl">
          {timeRangeDisplay(a).split(" - ")[0].split(" ")[0]}
        </p>
        <p className="mt-1 text-[0.68rem] font-bold tracking-[0.16em] text-gold/80 uppercase">
          {timeRangeDisplay(a).split(" ").slice(-1)[0]}
        </p>
      </div>
      <div className="min-w-0">
        <h4 className="truncate text-sm font-extrabold text-cream uppercase sm:text-base">
          {a.tajuk}
          {a.is_batal && <span className="ml-2 text-xs text-destructive">(DITANGGUHKAN)</span>}
        </h4>
        <p className="truncate text-xs tracking-wide text-cream/60 uppercase sm:text-sm">{a.penceramah || "-"}</p>
        <p className="truncate text-xs text-cream/50">{a.nota || `${d.dd} ${d.mon}`}</p>
      </div>
      {speakerPhoto ? (
        <img
          src={speakerPhoto}
          alt={a.penceramah || a.tajuk}
          className="h-12 w-12 shrink-0 rounded-xl border border-gold/30 object-cover object-top sm:h-14 sm:w-14"
        />
      ) : (
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-sm font-bold text-gold sm:h-14 sm:w-14">
          {(a.penceramah || a.tajuk).slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function ActivityBoard({ activities }: { activities: Activity[] }) {
  const list = activities.slice(0, 12);
  const duration = Math.max(24, list.length * 6);

  return (
    <div className="glass-panel flex h-full min-h-0 flex-col rounded-3xl p-4 lg:p-[clamp(1rem,1.5vw,1.5rem)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold tracking-[0.25em] text-gold uppercase lg:text-base">Aktiviti Seterusnya</h3>
        <span className="text-[0.65rem] tracking-[0.18em] text-cream/45 uppercase">Jadual</span>
      </div>
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
      {/* <Link
        to="/admin/activities"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gold/25 bg-emerald-dark/45 py-2.5 text-xs font-bold text-cream transition-colors hover:border-gold/50 hover:bg-gold/10 sm:text-sm"
      >
        Lihat jadual penuh <ArrowRight className="h-4 w-4 text-gold" />
      </Link> */}
    </div>
  );
}
