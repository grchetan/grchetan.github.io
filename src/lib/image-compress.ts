/**
 * Browser-side image compression.
 *
 * Every image that goes through `uploadImage()` is resized + re-encoded to WebP
 * before it ever touches Firebase Storage, so the public site loads fast.
 * Non-image files (APK/IPA builds, PDFs) and vectors/animations are passed
 * through untouched.
 */

export type CompressOptions = {
  /** Longest edge in CSS pixels. */
  maxEdge?: number;
  /** WebP quality, 0–1. */
  quality?: number;
  /** Skip compression when the file is already smaller than this (bytes). */
  skipUnder?: number;
};

const PASSTHROUGH = new Set(["image/svg+xml", "image/gif", "image/avif"]);

function isCompressible(file: File) {
  return file.type.startsWith("image/") && !PASSTHROUGH.has(file.type);
}

async function loadBitmap(file: File) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to <img> decode */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "sync";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function renamed(name: string) {
  return `${name.replace(/\.[^.]+$/, "")}.webp`;
}

/** Resize + re-encode an image to WebP. Returns the original file if it can't help. */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const { maxEdge = 1800, quality = 0.82, skipUnder = 60_000 } = opts;

  if (typeof document === "undefined") return file;
  if (!isCompressible(file)) return file;
  if (file.size <= skipUnder && file.type === "image/webp") return file;

  try {
    const bitmap = await loadBitmap(file);
    const w = "width" in bitmap ? bitmap.width : 0;
    const h = "height" in bitmap ? bitmap.height : 0;
    if (!w || !h) return file;

    const scale = Math.min(1, maxEdge / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, canvas.width, canvas.height);
    if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", quality),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], renamed(file.name), { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  }
}
