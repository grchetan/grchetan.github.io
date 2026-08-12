import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, ScrollRestoration, createRootRouteWithContext, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";
import { NotFoundScape, ServerErrorScape } from "../components/site/error-pages";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { initGoogleAnalytics, trackPageView } from "../lib/site-analytics";
import { useNetworkStatus } from "../hooks/use-network-status";
import { ClickSpark } from "../components/ui/click-spark";
import { VersionWatcher } from "../components/site/version-watcher";

function NotFoundComponent() {
  return <NotFoundScape />;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const isForbidden = /403|forbidden|unauthor/i.test(error?.message ?? "");

  return (
    <ServerErrorScape
      bare
      detail={isForbidden ? "403 forbidden" : error?.message}
      onRetry={() => {
        router.invalidate();
        reset();
      }}
    />
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

import { MotionPreferenceProvider } from "../hooks/use-motion-preference";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isOnline = useNetworkStatus();

  useEffect(() => {
    initGoogleAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  // Dynamic canonical link update for SEO and multi-domain fallback
  useEffect(() => {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    const currentOrigin = window.location.origin;
    // If the domain is chetanprajapat.in, use it. Otherwise, match the current active domain (handling local/expiring fallbacks gracefully).
    const base = currentOrigin.includes("chetanprajapat.in")
      ? "https://www.chetanprajapat.in"
      : currentOrigin.includes("github.io")
        ? "https://grchetan.github.io"
        : currentOrigin;
        
    const cleanPath = pathname === "/" ? "" : pathname.replace(/\/$/, "");
    canonical.setAttribute("href", `${base}${cleanPath}`);
  }, [pathname]);

  useEffect(() => {
    const handleCopy = () => {
      const selection = window.getSelection()?.toString().trim();
      if (selection && selection.length > 0) {
        const preview = selection.length > 30 ? `${selection.slice(0, 30)}...` : selection;
        toast.success("Copied to clipboard!", {
          description: `"${preview}"`,
          position: "bottom-right",
          duration: 3000,
        });
      }
    };

    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ScrollRestoration />
      <MotionPreferenceProvider>
        {!isOnline && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex items-center gap-2.5 rounded-full border border-white/10 bg-zinc-900/90 px-4 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-rose-400" />
            </span>
            <span className="font-mono text-[0.68rem] tracking-wide text-white/80 whitespace-nowrap">Offline — cached view</span>
          </div>
        )}
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <ClickSpark sparkColor="#38bdf8" sparkRadius={28} sparkCount={10} sparkSize={12}>
          <Outlet />
        </ClickSpark>
        <VersionWatcher />
        <Toaster position="bottom-right" richColors />
      </MotionPreferenceProvider>
    </QueryClientProvider>
  );
}
