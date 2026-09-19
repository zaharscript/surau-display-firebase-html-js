import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  formatShortMalayDate,
  timeRangeDisplay,
  type Activity,
} from "@/lib/surau";
import { getSpeakerPhoto } from "@/lib/speakerPhoto";

function Row({ a }: { a: Activity }) {
  const d = formatShortMalayDate(a.tarikh);
  const speakerPhoto = getSpeakerPhoto(a.penceramah, a.tajuk);

  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-gold/15 bg-emerald-dark/55 px-4 py-5 transition-colors hover:border-gold/35 hover:bg-emerald-dark/75 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto] sm:gap-5 sm:px-5 sm:py-6">

      {/* TIME */}
      <div className="shrink-0">
        <p className="text-4xl leading-none font-extrabold text-gold sm:text-5xl">
          {timeRangeDisplay(a).split(" - ")[0].split(" ")[0]}
        </p>

        <p className="mt-2 text-base font-bold tracking-[0.16em] text-gold/80 uppercase sm:text-lg">
          {timeRangeDisplay(a).split(" ").slice(-1)[0]}
        </p>
      </div>

      {/* ACTIVITY INFORMATION */}
      <div className="min-w-0">
        <h4 className="truncate text-2xl font-extrabold leading-tight text-cream uppercase sm:text-3xl">
          {a.tajuk}

          {a.is_batal && (
            <span className="ml-2 text-sm font-bold text-destructive sm:text-base">
              (DITANGGUHKAN)
            </span>
          )}
        </h4>

        <p className="mt-2 truncate text-lg font-semibold tracking-wide text-cream/70 uppercase sm:text-xl">
          {a.penceramah || "-"}
        </p>

        <p className="mt-2 truncate text-base text-cream/60 sm:text-lg">
          {a.nota || `${d.dd} ${d.mon}`}
        </p>
      </div>

      {/* SPEAKER PHOTO */}
      {speakerPhoto ? (
        <img
          src={speakerPhoto}
          alt={a.penceramah || a.tajuk}
          className="h-24 w-24 shrink-0 rounded-2xl border border-gold/30 object-cover object-top sm:h-28 sm:w-28"
        />
      ) : (
        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border border-gold/30 bg-gold/10 text-base font-bold text-gold sm:h-28 sm:w-28 sm:text-lg">
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

      {/* SECTION HEADER */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-extrabold tracking-[0.25em] text-gold uppercase lg:text-lg">
          Aktiviti Seterusnya
        </h3>

        <span className="text-xs font-semibold tracking-[0.18em] text-cream/45 uppercase">
          Jadual
        </span>
      </div>

      {/* ACTIVITY LIST / MARQUEE */}
      <div className="mt-4 min-h-0 flex-1 overflow-hidden">
        {list.length === 0 ? (
          <p className="py-8 text-center text-base text-cream/60">
            Tiada aktiviti dijadualkan.
          </p>
        ) : list.length <= 3 ? (
          <div className="space-y-4">
            {list.map((a) => (
              <Row key={a.id} a={a} />
            ))}
          </div>
        ) : (
          <div
            className="animate-marquee-y space-y-4"
            style={{
              ["--marquee-duration" as string]: `${duration}s`,
            }}
          >
            {[...list, ...list].map((a, i) => (
              <Row key={`${a.id}-${i}`} a={a} />
            ))}
          </div>
        )}
      </div>

      {/* FULL SCHEDULE BUTTON
          Currently disabled/commented out.
          Preserved exactly as existing functionality. */}

      {/* <Link
        to="/admin/activities"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gold/25 bg-emerald-dark/45 py-2.5 text-xs font-bold text-cream transition-colors hover:border-gold/50 hover:bg-gold/10 sm:text-sm"
      >
        Lihat jadual penuh <ArrowRight className="h-4 w-4 text-gold" />
      </Link> */}
    </div>
  );
}
