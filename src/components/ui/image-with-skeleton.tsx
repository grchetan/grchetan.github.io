import { useState } from "react";
import { Loader2, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiquidImage } from "@/components/webgl/LiquidImage";

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  skeletonHeight?: string;
}

export function ImageWithSkeleton({
  src,
  alt,
  className,
  wrapperClassName,
  skeletonHeight = "min-h-[180px] sm:min-h-[260px]",
  ...props
}: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src) return null;

  return (
    <div className={cn("relative overflow-hidden w-full", wrapperClassName)}>
      {/* Shimmer Loading Skeleton */}
      {!loaded && !error && (
        <div
          className={cn(
            "absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[inherit] bg-paper-tint/60 backdrop-blur-md animate-pulse border border-ink/10",
            skeletonHeight
          )}
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute size-10 rounded-full bg-indigo-500/20 animate-ping" />
            <Loader2 className="size-6 text-indigo-400 animate-spin" />
          </div>
          <span className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-soft">
            Loading preview asset...
          </span>
        </div>
      )}

      {/* Image Error Fallback */}
      {error && (
        <div className={cn("flex flex-col items-center justify-center rounded-[inherit] bg-paper-tint/80 p-8 text-center text-ink-soft border border-ink/10", skeletonHeight)}>
          <ImageOff className="size-8 text-ink-soft/60" />
          <span className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.14em]">Preview unavailable</span>
        </div>
      )}

      {/* Main WebGL Liquid Image */}
      <LiquidImage
        src={src}
        alt={alt || ""}
        className={className}
        skeletonHeight={skeletonHeight}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(true);
          setError(true);
        }}
      />
    </div>
  );
}
