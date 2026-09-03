import React from "react";
import { cn } from "@/lib/utils";

interface ItemProps {
  emoji: string;
  position: string;
}

/** Floating glyphs that scatter outward when the name is hovered. */
const firstLineItems: ItemProps[] = [
  {
    emoji: "⚛️",
    position:
      "-left-10 -top-6 -rotate-[18deg] group-hover:-translate-y-8 group-hover:-translate-x-4 group-hover:-rotate-[30deg] md:-left-16 md:-top-10",
  },
  {
    emoji: "🧩",
    position:
      "-left-8 top-1/2 group-hover:-translate-x-10 group-hover:rotate-[18deg] md:-left-14",
  },
  {
    emoji: "⚡",
    position:
      "left-[92%] -top-4 rotate-[12deg] group-hover:-translate-y-9 group-hover:translate-x-5 md:-top-8",
  },
];

const secondLineItems: ItemProps[] = [
  {
    emoji: "🎨",
    position:
      "-left-9 -top-2 -rotate-[12deg] group-hover:-translate-x-9 group-hover:-rotate-[34deg] md:-left-16",
  },
  {
    emoji: "🛠️",
    position:
      "left-[94%] top-0 group-hover:translate-x-8 group-hover:rotate-[26deg] md:left-[98%]",
  },
  {
    emoji: "🚀",
    position:
      "left-[80%] top-[80%] rotate-[8deg] group-hover:translate-y-9 group-hover:translate-x-4 group-hover:rotate-[24deg]",
  },
];

function FloatingGlyphs({ items }: { items: ItemProps[] }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 select-none">
      {items.map((item, i) => (
        <span
          key={i}
          className={cn(
            "absolute text-[clamp(1.1rem,2.4vw,2rem)] opacity-0 scale-75 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-hover:scale-100",
            item.position,
          )}
          style={{ transitionDelay: `${i * 45}ms` }}
        >
          {item.emoji}
        </span>
      ))}
    </span>
  );
}

interface HeroSectionTextHoverProps {
  first: React.ReactNode;
  second: React.ReactNode;
  className?: string;
}

const HeroSectionTextHover: React.FC<HeroSectionTextHoverProps> = ({
  first,
  second,
  className,
}) => {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  if (isMobile) {
    return (
      <span className={cn("block cursor-default", className)}>
        <span className="relative block">
          <span className="relative z-[2] block">{first}</span>
        </span>
        <span className="relative block">
          <span className="relative z-[2] block">{second}</span>
        </span>
      </span>
    );
  }

  return (
    <span className={cn("group block cursor-default", className)}>
      <span className="relative block">
        <span className="relative z-[2] block transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1">
          {first}
        </span>
        <FloatingGlyphs items={firstLineItems} />
      </span>
      <span className="relative block">
        <span className="relative z-[2] block transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-1">
          {second}
        </span>
        <FloatingGlyphs items={secondLineItems} />
      </span>
    </span>
  );
};

export default HeroSectionTextHover;
