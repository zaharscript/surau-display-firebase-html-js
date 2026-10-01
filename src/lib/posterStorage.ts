import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export const MAX_UPLOADED_POSTERS = 5;
const POSTER_DOCUMENT = doc(db, "posterSettings", "main");
const MAX_IMAGE_WIDTH = 1200;
const JPEG_QUALITY = 0.7;

export interface UploadedPoster {
  id: string;
  storagePath: string;
  downloadUrl: string;
  originalName: string;
  uploadedAt: Timestamp;
  order: number;
}

export class InvalidPosterError extends Error {
  constructor() {
    super("Imej tidak sah.");
    this.name = "InvalidPosterError";
  }
}

export class PosterLimitError extends Error {
  constructor() {
    super("Maksimum 5 poster sahaja dibenarkan.");
    this.name = "PosterLimitError";
  }
}

export class PosterUploadCleanupError extends Error {
  constructor() {
    super("Muat naik gagal dan fail sementara tidak dapat dibersihkan. Sila hubungi pentadbir.");
    this.name = "PosterUploadCleanupError";
  }
}

export class PosterDeleteMetadataError extends Error {
  constructor() {
    super(
      "Fail poster telah dipadam daripada Storage tetapi metadata gagal dikemas kini. Sila cuba lagi.",
    );
    this.name = "PosterDeleteMetadataError";
  }
}

function parsePosters(data: DocumentData | undefined): UploadedPoster[] {
  if (!data || data["images"] === undefined) return [];
  if (!Array.isArray(data["images"])) throw new Error("Invalid poster metadata.");

  return data["images"].map((value: unknown) => {
    if (
      typeof value !== "object" ||
      value === null ||
      !("id" in value) ||
      typeof value["id"] !== "string" ||
      !("storagePath" in value) ||
      typeof value["storagePath"] !== "string" ||
      !("downloadUrl" in value) ||
      typeof value["downloadUrl"] !== "string" ||
      !("originalName" in value) ||
      typeof value["originalName"] !== "string" ||
      !("uploadedAt" in value) ||
      !(value["uploadedAt"] instanceof Timestamp) ||
      !("order" in value) ||
      typeof value["order"] !== "number"
    ) {
      throw new Error("Invalid poster metadata.");
    }

    return {
      id: value["id"],
      storagePath: value["storagePath"],
      downloadUrl: value["downloadUrl"],
      originalName: value["originalName"],
      uploadedAt: value["uploadedAt"],
      order: value["order"],
    };
  });
}

export function subscribeUploadedPosters(
  onPosters: (posters: UploadedPoster[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    POSTER_DOCUMENT,
    (snapshot) => {
      try {
        onPosters(parsePosters(snapshot.data()));
      } catch (error) {
        onError(error instanceof Error ? error : new Error("Invalid poster metadata."));
      }
    },
    (error) => onError(error),
  );
}

function loadImage(file: File): Promise<{
  image: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file).then((bitmap) => ({
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      dispose: () => bitmap.close(),
    }));
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () =>
      resolve({
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        dispose: () => URL.revokeObjectURL(objectUrl),
      });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new InvalidPosterError());
    };
    image.src = objectUrl;
  });
}

async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new InvalidPosterError();

  if (import.meta.env.DEV) {
    console.info("[poster-upload] source image:", { type: file.type, size: file.size });
  }

  const loaded = await loadImage(file);
  try {
    const scale = Math.min(1, MAX_IMAGE_WIDTH / loaded.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(loaded.width * scale));
    canvas.height = Math.max(1, Math.round(loaded.height * scale));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image compression is unavailable.");
    context.drawImage(loaded.image, 0, 0, canvas.width, canvas.height);

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Image compression failed."))),
        "image/jpeg",
        JPEG_QUALITY,
      );
    });
  } finally {
    loaded.dispose();
  }
}

function uploadBlob(
  fileRef: ReturnType<typeof ref>,
  blob: Blob,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(fileRef, blob, { contentType: "image/jpeg" });
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      },
      reject,
      resolve,
    );
  });
}

export async function uploadPoster(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<UploadedPoster> {
  if (!file.type.startsWith("image/")) throw new InvalidPosterError();
  const compressedImage = await compressImage(file);
  if (import.meta.env.DEV) {
    console.info("[poster-upload] compressed image:", {
      type: compressedImage.type,
      size: compressedImage.size,
    });
  }
  const id = doc(collection(db, "posterSettings")).id;
  const storagePath = `poster_uploads/${id}.jpg`;
  const posterRef = ref(storage, storagePath);

  await uploadBlob(posterRef, compressedImage, onProgress);

  try {
    const downloadUrl = await getDownloadURL(posterRef);
    const poster = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(POSTER_DOCUMENT);
      const currentPosters = parsePosters(snapshot.data());
      if (currentPosters.length >= MAX_UPLOADED_POSTERS) throw new PosterLimitError();

      const newPoster: UploadedPoster = {
        id,
        storagePath,
        downloadUrl,
        originalName: file.name,
        uploadedAt: Timestamp.now(),
        order: currentPosters.length,
      };
      transaction.set(
        POSTER_DOCUMENT,
        { images: [...currentPosters, newPoster], updatedAt: serverTimestamp() },
        { merge: true },
      );
      return newPoster;
    });
    return poster;
  } catch (error) {
    try {
      await deleteObject(posterRef);
    } catch (cleanupError) {
      console.error("Failed to clean up an unregistered poster upload:", cleanupError);
      throw new PosterUploadCleanupError();
    }
    throw error;
  }
}

export async function deletePoster(poster: UploadedPoster): Promise<void> {
  await deleteObject(ref(storage, poster.storagePath));

  try {
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(POSTER_DOCUMENT);
      const currentPosters = parsePosters(snapshot.data());
      const remainingPosters = currentPosters
        .filter((currentPoster) => currentPoster.id !== poster.id)
        .map((currentPoster, order) => ({ ...currentPoster, order }));
      transaction.set(
        POSTER_DOCUMENT,
        { images: remainingPosters, updatedAt: serverTimestamp() },
        { merge: true },
      );
    });
  } catch (error) {
    console.error("Poster Storage deletion succeeded but metadata update failed:", error);
    throw new PosterDeleteMetadataError();
  }
}
