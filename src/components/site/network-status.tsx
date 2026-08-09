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
      if (offline) setDismissed(false);

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
    if (connection) connection.addEventListener("change", checkConnection);

    return () => {
      window.removeEventListener("online", checkConnection);
      window.removeEventListener("offline", checkConnection);
      if (connection) connection.removeEventListener("change", checkConnection);
    };
  }, []);

  if (dismissed || (!isOffline && !isSlow)) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="network-toast"
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-2.5 rounded-full border border-white/10 bg-zinc-900/92 px-4 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      >
        <span className="relative flex size-2 shrink-0">
          <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${isOffline ? "bg-rose-500" : "bg-amber-400"}`} />
          <span className={`relative inline-flex size-2 rounded-full ${isOffline ? "bg-rose-400" : "bg-amber-400"}`} />
        </span>
        {isOffline
          ? <WifiOff className="size-3.5 text-rose-400 shrink-0" />
          : <Zap className="size-3.5 text-amber-400 shrink-0" />
        }
        <span className="font-mono text-[0.68rem] tracking-wide text-white/80 whitespace-nowrap">
          {isOffline ? "Offline - cached view" : "Slow network detected"}
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="ml-0.5 rounded-full p-1 text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="size-3" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export default NetworkStatusWatcher;