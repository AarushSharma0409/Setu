"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PropsWithChildren,
  type ReactNode,
} from "react";

import { cx } from "./primitives";

export interface RevealProps extends PropsWithChildren {
  className?: string;
  delay?: number;
  once?: boolean;
  children: ReactNode;
}

/**
 * Reveals content when it enters the viewport while keeping it visible when
 * JavaScript is unavailable or the user requests reduced motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  once = true,
}: RevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [motionReady, setMotionReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMotionReady(true);

    if (reduceMotion || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.unobserve(entry.target);
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={elementRef}
      className={cx(
        "setu-motion-reveal",
        visible && "setu-motion-visible",
        className,
      )}
      data-motion-ready={motionReady || undefined}
      style={{ "--setu-motion-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
