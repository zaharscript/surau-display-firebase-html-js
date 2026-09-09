export const MALAY_DAYS = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
export const MALAY_MONTHS = [
  "Januari",
  "Februari",
  "Mac",
  "April",
  "Mei",
  "Jun",
  "Julai",
  "Ogos",
  "September",
  "Oktober",
  "November",
  "Disember",
];

export type MasaOption = "subuh" | "maghrib" | "isyak" | "lain";

export interface Activity {
  id: string;
  tarikh: string;
  hari?: string;
  masa?: string;
  masa_option?: MasaOption;
  lain_from?: string;
  lain_to?: string;
  tajuk: string;
  penceramah?: string;
  nota?: string;
  is_batal?: boolean;
}

export const PRESET_TIMES: Record<Exclude<MasaOption, "lain">, { start: string; end: string }> = {
  subuh: { start: "06:00", end: "08:00" },
  maghrib: { start: "19:45", end: "21:45" },
  isyak: { start: "20:30", end: "22:30" },
};

export const MASA_LABELS: Record<MasaOption, string> = {
  subuh: "Subuh (6:00 AM)",
  maghrib: "Maghrib (7:45 PM)",
  isyak: "Selepas Isyak (8:30 PM)",
  lain: "Lain-lain",
};

export function formatTime12h(hhmm?: string) {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return "";
  const [hStr = "0", mStr = "00"] = hhmm.split(":");
  const h = Number(hStr);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mStr.padStart(2, "0")} ${ampm}`;
}

export function to24h(hour: string, minute: string, ampm: string) {
  if (!hour || !minute || !ampm) return "";
  let h = parseInt(hour, 10);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

export function from24h(t?: string) {
  if (!t || !/^\d{2}:\d{2}$/.test(t)) return null;
  const [hs = "0", ms = "00"] = t.split(":");
  let h = parseInt(hs, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return { hour12: String(h), minute: ms, ampm };
}


export function activityWindow(a: Activity) {
  const opt = a.masa_option ?? "maghrib";
  if (opt === "lain") {
    return { start: a.lain_from || "19:45", end: a.lain_to || "21:45" };
  }
  return PRESET_TIMES[opt];
}

export function activityStartDate(a: Activity) {
  const { start } = activityWindow(a);
  return activityDateAt(a.tarikh, start);
}

/** Returns a scheduled activity date in the Surau's Malaysia time zone (UTC+08:00). */
export function activityDateAt(tarikh: string, time: string) {
  const [y = 1970, m = 1, d = 1] = tarikh.split("-").map(Number);
  const [hh = 0, mm = 0] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh - 8, mm, 0, 0));
}

/** Activities are retained for two hours after their scheduled start. */
export function activityExpiresAt(tarikh: string, start: string) {
  return new Date(activityDateAt(tarikh, start).getTime() + 2 * 60 * 60 * 1000);
}

export function masaDisplay(a: Activity) {
  const opt = a.masa_option ?? "lain";
  if (opt !== "lain") return MASA_LABELS[opt];
  const from = formatTime12h(a.lain_from);
  const to = formatTime12h(a.lain_to);
  return from && to ? `${from} – ${to}` : from || a.masa || "-";
}

export function timeRangeDisplay(a: Activity) {
  const w = activityWindow(a);
  return `${formatTime12h(w.start)} - ${formatTime12h(w.end)}`;
}

/** Live now: from 1 hour before start until 1.5 hours after start. */
export function isLiveNow(a: Activity, now: Date) {
  if (a.is_batal) return false;
  const start = activityStartDate(a).getTime();
  return now.getTime() >= start - 60 * 60 * 1000 && now.getTime() <= start + 90 * 60 * 1000;
}

export function formatMalayDate(d: Date) {
  return `${MALAY_DAYS[d.getDay()]}, ${d.getDate()} ${MALAY_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShortMalayDate(dateStr: string) {
  const [y = 1970, m = 1, d = 1] = (dateStr || "").split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    day: MALAY_DAYS[date.getDay()],
    dd: String(date.getDate()).padStart(2, "0"),
    mon: (MALAY_MONTHS[date.getMonth()] ?? "").slice(0, 3).toUpperCase(),
    full: formatMalayDate(date),
  };
}

const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabiul Awal",
  "Rabiul Akhir",
  "Jamadil Awal",
  "Jamadil Akhir",
  "Rejab",
  "Syaaban",
  "Ramadan",
  "Syawal",
  "Zulkaedah",
  "Zulhijjah",
];

export function formatHijri(d: Date) {
  try {
    const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const month = parseInt(get("month"), 10);
    return `${get("day")} ${HIJRI_MONTHS[month - 1] ?? ""} ${get("year").replace(/\D/g, "")}`;
  } catch {
    return "";
  }
}

export function pad(n: number) {
  return String(n).padStart(2, "0");
}
