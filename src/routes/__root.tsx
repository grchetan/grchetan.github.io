import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { Toaster } from "../components/ui/sonner";
import { NotFoundScape, ServerErrorScape } from "../components/site/error-pages";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { initGoogleAnalytics, trackPageView } from "../lib/site-analytics";
import { useNetworkStatus } from "../hooks/use-network-status";

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

  return (
    <QueryClientProvider client={queryClient}>
      <MotionPreferenceProvider>
        {!isOnline && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/90 dark:bg-rose-600/90 px-4 py-2 text-xs font-semibold tracking-wide font-mono shadow-2xl text-white backdrop-blur-md animate-bounce">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-white" />
            </span>
            You are offline. Showing cached data.
          </div>
        )}
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster />
      </MotionPreferenceProvider>
    </QueryClientProvider>
  );
}
