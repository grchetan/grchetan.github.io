import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { Toaster } from "../components/ui/sonner";
import { NotFoundScape, ServerErrorScape } from "../components/site/error-pages";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { initGoogleAnalytics, trackPageView } from "../lib/site-analytics";

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
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster />
      </MotionPreferenceProvider>
    </QueryClientProvider>
  );
}
