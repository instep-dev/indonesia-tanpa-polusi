'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from '@studio-freight/lenis';

const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  // Init Lenis once — root layout never unmounts so this runs once
  useEffect(() => {
    const lenis = new Lenis({
      duration: 2,
      lerp: 0.07,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      infinite: false,
    });
    lenisRef.current = lenis;

    // Track latest animationId so we can cancel the loop on teardown
    let animationId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      animationId = requestAnimationFrame(raf);
    };
    animationId = requestAnimationFrame(raf);

    // html has h-full (height:100%) so its clientHeight is always 100vh and
    // ResizeObserver on documentElement never fires when body content grows.
    // Observe document.body instead — it grows when items are appended.
    const ro = new ResizeObserver(() => {
      lenis.resize();
    });
    ro.observe(document.body);

    return () => {
      cancelAnimationFrame(animationId);
      ro.disconnect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // On every client-side navigation: jump to top + recalculate
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;

    // Immediate jump so Lenis doesn't try to animate to a position on the
    // previous page's scroll height
    lenis.scrollTo(0, { immediate: true });

    // Small delay — let Next.js finish swapping the page DOM before resize
    const t = setTimeout(() => lenis.resize(), 80);
    return () => clearTimeout(t);
  }, [pathname]);

  return <>{children}</>;
};

export default SmoothScroll;
