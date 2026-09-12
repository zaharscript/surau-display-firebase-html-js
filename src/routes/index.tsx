import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useActivities } from "@/hooks/useActivities";
import { useNow } from "@/hooks/useNow";
import { isLiveNow, activityStartDate } from "@/lib/surau";
import { PrayerPanel } from "@/components/surau/PrayerPanel";
import { LiveNowCard } from "@/components/surau/LiveNowCard";
import { ActivityBoard } from "@/components/surau/ActivityBoard";
import { QurbanCard } from "@/components/surau/QurbanCard";
import { HadisCard, QrCard } from "@/components/surau/SideTiles";
import { PosterSlider } from "@/components/surau/PosterSlider";
import { BottomBar } from "@/components/surau/BottomBar";
import arabesque from "@/assets/arabesque.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paparan Digital — Surau Seri Dahlia" },
      {
        name: "description",
        content:
          "Waktu solat SGR01, jadual aktiviti mingguan, tabung qurban dan hadis harian Surau Seri Dahlia, Bandar Seri Putra.",
      },
      { property: "og:title", content: "Paparan Digital — Surau Seri Dahlia" },
      {
        property: "og:description",
        content: "Waktu solat, jadual aktiviti dan tabung qurban Surau Seri Dahlia.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const now = useNow(30_000);
  const { activities = [] } = useActivities("asc"); // <-- Default fallback array

  const retained = (activities ?? []).filter(
    (a) => activityStartDate(a).getTime() + 2 * 60 * 60 * 1000 > now.getTime(),
  );
  const active = retained.filter((a) => !a?.is_batal);
  const live = active.find((a) => isLiveNow(a, now)) ?? null;
  const upcoming = retained
    .filter((a) => activityStartDate(a).getTime() + 90 * 60 * 1000 >= now.getTime())
    .sort((a, b) => activityStartDate(a).getTime() - activityStartDate(b).getTime());
  return (
    <main className="relative min-h-screen overflow-hidden">
      <img
        src={arabesque}
        alt=""
        aria-hidden
        className="fixed inset-0 h-full w-full object-cover opacity-15"
      />
      <div className="fixed inset-0 bg-gradient-to-br from-background via-emerald-dark to-background" />

      <div className="relative mx-auto flex min-h-screen w-full flex-col gap-4 p-3 sm:p-4 lg:h-screen lg:max-w-none lg:gap-[clamp(0.75rem,1.25vw,1.5rem)] lg:p-[clamp(1rem,2.5vw,3rem)]">
        <h1 className="sr-only">Paparan Digital Surau Seri Dahlia</h1>

        <div className="grid flex-1 grid-cols-1 gap-4 lg:min-h-0 lg:grid-cols-12 lg:gap-[clamp(0.75rem,1.25vw,1.5rem)]">
          <section className="flex flex-col gap-4 lg:col-span-5 lg:min-h-0">
            <LiveNowCard activity={live} />
            <div className="min-h-[22rem] flex-1 lg:min-h-0">
              <ActivityBoard activities={upcoming.length ? upcoming : retained} />
            </div>
          </section>

          <section className="flex flex-col gap-4 lg:col-span-4 lg:min-h-0">
            <div className="flex-1 lg:min-h-0">
              <QurbanCard />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:h-[min(30%,15rem)] lg:min-h-44">
              <div className="hidden rounded-3xl border border-gold/20 bg-emerald-dark/60 p-5 sm:block">
                <p className="text-xs font-extrabold tracking-[0.25em] text-gold uppercase">Cahaya Islam</p>
                <p className="mt-5 font-serif text-3xl leading-tight text-cream xl:text-4xl">
                  Ilmu menerangi hati dan menguatkan ummah.
                </p>
              </div>
              <QrCard />
            </div>
          </section>

          <section className="flex flex-col gap-4 lg:col-span-3 lg:min-h-0">
            <div className="lg:flex-[1.2] lg:min-h-0">
              <PrayerPanel />
            </div>
            <div className="lg:flex-1 lg:min-h-0">
              <HadisCard />
            </div>
            <PosterSlider className="aspect-[4/3] lg:flex-1 lg:aspect-auto lg:min-h-48" />
          </section>
        </div>

        <BottomBar />

        <div className="flex justify-center pb-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold text-gold/80 transition-colors hover:bg-gold/10 lg:hidden"
          >
            <LogIn className="h-3.5 w-3.5" /> Log Masuk Pentadbir
          </Link>
        </div>
      </div>
    </main>
  );
}
