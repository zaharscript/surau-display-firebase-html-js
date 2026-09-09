import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { CheckCircle2, CircleAlert, ListChecks, LoaderCircle, LogOut } from "lucide-react";
import { getFirebase } from "@/lib/firebase";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useActivities } from "@/hooks/useActivities";
import { useNow } from "@/hooks/useNow";
import {
  MALAY_DAYS,
  MASA_LABELS,
  PRESET_TIMES,
  activityExpiresAt,
  activityStartDate,
  formatShortMalayDate,
  from24h,
  masaDisplay,
  to24h,
  type Activity,
  type MasaOption,
} from "@/lib/surau";

export const Route = createFileRoute("/admin/activities")({
  head: () => ({
    meta: [
      { title: "Pengurusan Aktiviti — Surau Seri Dahlia" },
      { name: "description", content: "Daftar, kemaskini dan tangguh aktiviti Surau Seri Dahlia." },
      { property: "og:title", content: "Pengurusan Aktiviti — Surau Seri Dahlia" },
      { property: "og:description", content: "Portal pentadbir aktiviti Surau Seri Dahlia." },
    ],
  }),
  component: AdminActivities,
});

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ["00", "15", "30", "45"];
const IDLE_MS = 15 * 60 * 1000;

type SyncState = "synced" | "syncing" | "error";

function AdminActivities() {
  const navigate = useNavigate();
  const { user, ready } = useAuthUser();
  const { activities, error } = useActivities("desc");
  const now = useNow(30_000);
  const currentActivities = activities.filter(
    (activity) => activityStartDate(activity).getTime() + 2 * 60 * 60 * 1000 > now.getTime(),
  );

  const [sync, setSync] = useState<SyncState>("synced");
  const [editId, setEditId] = useState<string | null>(null);
  const [tarikh, setTarikh] = useState("");
  const [masaOption, setMasaOption] = useState<MasaOption>("subuh");
  const [tajuk, setTajuk] = useState("");
  const [penceramah, setPenceramah] = useState("");
  const [nota, setNota] = useState("");
  const [from, setFrom] = useState({ hour12: "8", minute: "00", ampm: "PM" });
  const [to, setTo] = useState({ hour12: "10", minute: "00", ampm: "PM" });
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login", replace: true });
  }, [ready, user, navigate]);

  useEffect(() => {
    if (error) setSync("error");
  }, [error]);

  // Idle auto logout (15 minutes)
  useEffect(() => {
    if (!user) return;
    const logout = async () => {
      const { auth } = await getFirebase();
      await signOut(auth);
      navigate({ to: "/login", replace: true });
    };
    const reset = () => {
      if (idleRef.current) clearTimeout(idleRef.current);
      idleRef.current = setTimeout(logout, IDLE_MS);
    };
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (idleRef.current) clearTimeout(idleRef.current);
    };
  }, [user, navigate]);

  const hari = useMemo(() => {
    if (!tarikh) return "";
    const [y = 1970, m = 1, d = 1] = tarikh.split("-").map(Number);
    return MALAY_DAYS[new Date(y, m - 1, d).getDay()] ?? "";
  }, [tarikh]);

  function resetForm() {
    setEditId(null);
    setTarikh("");
    setMasaOption("subuh");
    setTajuk("");
    setPenceramah("");
    setNota("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tarikh || !tajuk.trim()) return;

    const lainFrom = to24h(from.hour12, from.minute, from.ampm);
    const lainTo = to24h(to.hour12, to.minute, to.ampm);
    const preset = masaOption === "lain" ? null : PRESET_TIMES[masaOption];
    const startTime = masaOption === "lain" ? lainFrom : (preset?.start ?? "");

    const payload = {
      tarikh,
      hari,
      masa: masaOption === "lain" ? lainFrom : MASA_LABELS[masaOption],
      masa_option: masaOption,
      lain_from: masaOption === "lain" ? lainFrom : (preset?.start ?? ""),
      lain_to: masaOption === "lain" ? lainTo : (preset?.end ?? ""),
      // Firestore TTL removes this record after its scheduled start time + 2 hours.
      expiresAt: Timestamp.fromDate(activityExpiresAt(tarikh, startTime)),
      tajuk: tajuk.trim().slice(0, 160),
      penceramah: penceramah.trim().slice(0, 120),
      nota: nota.trim().slice(0, 400),
      updatedAt: serverTimestamp(),
    };

    try {
      setSync("syncing");
      const { db } = await getFirebase();
      if (editId) {
        await updateDoc(doc(db, "activities", editId), payload);
      } else {
        await addDoc(collection(db, "activities"), {
          ...payload,
          is_batal: false,
          createdAt: serverTimestamp(),
        });
      }
      setSync("synced");
      resetForm();
    } catch {
      setSync("error");
    }
  }

  function handleEdit(a: Activity) {
    setEditId(a.id);
    setTarikh(a.tarikh);
    setMasaOption(a.masa_option ?? "lain");
    setTajuk(a.tajuk ?? "");
    setPenceramah(a.penceramah ?? "");
    setNota(a.nota ?? "");
    const f = from24h(a.lain_from);
    const t = from24h(a.lain_to);
    if (f) setFrom(f);
    if (t) setTo(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleToggleBatal(a: Activity) {
    const next = !a.is_batal;
    if (!confirm(`Adakah anda pasti mahu ${next ? "menangguhkan" : "mengaktifkan semula"} aktiviti ini?`))
      return;
    try {
      setSync("syncing");
      const { db } = await getFirebase();
      await updateDoc(doc(db, "activities", a.id), { is_batal: next, updatedAt: serverTimestamp() });
      setSync("synced");
    } catch {
      setSync("error");
    }
  }

  async function handleDelete(a: Activity) {
    if (!confirm(`Padam aktiviti "${a.tajuk}"?`)) return;
    if (!confirm("Tindakan ini tidak boleh dibatalkan. Teruskan?")) return;
    try {
      setSync("syncing");
      const { db } = await getFirebase();
      await deleteDoc(doc(db, "activities", a.id));
      setSync("synced");
    } catch {
      setSync("error");
    }
  }

  async function handleSignOut() {
    const { auth } = await getFirebase();
    await signOut(auth);
    navigate({ to: "/login", replace: true });
  }

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-gold" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-emerald-dark to-background px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-serif text-2xl font-bold text-gold">Pendaftaran Aktiviti</h1>
            <p className="truncate text-sm text-cream/70">Surau Seri Dahlia</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SyncBadge state={sync} />
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 px-3 py-1.5 text-xs text-cream hover:bg-gold/10"
            >
              <LogOut className="h-3.5 w-3.5" /> Log Keluar
            </button>
          </div>
        </header>

        <Link to="/" className="inline-block text-sm text-cream/70 hover:text-gold">
          ← Kembali Ke Laman Utama
        </Link>

        <form onSubmit={handleSubmit} className="glass-panel space-y-4 rounded-3xl p-5">
          <div>
            <label htmlFor="tarikh" className="text-sm font-semibold text-cream">
              Tarikh Aktiviti
            </label>
            <input
              id="tarikh"
              type="date"
              required
              value={tarikh}
              onChange={(e) => setTarikh(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gold/30 bg-emerald-dark/60 px-3 py-2.5 text-cream focus:outline-none"
            />
            <p className="mt-1 text-xs text-gold/80">Hari: {hari || "-"}</p>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-cream">Masa Aktiviti</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(Object.keys(MASA_LABELS) as MasaOption[]).map((opt) => (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                    masaOption === opt
                      ? "border-gold/70 bg-gold/15 text-gold"
                      : "border-gold/20 bg-emerald-dark/50 text-cream/80"
                  }`}
                >
                  <input
                    type="radio"
                    name="masaOption"
                    value={opt}
                    checked={masaOption === opt}
                    onChange={() => setMasaOption(opt)}
                    className="accent-[oklch(0.78_0.132_89)]"
                  />
                  {MASA_LABELS[opt]}
                </label>
              ))}
            </div>
          </fieldset>

          {masaOption === "lain" && (
            <div className="grid gap-3 rounded-2xl border border-gold/20 bg-emerald-dark/40 p-3 sm:grid-cols-2">
              <TimePicker label="Dari" value={from} onChange={setFrom} />
              <TimePicker label="Hingga" value={to} onChange={setTo} />
            </div>
          )}

          <Field label="Tajuk Aktiviti" id="tajuk">
            <input
              id="tajuk"
              required
              maxLength={160}
              value={tajuk}
              onChange={(e) => setTajuk(e.target.value)}
              placeholder="Masukkan tajuk program"
              className="w-full rounded-xl border border-gold/30 bg-emerald-dark/60 px-3 py-2.5 text-cream placeholder:text-cream/40 focus:outline-none"
            />
          </Field>

          <Field label="Penceramah / Peserta" id="penceramah">
            <input
              id="penceramah"
              maxLength={120}
              value={penceramah}
              onChange={(e) => setPenceramah(e.target.value)}
              placeholder="Nama Ustaz / Penceramah"
              className="w-full rounded-xl border border-gold/30 bg-emerald-dark/60 px-3 py-2.5 text-cream placeholder:text-cream/40 focus:outline-none"
            />
          </Field>

          <Field label="Nota (Pilihan)" id="nota">
            <input
              id="nota"
              maxLength={400}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ctth: Sila bawa sejadah / Jamuan disediakan"
              className="w-full rounded-xl border border-gold/30 bg-emerald-dark/60 px-3 py-2.5 text-cream placeholder:text-cream/40 focus:outline-none"
            />
          </Field>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="gold-btn flex-1 rounded-xl py-3">
              {editId ? "Simpan Kemaskini" : "Daftar Aktiviti"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-gold/30 px-4 py-3 text-sm text-cream hover:bg-gold/10"
              >
                Batal Edit
              </button>
            )}
          </div>
        </form>

        <section className="space-y-3">
          <h2 className="inline-flex items-center gap-2 text-lg font-bold text-gold">
            <ListChecks className="h-5 w-5" /> Senarai Aktiviti Terkini
          </h2>
          {currentActivities.length === 0 && <p className="text-sm text-cream/60">Tiada aktiviti dijumpai.</p>}
          {currentActivities.map((a) => {
            const d = formatShortMalayDate(a.tarikh);
            return (
              <article key={a.id} className="glass-panel rounded-2xl p-4">
                <h3 className="font-extrabold text-cream uppercase">
                  {a.tajuk}
                  {a.is_batal && <span className="ml-2 text-xs text-destructive">(DITANGGUHKAN)</span>}
                </h3>
                <p className="mt-1 text-sm text-cream/75">
                  <strong className="text-gold">Tarikh:</strong> {a.tarikh} ({d.day})
                </p>
                <p className="text-sm text-cream/75">
                  <strong className="text-gold">Masa:</strong> {masaDisplay(a)}
                </p>
                <p className="text-sm text-cream/75">
                  <strong className="text-gold">Penceramah:</strong> {a.penceramah || "-"}
                </p>
                {a.nota && (
                  <p className="text-sm text-cream/75">
                    <strong className="text-gold">Nota:</strong> {a.nota}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleToggleBatal(a)}
                    className="rounded-lg border border-gold/30 bg-emerald-dark/60 px-3 py-1.5 text-xs font-semibold text-cream hover:bg-gold/10"
                  >
                    {a.is_batal ? "Aktifkan Semula" : "Tangguh Aktiviti"}
                  </button>
                  <button
                    onClick={() => handleEdit(a)}
                    className="gold-btn rounded-lg px-4 py-1.5 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    className="rounded-lg border border-destructive/50 bg-destructive/15 px-3 py-1.5 text-xs font-semibold text-cream hover:bg-destructive/30"
                  >
                    Padam
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-cream">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function TimePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { hour12: string; minute: string; ampm: string };
  onChange: (v: { hour12: string; minute: string; ampm: string }) => void;
}) {
  const cls =
    "rounded-lg border border-gold/30 bg-emerald-dark/70 px-2 py-2 text-sm text-cream focus:outline-none";
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-gold uppercase">{label}</p>
      <div className="mt-1.5 flex gap-2">
        <select
          aria-label={`${label} jam`}
          className={cls}
          value={value.hour12}
          onChange={(e) => onChange({ ...value, hour12: e.target.value })}
        >
          {HOURS.map((h) => (
            <option key={h}>{h}</option>
          ))}
        </select>
        <select
          aria-label={`${label} minit`}
          className={cls}
          value={value.minute}
          onChange={(e) => onChange({ ...value, minute: e.target.value })}
        >
          {MINUTES.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          aria-label={`${label} AM/PM`}
          className={cls}
          value={value.ampm}
          onChange={(e) => onChange({ ...value, ampm: e.target.value })}
        >
          <option>AM</option>
          <option>PM</option>
        </select>
      </div>
    </div>
  );
}

function SyncBadge({ state }: { state: SyncState }) {
  const map = {
    synced: { Icon: CheckCircle2, text: "Bersama", cls: "text-gold border-gold/40" },
    syncing: { Icon: LoaderCircle, text: "Menyinkron...", cls: "text-cream border-cream/30" },
    error: { Icon: CircleAlert, text: "Ralat", cls: "text-destructive border-destructive/50" },
  } as const;
  const { Icon, text, cls } = map[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${cls}`}>
      <Icon className={`h-3.5 w-3.5 ${state === "syncing" ? "animate-spin" : ""}`} /> {text}
    </span>
  );
}
