import { Timer, ClipboardList, HandCoins, Beef, Coins, Users, Layers } from "lucide-react";
import qurban from "@/assets/qurban.jpg";
import arabesque from "@/assets/arabesque.jpg";
import { useNow } from "@/hooks/useNow";
import { useQurbanStats } from "@/hooks/useQurbanStats";

const TARGET = new Date(2027, 4, 17, 8, 0, 0); // Isnin, 17 Mei 2027

export function QurbanCard() {
  const now = useNow();
  const { stats, isLoading, hasError } = useQurbanStats();
  const diff = Math.max(0, TARGET.getTime() - now.getTime());
  const total = Math.floor(diff / 1000);
  const parts = [
    { v: Math.floor(total / 86400), l: "HARI" },
    { v: Math.floor((total % 86400) / 3600), l: "JAM" },
    { v: Math.floor((total % 3600) / 60), l: "MINIT" },
    { v: total % 60, l: "SAAT" },
  ];

  return (
    <div className="relative isolate overflow-hidden rounded-3xl border border-gold/45 bg-emerald-dark text-emerald-dark shadow-[0_22px_50px_-30px_oklch(0.1_0.03_166_/_0.95)]">
      <img
        src={qurban}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center opacity-55"
      />
      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(247,242,224,0.97)_0%,rgba(247,242,224,0.9)_39%,rgba(14,67,53,0.68)_73%,rgba(7,43,35,0.9)_100%)]" />
      <div className="absolute inset-0 bg-emerald-dark/15" />
      <img
        src={qurban}
        alt="Ternakan qurban di hadapan masjid"
        width={1024}
        height={768}
        loading="lazy"
        className="pointer-events-none absolute right-[-7%] top-[7%] z-10 h-[44%] w-[48%] object-cover object-[58%_34%] opacity-95 mix-blend-multiply sm:right-[-4%] sm:h-[51%] sm:w-[43%] lg:h-[57%] lg:w-[45%]"
      />

      <div className="relative z-20 p-4 sm:p-5">
        <div className="relative max-w-[72%] text-emerald-deep sm:max-w-[69%]">
          <p className="text-[0.58rem] font-extrabold tracking-[0.3em] text-bronze uppercase sm:text-[0.65rem]">
            Tabung Qurban
          </p>
          <h2 className="mt-1 font-serif text-2xl leading-tight font-bold sm:text-3xl xl:text-4xl">
            Surau Seri Dahlia <span className="text-bronze">2027</span>
          </h2>
          <p className="mt-2 text-[0.65rem] leading-relaxed text-emerald-deep/80 sm:text-xs">
            Kumpulkan simpanan dengan konsisten sebelum tibanya hari qurban bagi melancarkan urusan
            pembelian ternakan.
          </p>
        </div>

        <div className="absolute right-3 top-4 z-20 hidden w-[27%] text-emerald-deep sm:block">
          <span className="font-serif text-3xl leading-none text-bronze/70">“</span>
          <p className="text-[0.62rem] font-semibold leading-snug">
            Sesungguhnya sembahyangku, ibadahku, hidupku dan matiku hanyalah kerana Allah SWT.
          </p>
          <p className="mt-1 text-[0.52rem] font-semibold text-bronze">(Surah Al-An'am: 162)</p>
        </div>

        <div className="relative z-30 mt-4 rounded-2xl border border-gold/70 bg-emerald-dark/95 p-2.5 text-cream shadow-[0_8px_20px_-10px_oklch(0.1_0.03_166_/_0.9)] sm:mt-5 sm:p-3">
          <div className="flex items-center gap-2 text-[0.58rem] font-extrabold tracking-[0.13em] text-gold uppercase sm:text-[0.66rem]">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-gold/40 bg-gold/10">
              <Timer className="h-4 w-4" />
            </span>
            Countdown ke Hari Raya Qurban
          </div>
          <div className="mt-2 grid grid-cols-4 divide-x divide-gold/25 rounded-xl border border-gold/20 bg-emerald-deep/60">
            {parts.map((p) => (
              <div key={p.l} className="min-w-0 px-1.5 py-2 text-center sm:px-2">
                <p className="font-mono text-xl font-black leading-none text-cream sm:text-2xl xl:text-3xl">
                  {p.v}
                </p>
                <p className="mt-1 text-[0.5rem] font-bold tracking-[0.1em] text-gold sm:text-[0.58rem]">
                  {p.l}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-30 mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            {
              Icon: Coins,
              label: "Jumlah Simpanan Terkumpul",
              value: stats
                ? `RM ${stats.totalSavings.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "—",
            },
            {
              Icon: Users,
              label: "Jumlah Ahli Berdaftar",
              value: stats ? String(stats.registeredMembers) : "—",
            },
            {
              Icon: Layers,
              label: "Jumlah Bahagian Komited",
              value: stats ? `${stats.committedShares} Bahagian` : "—",
            },
          ].map(({ Icon, label, value }) => (
            <div
              key={label}
              className="min-w-0 rounded-2xl border border-gold/55 bg-cream/95 p-2.5 shadow-[0_8px_22px_-12px_oklch(0.1_0.03_166_/_0.75)] sm:p-3"
              aria-busy={isLoading}
            >
              <div className="flex items-start gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gold-soft/70 text-bronze">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="pt-1 text-[0.56rem] font-extrabold leading-tight tracking-[0.06em] text-emerald-deep uppercase">
                  {label}
                </p>
              </div>
              <p className="mt-2 truncate text-lg font-black tracking-tight text-emerald-deep sm:text-xl xl:text-2xl">
                {value}
              </p>
            </div>
          ))}
        </div>
        {hasError && (
          <p className="mt-2 text-[0.65rem] font-semibold text-bronze/80">
            Data sedang dikemaskini
          </p>
        )}

        <div className="relative z-30 mt-3 grid gap-2 rounded-2xl border border-gold/30 bg-cream/80 p-2.5 sm:grid-cols-3 sm:p-3">
          {[
            {
              Icon: ClipboardList,
              t: "Boleh buat simpanan pada bila-bila masa dalam tempoh 1 tahun.",
            },
            {
              Icon: HandCoins,
              t: "Tidak terhad kepada berapa jumlah simpanan bagi satu-satu transaksi.",
            },
            { Icon: Beef, t: "Anggaran harga lembu 1 bahagian pada tahun 2027 adalah RM900." },
          ].map(({ Icon, t }) => (
            <div key={t} className="flex min-w-0 gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-gold/55 bg-gold-soft/50">
                <Icon className="h-4 w-4 text-bronze" />
              </span>
              <p className="text-[0.62rem] leading-snug text-emerald-deep/85">{t}</p>
            </div>
          ))}
        </div>

        <div className="relative z-30 mt-3 overflow-hidden rounded-2xl border border-gold/70 bg-emerald-dark/95 px-3 py-3 text-cream sm:px-4 sm:py-3.5">
          <img
            src={arabesque}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-gold/20 via-gold to-gold/20" />
          <div className="relative flex gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-gold/45 bg-gold/10 text-gold">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <p className="font-serif text-lg font-bold text-gold sm:text-xl">
                Ingin Mendaftar Bahagian Qurban?
              </p>
              <p className="mt-1 text-[0.62rem] leading-relaxed text-cream/85 sm:text-[0.68rem]">
                Sila hubungi Haji Zaharin (Bendahari Surau) atau mana-mana AJK bertugas untuk
                menetapkan sasaran bulanan dan mendaftarkan butiran anda ke dalam pangkalan data
                selamat kami.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
