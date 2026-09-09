import { CalendarDays, Clock, Radio } from "lucide-react";
import quranLantern from "@/assets/quran-lantern.jpg";
import { formatShortMalayDate, masaDisplay, timeRangeDisplay, type Activity } from "@/lib/surau";
import { getSpeakerPhoto } from "@/lib/speakerPhoto";

export function LiveNowCard({ activity }: { activity: Activity | null }) {
  const speakerPhoto = activity ? getSpeakerPhoto(activity.penceramah, activity.tajuk) : null;
  return (
    <div className="glass-panel relative overflow-hidden rounded-3xl">
      <img
        src={quranLantern}
        alt="Suasana kelas Al-Quran di surau"
        width={1024}
        height={768}
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-dark via-emerald-dark/85 to-transparent" />
      <div className="relative p-6">
        <span className="inline-flex items-center gap-2 rounded-lg bg-destructive px-3 py-1.5 text-xs font-extrabold tracking-widest text-destructive-foreground">
          <Radio className="h-4 w-4" /> LANGSUNG SEKARANG
        </span>

        {activity ? (
          <>
            <p className="mt-4 text-sm font-semibold text-gold">{activity.penceramah || "Aktiviti Surau"}</p>
            <h2 className="mt-1 max-w-md text-2xl leading-tight font-black text-cream uppercase xl:text-4xl">
              {activity.tajuk}
            </h2>
            <div className="mt-3 flex items-center gap-3">
              {speakerPhoto && (
                <img
                  src={speakerPhoto}
                  alt={activity.penceramah || activity.tajuk}
                  className="h-14 w-14 rounded-full border-2 border-gold/70 object-cover object-top"
                />
              )}
              <div>
                <p className="text-xs font-bold tracking-widest text-gold/80 uppercase">Imam / Surau</p>
                <p className="text-cream/90">{activity.penceramah || "-"}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl border border-gold/25 bg-emerald-dark/70 px-3 py-2 text-sm text-cream">
                <CalendarDays className="h-4 w-4 text-gold" />
                {formatShortMalayDate(activity.tarikh).full}
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-gold/25 bg-emerald-dark/70 px-3 py-2 text-sm text-cream">
                <Clock className="h-4 w-4 text-gold" />
                {timeRangeDisplay(activity)}
              </span>
            </div>
            <p className="mt-2 text-xs text-cream/60">{masaDisplay(activity)}</p>
          </>
        ) : (
          <>
            <h2 className="mt-4 text-2xl font-black text-cream uppercase xl:text-3xl">
              Tiada aktiviti berlangsung
            </h2>
            <p className="mt-2 max-w-sm text-sm text-cream/70">
              Aktiviti akan dipaparkan di sini bermula 1 jam sebelum waktu mula.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
