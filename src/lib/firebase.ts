/**
 * Firebase client (browser-only, lazy).
 *
 * Project: chetan-prajapat-portfolio.
 * The API key is read from VITE_FIREBASE_API_KEY env variable (set in .env).
 */

export const firebaseConfig = {
  apiKey: (import.meta.env["VITE_FIREBASE_API_KEY"] as string | undefined) ?? "",
  authDomain: "chetan-prajapat-portfolio.firebaseapp.com",
  projectId: "chetan-prajapat-portfolio",
  storageBucket: "chetan-prajapat-portfolio.firebasestorage.app",
  messagingSenderId: "503853701337",
  appId: "1:503853701337:web:f71e601de395e5dc2546c8",
  measurementId: "G-GMGQSDC8XB",
};

/** True once a Firebase project is wired up (key is resolved at build time). */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.projectId && firebaseConfig.appId && firebaseConfig.apiKey,
);

async function app() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  if (getApps().length) return getApp();
  return initializeApp(firebaseConfig as Record<string, string>);
}

export async function getDb() {
  const { getFirestore } = await import("firebase/firestore");
  return getFirestore(await app());
}

export async function getAuthClient() {
  const { getAuth } = await import("firebase/auth");
  return getAuth(await app());
}

export async function getStorageClient() {
  const { getStorage } = await import("firebase/storage");
  return getStorage(await app());
}

export type UploadProgressInfo = {
  stage: "compressing" | "uploading" | "done";
  progress: number;
  fileName: string;
  bytesTransferred: number;
  totalBytes: number;
  originalSize?: number;
  compressedSize?: number;
};

/**
 * Upload a file to Firebase Storage with real-time progress callbacks & WebP auto-compression.
 */
export async function uploadImageWithProgress(
  file: File,
  folder = "uploads",
  onProgress?: (info: UploadProgressInfo) => void,
): Promise<string> {
  onProgress?.({
    stage: "compressing",
    progress: 15,
    fileName: file.name,
    bytesTransferred: 0,
    totalBytes: file.size,
    originalSize: file.size,
  });

  const { compressImage } = await import("@/lib/image-compress");
  const payload = await compressImage(file);

  onProgress?.({
    stage: "uploading",
    progress: 30,
    fileName: payload.name,
    bytesTransferred: 0,
    totalBytes: payload.size,
    originalSize: file.size,
    compressedSize: payload.size,
  });

  try {
    const storage = await getStorageClient();
    const { ref, uploadBytesResumable, getDownloadURL, setMaxUploadRetryTime } = await import("firebase/storage");
    try {
      setMaxUploadRetryTime(storage, 3000);
    } catch {}
    const path = `${folder}/${Date.now()}-${payload.name.replace(/[^\w.-]+/g, "-")}`;
    const r = ref(storage, path);

    const task = uploadBytesResumable(r, payload, { contentType: payload.type });

    const storagePromise = new Promise<string>((resolve, reject) => {
      let connectionTimer: any = setTimeout(() => {
        if (task.snapshot.bytesTransferred === 0) {
          try {
            task.cancel();
          } catch {}
          reject(new Error("Firebase Storage unreachable or disabled. Defaulting to local Base64."));
        }
      }, 2500);

      const uploadTimer = setTimeout(() => {
        try {
          task.cancel();
        } catch {}
        reject(new Error("Upload timeout — transmission took too long. Defaulting to local Base64."));
      }, 60000);

      task.on(
        "state_changed",
        (snapshot) => {
          if (snapshot.bytesTransferred > 0 && connectionTimer) {
            clearTimeout(connectionTimer);
            connectionTimer = null;
          }
          const pct = Math.min(
            99,
            Math.max(30, Math.round((snapshot.bytesTransferred / (snapshot.totalBytes || 1)) * 70 + 30)),
          );
          onProgress?.({
            stage: "uploading",
            progress: pct,
            fileName: payload.name,
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            originalSize: file.size,
            compressedSize: payload.size,
          });
        },
        (error) => {
          if (connectionTimer) clearTimeout(connectionTimer);
          clearTimeout(uploadTimer);
          reject(error);
        },
        async () => {
          if (connectionTimer) clearTimeout(connectionTimer);
          clearTimeout(uploadTimer);
          try {
            const downloadUrl = await getDownloadURL(task.snapshot.ref);
            onProgress?.({
              stage: "done",
              progress: 100,
              fileName: payload.name,
              bytesTransferred: payload.size,
              totalBytes: payload.size,
              originalSize: file.size,
              compressedSize: payload.size,
            });
            resolve(downloadUrl);
          } catch (e) {
            reject(e);
          }
        },
      );
    });

    return await storagePromise;
  } catch (err) {
    console.warn("[Firebase Storage Timeout/Unavailable — Auto-storing as compressed WebP Data URL]", err);
    // Fallback: convert compressed WebP file to Base64 Data URL (Works 100% FREE without paid Firebase plan)
    const base64 = await fileToBase64(payload);
    onProgress?.({
      stage: "done",
      progress: 100,
      fileName: payload.name,
      bytesTransferred: payload.size,
      totalBytes: payload.size,
      originalSize: file.size,
      compressedSize: payload.size,
    });
    return base64;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Legacy wrapper */
export async function uploadImage(file: File, folder = "uploads") {
  return uploadImageWithProgress(file, folder);
}
