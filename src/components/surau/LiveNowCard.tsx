import { CalendarDays, Clock, Play } from "lucide-react";
import quranLantern from "@/assets/quran-lantern.jpg";
import { formatShortMalayDate, masaDisplay, timeRangeDisplay, type Activity } from "@/lib/surau";
import { getLiveSpeakerPhoto } from "@/lib/speakerPhoto";

export function LiveNowCard({ activity }: { activity: Activity | null }) {
  const speakerPhoto = activity ? getLiveSpeakerPhoto(activity.penceramah, activity.tajuk) : null;
  const heroImage = speakerPhoto ?? quranLantern;
  return (
    <div
      className={`glass-panel group relative isolate overflow-hidden rounded-3xl ${
        activity ? "lg:min-h-[clamp(24rem,44vh,36rem)]" : "lg:min-h-[clamp(14rem,25vh,22rem)]"
      }`}
    >
      <img
        src={heroImage}
        alt={activity ? activity.penceramah || activity.tajuk : "Suasana kelas Al-Quran di surau"}
        width={1024}
        height={768}
        className={`absolute inset-y-0 right-0 h-full w-full object-cover object-top transition-all duration-700 ${
          activity
            ? "opacity-100 saturate-110 contrast-[1.05] brightness-[1.04] lg:w-[48%] lg:min-w-[20rem]"
            : "opacity-45 saturate-90"
        }`}
      />
      <div className="absolute inset-y-0 right-0 w-[58%] bg-gradient-to-l from-emerald-dark/5 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,28,23,0.96)_0%,rgba(9,28,23,0.9)_18%,rgba(9,28,23,0.8)_30%,rgba(9,28,23,0.65)_46%,rgba(9,28,23,0.38)_60%,rgba(9,28,23,0.12)_76%,rgba(9,28,23,0)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-dark/70 via-transparent to-emerald-dark/10" />
      <div className="relative flex h-full min-h-[inherit] flex-col justify-center p-5 sm:p-6 lg:max-w-[68%] lg:p-[clamp(1.25rem,2vw,2.5rem)]">
        <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-destructive px-3 py-2 text-xs font-extrabold tracking-[0.12em] text-destructive-foreground shadow-lg shadow-destructive/20 sm:text-sm">
          <Play className="h-4 w-4 fill-current" /> LANGSUNG SEKARANG
        </span>

        {activity ? (
          <>
            <p className="mt-5 text-sm font-bold tracking-wide text-gold sm:text-base">
              {activity.masa || "Aktiviti Surau"}
            </p>
            <h2 className="mt-2 max-w-xl text-[clamp(1.7rem,3.2vw,3.7rem)] leading-[1.05] font-black text-cream uppercase">
              {activity.tajuk}
            </h2>
            <div className="mt-4">
              <p className="text-xs font-bold tracking-[0.16em] text-gold uppercase sm:text-sm">
                Imam / Surau
              </p>
              <p className="mt-1 text-base font-medium text-cream/95 sm:text-lg">
                {activity.penceramah || "-"}
              </p>
            </div>

            <div className="mt-5 flex w-fit flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-gold/35 bg-emerald-dark/75 px-3 py-2 text-xs font-semibold text-cream shadow-lg backdrop-blur-md sm:px-4 sm:text-sm">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-gold" />
                <span>{formatShortMalayDate(activity.tarikh).full}</span>
              </span>
              <span className="inline-flex items-center gap-2 border-l border-gold/25 pl-4">
                <Clock className="h-4 w-4 text-gold" />
                {timeRangeDisplay(activity)}
              </span>
            </div>
            <p className="mt-2 text-xs text-cream/65">{masaDisplay(activity)}</p>
          </>
        ) : (
          <>
            <h2 className="mt-5 text-2xl font-black text-cream uppercase xl:text-3xl">
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
