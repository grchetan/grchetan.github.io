import { useEffect, useRef, useState } from "react";
import { ExternalLink, Eye, Loader2, Maximize2, X } from "lucide-react";
import type { ResumeData } from "@/data/resume";
import { resumePdfObjectUrl } from "@/lib/resume-pdf";

/**
 * Live PDF preview: rebuilds the resume PDF from unsaved editor state
 * (debounced) and renders it inline in an iframe.
 */
export function ResumePdfPreview({ data }: { data: ResumeData }) {
  const [url, setUrl] = useState<string | null>(null);
  const [building, setBuilding] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBuilding(true);
    const timer = window.setTimeout(async () => {
      try {
        const next = await resumePdfObjectUrl(data);
        if (cancelled) {
          URL.revokeObjectURL(next);
          return;
        }
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = next;
        setUrl(next);
        setError(null);
      } catch {
        if (!cancelled) setError("Preview could not be generated.");
      } finally {
        if (!cancelled) setBuilding(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [data]);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  const openInNewTab = () => {
    if (url) window.open(url, "_blank");
  };

  return (
    <>
      <div className="plate flex h-full flex-col p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="label">Live PDF preview</span>
            {url ? (
              <button
                type="button"
                onClick={openInNewTab}
                title="Open PDF in new full tab"
                className="inline-flex items-center gap-1 text-[0.68rem] font-medium text-chrome-1 hover:underline"
              >
                <ExternalLink className="size-3" /> Full Window
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-soft">
              {building ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="size-3 animate-spin" strokeWidth={1.5} /> Rendering
                </span>
              ) : (
                "Unsaved changes shown"
              )}
            </span>

            {url ? (
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                title="Expand preview to full screen"
                className="rounded-md border border-ink/15 p-1 text-ink-soft hover:border-chrome-1/60 hover:text-ink"
              >
                <Maximize2 className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="relative mt-4 flex-1 overflow-hidden rounded-lg border border-ink/15 bg-paper/60">
          {url ? (
            <iframe
              key={url}
              src={`${url}#toolbar=0&view=FitH`}
              title="Resume PDF preview"
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="caption">{error ?? "Building preview…"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen PDF Modal Viewer */}
      {isFullscreen && url ? (
        <div className="fixed inset-0 z-[250] flex flex-col bg-black/90 backdrop-blur-md p-4 sm:p-8">
          <div className="flex items-center justify-between pb-4 text-white">
            <div className="flex items-center gap-3">
              <Eye className="size-5 text-chrome-1" />
              <h3 className="font-display text-lg font-bold">Resume PDF Viewer — {data.name}</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openInNewTab}
                className="inline-flex items-center gap-2 rounded-full bg-chrome-1 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-background hover:opacity-90"
              >
                <ExternalLink className="size-3.5" /> Open in Browser Tab
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="rounded-full border border-white/20 p-2 text-white hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
          <div className="relative flex-1 overflow-hidden rounded-xl bg-white shadow-2xl">
            <iframe
              src={`${url}#toolbar=1&view=FitH`}
              title="Full screen Resume PDF"
              className="h-full w-full"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
