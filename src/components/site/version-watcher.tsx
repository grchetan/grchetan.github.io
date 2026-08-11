import { useEffect } from 'react';
import { toast } from 'sonner';

// Keep version state global so it persists across page navigations (remounts of SiteShell)
let globalVersion: string | null = null;
let globalIsReloading = false;

/**
 * Background watcher that polls version.json.
 * When a new deployment build is deployed to production, it automatically
 * detects the new version and reloads the browser to bust stale caches.
 */
export function VersionWatcher() {
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const checkVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { version?: string };
        if (!data.version) return;

        if (!globalVersion) {
          globalVersion = data.version;
        } else if (
          globalVersion !== data.version &&
          !globalIsReloading
        ) {
          globalIsReloading = true;
          toast.info('New website update available. Applying changes…', {
            duration: 4000,
          });
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        }
      } catch {
        /* silent catch network errors */
      }
    };

    void checkVersion();

    timer = setInterval(() => {
      void checkVersion();
    }, 60000);

    const onFocus = () => void checkVersion();
    window.addEventListener('focus', onFocus);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void checkVersion();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return null;
}

