import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import {
  InvalidPosterError,
  MAX_UPLOADED_POSTERS,
  PosterDeleteMetadataError,
  PosterLimitError,
  PosterUploadCleanupError,
  deletePoster,
  subscribeUploadedPosters,
  uploadPoster,
  type UploadedPoster,
} from "@/lib/posterStorage";

interface UploadProgress {
  fileName: string;
  percent: number;
  index: number;
  total: number;
}

export function PosterManager() {
  const [posters, setPosters] = useState<UploadedPoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return subscribeUploadedPosters(
      (items) => {
        setPosters(items);
        setError(null);
        setLoading(false);
      },
      (subscriptionError) => {
        console.error("Failed to load uploaded posters:", subscriptionError);
        setError("Gagal memuat senarai poster. Sila cuba muat semula.");
        setLoading(false);
      },
    );
  }, []);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length === 0) return;
    setError(null);

    if (files.some((file) => !file.type.startsWith("image/"))) {
      setError("Imej tidak sah.");
      return;
    }

    if (files.length + posters.length > MAX_UPLOADED_POSTERS) {
      setError("Maksimum 5 poster sahaja dibenarkan.");
      return;
    }

    setUploading(true);
    try {
      for (const [index, file] of files.entries()) {
        setProgress({ fileName: file.name, percent: 0, index: index + 1, total: files.length });
        await uploadPoster(file, (percent) => {
          setProgress({ fileName: file.name, percent, index: index + 1, total: files.length });
        });
      }
    } catch (uploadError) {
      console.error("Failed to upload poster:", uploadError);
      if (uploadError instanceof InvalidPosterError) setError(uploadError.message);
      else if (uploadError instanceof PosterLimitError) setError(uploadError.message);
      else if (uploadError instanceof PosterUploadCleanupError) setError(uploadError.message);
      else if (import.meta.env.DEV && uploadError instanceof Error) {
        const code =
          "code" in uploadError && typeof uploadError.code === "string"
            ? ` [${uploadError.code}]`
            : "";
        setError(`${uploadError.message}${code}`);
      } else setError("Gagal memuat naik poster. Sila cuba lagi.");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  async function handleDelete(poster: UploadedPoster) {
    if (!window.confirm(`Padam poster "${poster.originalName}"?`)) return;
    setError(null);
    setDeletingId(poster.id);
    try {
      await deletePoster(poster);
    } catch (deleteError) {
      console.error("Failed to delete poster:", deleteError);
      if (deleteError instanceof PosterDeleteMetadataError) {
        setPosters((current) => current.filter((item) => item.id !== poster.id));
        setError(deleteError.message);
      } else {
        setError("Gagal memadam poster. Sila cuba lagi.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  const slotsLeft = Math.max(0, MAX_UPLOADED_POSTERS - posters.length);
  const busy = uploading || deletingId !== null;

  return (
    <section className="glass-panel space-y-4 rounded-3xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gold">Pengurusan Poster</h2>
          <p className="text-sm text-cream/70">
            Poster Upload · {posters.length} / {MAX_UPLOADED_POSTERS}
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={busy || slotsLeft === 0}
            className="sr-only"
            aria-label="Pilih poster daripada peranti"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy || loading || slotsLeft === 0}
            className="gold-btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            Muat Naik Poster
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/50 bg-destructive/15 p-3 text-sm text-cream"
        >
          {error}
        </p>
      )}

      {progress && (
        <div className="space-y-1 text-sm text-cream/80" aria-live="polite">
          <div className="flex justify-between gap-3">
            <span className="truncate">{progress.fileName}</span>
            <span>
              {progress.index}/{progress.total} · {progress.percent}%
            </span>
          </div>
          <progress className="h-2 w-full accent-gold" max={100} value={progress.percent} />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-cream/60">Memuatkan poster...</p>
      ) : posters.length === 0 ? (
        <p className="text-sm text-cream/60">Belum ada poster yang dimuat naik.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {posters.map((poster) => (
            <article
              key={poster.id}
              className="overflow-hidden rounded-2xl border border-gold/20 bg-emerald-dark/50"
            >
              <img
                src={poster.downloadUrl}
                alt={poster.originalName}
                className="aspect-[3/4] w-full object-cover"
                loading="lazy"
              />
              <div className="flex items-center justify-between gap-2 p-2.5">
                <span className="truncate text-xs text-cream/80" title={poster.originalName}>
                  {poster.originalName}
                </span>
                <button
                  type="button"
                  onClick={() => void handleDelete(poster)}
                  disabled={busy}
                  aria-label={`Padam poster ${poster.originalName}`}
                  className="shrink-0 rounded-lg border border-destructive/50 p-2 text-cream hover:bg-destructive/20 disabled:opacity-50"
                >
                  {deletingId === poster.id ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
