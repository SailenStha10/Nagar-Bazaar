'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// Next's App Router has no built-in "navigation started/finished" event for
// client components, so this simulates one: any pathname change means a
// navigation just landed, which we treat as "finish" for a bar that was
// already mid-grow, and any real link click starts the "grow" phase early.
export default function RouteProgressBar() {
  const pathname = usePathname();
  const [phase, setPhase] = useState('idle'); // idle | growing | finishing
  const finishTimer = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPhase('finishing');
    clearTimeout(finishTimer.current);
    finishTimer.current = setTimeout(() => setPhase('idle'), 260);
    return () => clearTimeout(finishTimer.current);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || anchor.target === '_blank') return;
      setPhase('growing');
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (phase === 'idle') return null;

  return (
    <div className="fixed left-0 top-0 z-100 h-0.75 w-full bg-transparent">
      <div
        className="h-full bg-accent shadow-[0_0_8px_rgba(193,113,47,0.6)]"
        style={{
          animation:
            phase === 'growing'
              ? 'progress-grow 1.1s cubic-bezier(0.16,1,0.3,1) forwards'
              : 'progress-finish 260ms ease-out forwards',
        }}
      />
    </div>
  );
}
