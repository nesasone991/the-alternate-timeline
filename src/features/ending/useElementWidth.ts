import { useEffect, useRef, useState } from 'react';

/** Width of an element in CSS pixels, kept up to date. Falls back to `fallback` where ResizeObserver is missing. */
export function useElementWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setWidth(Math.max(200, Math.round(element.getBoundingClientRect().width)) || fallback);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fallback]);
  return { ref, width };
}
