import { useEffect } from 'react';
import { toast } from 'sonner';
import buildVersionData from '../../../version.json';

const BUNDLE_VERSION = buildVersionData.version;
let globalVersion: string = BUNDLE_VERSION;
let globalIsReloading = false;

/**
 * Background watcher that polls version.json.
 * Detects if server has a newer version than the current JS bundle / cache.
 * Displays a toast message and automatically reloads the browser fast.
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

        if (data.version !== globalVersion && !globalIsReloading) {
          globalIsReloading = true;
          toast.success(`⚡ New update v${data.version} deployed!`, {
            description: "Updating website automatically to load the latest changes…",
            duration: 3000,
            position: "bottom-right",
          });

          setTimeout(() => {
            window.location.reload();
          }, 800);
        }
      } catch {
        /* silent catch network errors */
      }
    };

    void checkVersion();

    // Poll fast every 15 seconds for rapid update detection
    timer = setInterval(() => {
      void checkVersion();
    }, 15000);

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

