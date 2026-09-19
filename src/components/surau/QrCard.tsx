import qrImage from "@/assets/system/surau_qr.jpeg";

export function QrCard() {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-gold/25 bg-cream p-3 text-emerald-dark">
      <p className="text-xs font-extrabold tracking-widest text-emerald-deep uppercase">
        Imbas Untuk Menyumbang
      </p>

      <p className="text-[0.7rem] text-bronze">
        DuitNow QR
      </p>

      <div className="mt-1 grid aspect-square w-full max-w-[220px] place-items-center rounded-2xl border-2 border-dashed border-bronze/40 bg-white p-1.5">
        <img
          src={qrImage}
          alt="Kod QR sumbangan Surau Seri Dahlia"
          className="h-full w-full rounded-xl object-contain"
        />
      </div>

      <p className="mt-1 text-sm font-bold text-emerald-deep">
        Surau Seri Dahlia
      </p>
    </div>
  );
}