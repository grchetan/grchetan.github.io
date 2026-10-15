import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md",
        "bg-zinc-200/80 dark:bg-zinc-700/60",
        "after:absolute after:inset-0",
        "after:bg-gradient-to-r after:from-transparent after:via-white/60 dark:after:via-white/10 after:to-transparent",
        "after:animate-[shimmer_1.6s_infinite]",
        "after:translate-x-[-100%]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
