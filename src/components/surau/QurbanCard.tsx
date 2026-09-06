import { Timer, ClipboardList, HandCoins, Beef } from "lucide-react";
import qurban from "@/assets/qurban.jpg";
import { useNow } from "@/hooks/useNow";

const TARGET = new Date(2027, 4, 17, 8, 0, 0); // Isnin, 17 Mei 2027

export function QurbanCard() {
  const now = useNow();
  const diff = Math.max(0, TARGET.getTime() - now.getTime());
  const total = Math.floor(diff / 1000);
  const parts = [
    { v: Math.floor(total / 86400), l: "HARI" },
    { v: Math.floor((total % 86400) / 3600), l: "JAM" },
    { v: Math.floor((total % 3600) / 60), l: "MINIT" },
    { v: total % 60, l: "SAAT" },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-cream text-emerald-dark">
      <img
        src={qurban}
        alt="Ternakan qurban di hadapan masjid"
        width={1024}
        height={768}
        loading="lazy"
        className="absolute inset-y-0 right-0 h-full w-1/2 object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/95 to-transparent" />
      <div className="relative p-6">
        <h2 className="font-serif text-3xl leading-tight font-bold text-emerald-deep xl:text-4xl">
          Tabung Qurban
          <br />
          Surau Seri Dahlia 2027
        </h2>
        <p className="mt-3 max-w-xs text-sm text-bronze">
          Kumpulkan simpanan dengan konsisten sebelum tibanya tarikh qurban bagi melancarkan urusan
          pembelian ternakan.
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/15 px-4 py-2 text-sm font-semibold text-emerald-deep">
          <Timer className="h-4 w-4 text-bronze" /> Countdown ke Hari Raya Qurban
        </div>

        <div className="mt-4 grid max-w-md grid-cols-4 overflow-hidden rounded-2xl border border-emerald-deep/20 bg-emerald-deep text-center">
          {parts.map((p) => (
            <div key={p.l} className="border-r border-gold/20 px-2 py-3 last:border-r-0">
              <p className="text-2xl font-black text-cream xl:text-3xl">{p.v}</p>
              <p className="text-[0.65rem] font-semibold tracking-widest text-gold">{p.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { Icon: ClipboardList, t: "Boleh buat simpanan pada bila-bila masa dalam tempoh 1 tahun." },
            { Icon: HandCoins, t: "Tidak terhad kepada berapa jumlah simpanan bagi satu-satu transaksi." },
            { Icon: Beef, t: "Anggaran harga lembu 1 bahagian pada tahun 2027 adalah RM900." },
          ].map(({ Icon, t }) => (
            <div key={t} className="flex min-w-0 gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold/50 bg-cream">
                <Icon className="h-4 w-4 text-bronze" />
              </span>
              <p className="text-xs leading-snug text-emerald-deep/80">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
