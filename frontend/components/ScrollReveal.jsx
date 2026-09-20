'use client';

import { useEffect, useRef, useState } from 'react';

const hiddenByDirection = {
  up: 'opacity-0 translate-y-10',
  left: 'opacity-0 -translate-x-14',
  right: 'opacity-0 translate-x-14',
  fade: 'opacity-0',
};

// Reveals children with a fade + directional slide the first time they
// scroll into view. `direction` accepts 'up' | 'left' | 'right' | 'fade'.
export default function ScrollReveal({ children, direction = 'up', delay = 0, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      // The visible state deliberately sets no translate utility at all (rather than
      // e.g. translate-x-0) so the resting computed `transform` is `none` — any
      // non-none value, including an identity translate, would otherwise create a
      // new containing block and break `position: fixed` descendants after reveal.
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100' : hiddenByDirection[direction]} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}
