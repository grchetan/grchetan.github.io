import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { WifiOff, Zap, X } from "lucide-react";

export function NetworkStatusWatcher() {
  const [isOffline, setIsOffline] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      const offline = !navigator.onLine;
      setIsOffline(offline);

      // Check for slow connection using Network Information API if supported
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        const slow = connection.saveData || connection.effectiveType === "2g" || connection.effectiveType === "slow-2g" || connection.rtt > 800;
        setIsSlow(slow);
      }
    };

    checkConnection();

    window.addEventListener("online", checkConnection);
    window.addEventListener("offline", checkConnection);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener("change", checkConnection);
    }

    return () => {
      window.removeEventListener("online", checkConnection);
      window.removeEventListener("offline", checkConnection);
      if (connection) {
        connection.removeEventListener("change", checkConnection);
      }
    };
  }, []);

  if (dismissed || (!isOffline && !isSlow)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 left-6 z-[99] flex items-center gap-3 rounded-full border border-amber-500/30 bg-paper/95 px-4 py-2.5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.4)] backdrop-blur-xl"
      >
        {isOffline ? (
          <>
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
            </span>
            <WifiOff className="size-4 text-rose-400" />
            <span className="font-mono text-[0.72rem] text-ink">
              Offline Mode · Showing cached portfolio
            </span>
          </>
        ) : (
          <>
            <Zap className="size-4 text-amber-400 animate-pulse" />
            <span className="font-mono text-[0.72rem] text-ink">
              Slow Network Detected · Optimizing asset loading...
            </span>
          </>
        )}

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="ml-1 rounded-full p-1 text-ink-soft hover:bg-ink/10 hover:text-ink transition-colors cursor-pointer"
          title="Dismiss notification"
        >
          <X className="size-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export default NetworkStatusWatcher;
