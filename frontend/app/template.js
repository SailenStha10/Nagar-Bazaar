'use client';

import { useState } from 'react';

// template.js remounts on every navigation (unlike layout.js, which persists),
// so this is what gives each page its slide-down + fade entrance animation.
//
// The animation class is dropped once it finishes rather than left in place
// with fill-mode holding its end state: Chromium keeps a *finished-but-filling*
// CSS animation "in effect" indefinitely, which resolves `transform` to a
// matrix instead of `none` even when the keyframe's end value is literally
// `none`. That phantom non-none transform silently creates a new containing
// block for any `position: fixed` descendant (toasts, docked navbars, etc.),
// breaking their positioning for the rest of the page's life. Removing the
// class after the animation ends avoids that entirely.
export default function Template({ children }) {
  const [animating, setAnimating] = useState(true);

  return (
    <div className={animating ? 'page-transition' : ''} onAnimationEnd={() => setAnimating(false)}>
      {children}
    </div>
  );
}
