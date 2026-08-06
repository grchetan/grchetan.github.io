/**
 * Firebase client-side API key.
 * Reads from VITE_FIREBASE_API_KEY env variable (defined in .env).
 */
export const getFirebaseApiKey = async (): Promise<{ apiKey: string }> => {
  const apiKey = (import.meta.env["VITE_FIREBASE_API_KEY"] as string | undefined) ?? "";
  return { apiKey: apiKey.trim() };
};
