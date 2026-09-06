import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { AlertCircle, Lock, Mail, Moon } from "lucide-react";
import { getFirebase } from "@/lib/firebase";
import { useAuthUser } from "@/hooks/useAuthUser";
import arabesque from "@/assets/arabesque.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log Masuk — Surau Seri Dahlia" },
      { name: "description", content: "Akses pengurusan aktiviti Surau Seri Dahlia." },
      { property: "og:title", content: "Log Masuk — Surau Seri Dahlia" },
      { property: "og:description", content: "Akses pengurusan aktiviti Surau Seri Dahlia." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuthUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: "/admin/activities", replace: true });
  }, [ready, user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Sila isi e-mel dan kata laluan.");
      return;
    }
    setLoading(true);
    try {
      const { auth } = await getFirebase();
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate({ to: "/admin/activities", replace: true });
    } catch {
      setError("E-mel atau kata laluan tidak sah. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center px-4 py-10">
      <img src={arabesque} alt="" aria-hidden className="fixed inset-0 h-full w-full object-cover opacity-20" />
      <div className="fixed inset-0 bg-gradient-to-br from-background via-emerald-dark to-background" />

      <div className="glass-panel relative w-full max-w-md rounded-3xl border-gold/30 p-8 backdrop-blur-xl">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-gold/70 bg-cream">
          <Moon className="h-9 w-9 text-emerald-deep" />
        </div>
        <h1 className="mt-6 text-center font-serif text-4xl font-bold text-gold">Log Masuk</h1>
        <p className="mt-2 text-center text-sm text-cream/70">Akses Pengurusan Surau Seri Dahlia</p>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/50 bg-destructive/15 px-3 py-2 text-sm text-destructive-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-cream">
              E-mel
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-gold/30 bg-emerald-dark/60 px-3">
              <Mail className="h-4 w-4 text-gold" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@surau.com"
                className="w-full bg-transparent py-3 text-cream placeholder:text-cream/40 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-semibold text-cream">
              Kata Laluan
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-gold/30 bg-emerald-dark/60 px-3">
              <Lock className="h-4 w-4 text-gold" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent py-3 text-cream placeholder:text-cream/40 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="gold-btn w-full rounded-xl py-3 text-base disabled:opacity-60"
          >
            {loading ? "Sedang log masuk..." : "Log Masuk"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-cream/60 transition-colors hover:text-gold">
            ← Kembali ke Paparan Utama
          </Link>
        </div>
      </div>
    </main>
  );
}
