export interface PrayerSlot {
  key: string;
  name: string;
  arabic: string;
  time: string; // HH:MM 24h
}

export const ZONE = "SGR01";

const FALLBACK: PrayerSlot[] = [
  { key: "fajr", name: "Subuh", arabic: "الفجر", time: "06:00" },
  { key: "syuruk", name: "Syuruq", arabic: "الشروق", time: "07:08" },
  { key: "dhuhr", name: "Zuhur", arabic: "الظهر", time: "13:17" },
  { key: "asr", name: "Asar", arabic: "العصر", time: "16:27" },
  { key: "maghrib", name: "Maghrib", arabic: "المغرب", time: "19:22" },
  { key: "isha", name: "Isyak", arabic: "العشاء", time: "20:32" },
];

const META: Record<string, { name: string; arabic: string }> = {
  fajr: { name: "Subuh", arabic: "الفجر" },
  syuruk: { name: "Syuruq", arabic: "الشروق" },
  dhuhr: { name: "Zuhur", arabic: "الظهر" },
  asr: { name: "Asar", arabic: "العصر" },
  maghrib: { name: "Maghrib", arabic: "المغرب" },
  isha: { name: "Isyak", arabic: "العشاء" },
};

function unixToHHMM(unix: number) {
  const d = new Date(unix * 1000);
  // API returns UTC unix for Malaysia local times; render in KL time.
  const fmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kuala_Lumpur",
  });
  return fmt.format(d);
}

export async function fetchPrayerTimes(): Promise<PrayerSlot[]> {
  try {
    const res = await fetch(`https://api.waktusolat.app/v2/solat/${ZONE}`);
    if (!res.ok) throw new Error("bad response");
    const json = (await res.json()) as {
      prayers: Array<Record<string, number>>;
    };
    const today = new Date().getDate();
    const day = json.prayers.find((p) => p["day"] === today) ?? json.prayers[0];
    if (!day) return FALLBACK;
    const slots = Object.keys(META)
      .map((key) => {
        const unix = day[key];
        if (!unix) return null;
        return { key, ...META[key], time: unixToHHMM(unix) } as PrayerSlot;
      })
      .filter(Boolean) as PrayerSlot[];
    return slots.length ? slots : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export function addMinutes(hhmm: string, mins: number) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function currentAndNext(slots: PrayerSlot[], now: Date) {
  const mins = now.getHours() * 60 + now.getMinutes();
  const toMin = (t: string) => {
    const [h = 0, m = 0] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const sorted = [...slots].sort((a, b) => toMin(a.time) - toMin(b.time));
  const fallback = FALLBACK[0] as PrayerSlot;
  let current: PrayerSlot = sorted[sorted.length - 1] ?? fallback;
  let next: PrayerSlot = sorted[0] ?? fallback;
  for (let i = 0; i < sorted.length; i++) {
    const slot = sorted[i];
    if (slot && toMin(slot.time) <= mins) {
      current = slot;
      next = sorted[(i + 1) % sorted.length] ?? fallback;
    }
  }
  return { current, next };
}

export function countdownTo(hhmm: string, now: Date) {
  const [h, m] = hhmm.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h ?? 0, m ?? 0, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  const diff = Math.max(0, target.getTime() - now.getTime());
  const totalSec = Math.floor(diff / 1000);
  return {
    hours: Math.floor(totalSec / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}
