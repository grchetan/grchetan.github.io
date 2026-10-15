import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      offset={20}
      gap={10}
      toastOptions={{
        duration: 3500,
        classNames: {
          toast: [
            "group toast",
            "!rounded-2xl",
            "!border",
            "!shadow-[0_8px_32px_-8px_rgba(0,0,0,0.25),0_2px_8px_-2px_rgba(0,0,0,0.12)]",
            "!backdrop-blur-2xl",
            "!px-4 !py-3.5",
            "!text-[0.85rem] !font-medium !leading-snug",
            "!transition-all !duration-300",
            // Light mode
            "!bg-white/90 !border-black/[0.08] !text-zinc-800",
            // Dark mode
            "dark:!bg-zinc-900/85 dark:!border-white/[0.08] dark:!text-zinc-100",
          ].join(" "),
          title: "!font-semibold !text-[0.86rem] !tracking-tight",
          description: "!text-[0.78rem] !opacity-70 !mt-0.5",
          icon: "!size-5 !shrink-0",
          actionButton: [
            "!rounded-lg !px-3 !py-1.5 !text-xs !font-medium",
            "!bg-zinc-900 !text-white",
            "dark:!bg-white dark:!text-zinc-900",
          ].join(" "),
          cancelButton: [
            "!rounded-lg !px-3 !py-1.5 !text-xs !font-medium",
            "!bg-zinc-100 !text-zinc-600",
            "dark:!bg-zinc-800 dark:!text-zinc-300",
          ].join(" "),
          closeButton: [
            "!rounded-full !border",
            "!bg-white/80 !border-black/10 !text-zinc-500",
            "dark:!bg-zinc-800 dark:!border-white/10 dark:!text-zinc-400",
            "hover:!opacity-100",
          ].join(" "),
          success: [
            "!border-emerald-500/25",
            "!bg-gradient-to-br !from-emerald-50/95 !to-white/95",
            "dark:!from-emerald-950/70 dark:!to-zinc-900/85",
          ].join(" "),
          error: [
            "!border-rose-500/25",
            "!bg-gradient-to-br !from-rose-50/95 !to-white/95",
            "dark:!from-rose-950/70 dark:!to-zinc-900/85",
          ].join(" "),
          warning: [
            "!border-amber-500/25",
            "!bg-gradient-to-br !from-amber-50/95 !to-white/95",
            "dark:!from-amber-950/70 dark:!to-zinc-900/85",
          ].join(" "),
          info: [
            "!border-sky-500/25",
            "!bg-gradient-to-br !from-sky-50/95 !to-white/95",
            "dark:!from-sky-950/70 dark:!to-zinc-900/85",
          ].join(" "),
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
