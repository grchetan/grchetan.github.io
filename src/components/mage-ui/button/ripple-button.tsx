import { useCallback, useRef, useState } from "react";

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function RippleButton({ children, className, ...props }: RippleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const place = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    const ripple = rippleRef.current;
    if (!button || !ripple) return null;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    return ripple;
  };

  const createRipple = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isHovered) return;
      setIsHovered(true);
      const ripple = place(event);
      if (!ripple) return;
      ripple.classList.remove("ripple-leave");
      ripple.classList.add("ripple-enter");
    },
    [isHovered],
  );

  const removeRipple = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    const ripple = place(event);
    if (!ripple) return;
    ripple.classList.remove("ripple-enter");
    ripple.classList.add("ripple-leave");
    const onEnd = () => {
      ripple.classList.remove("ripple-leave");
      ripple.removeEventListener("animationend", onEnd);
    };
    ripple.addEventListener("animationend", onEnd);
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!isHovered) return;
      place(event);
    },
    [isHovered],
  );

  return (
    <button
      ref={buttonRef}
      className={
        "group relative flex items-center justify-center gap-2 overflow-hidden rounded-full border border-ink/20 bg-paper-tint/70 px-5 py-3 text-ink transition-colors duration-500 hover:text-paper " +
        (className ?? "")
      }
      onMouseEnter={createRipple}
      onMouseLeave={removeRipple}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <span className="relative z-[2] flex items-center gap-2">{children}</span>
      <span ref={rippleRef} className="ripple-blob" />
      <style>{`
        .ripple-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          background-image: linear-gradient(120deg, var(--prism-red, #ff5f6d), var(--prism-yellow, #ffc371), var(--prism-pink, #ff61c7), var(--prism-blue, #4d6bff));
          z-index: 1;
          opacity: 0;
          transition: transform 50ms linear;
        }
        .ripple-enter { animation: ripple-enter 600ms ease-out forwards; }
        .ripple-leave { animation: ripple-leave 600ms ease-out forwards; }
        @keyframes ripple-enter { from { transform: scale(0); opacity: 1; } to { transform: scale(1); opacity: 1; } }
        @keyframes ripple-leave { from { transform: scale(1); opacity: 1; } to { transform: scale(0); opacity: 1; } }
      `}</style>
    </button>
  );
}
