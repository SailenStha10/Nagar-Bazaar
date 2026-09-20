'use client';

import { useEffect, useState } from 'react';

const SESSION_KEY = 'nb_splash_shown';
const VISIBLE_MS = 3000;
const FADE_MS = 500;

export default function SplashScreen() {
  const [stage, setStage] = useState('hidden'); // hidden | visible | leaving

  useEffect(() => {
    let alreadyShown = true;
    try {
      alreadyShown = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      alreadyShown = false;
    }

    if (alreadyShown) return;

    setStage('visible');
    document.body.style.overflow = 'hidden';

    const leaveTimer = setTimeout(() => setStage('leaving'), VISIBLE_MS);
    const removeTimer = setTimeout(() => {
      setStage('hidden');
      document.body.style.overflow = '';
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        // sessionStorage unavailable — splash will just replay next load
      }
    }, VISIBLE_MS + FADE_MS);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(removeTimer);
      document.body.style.overflow = '';
    };
  }, []);

  if (stage === 'hidden') return null;

  return (
    <div
      className={`fixed inset-0 z-100 flex flex-col items-center justify-center bg-primary transition-opacity ease-out ${
        stage === 'leaving' ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      aria-hidden="true"
    >
      <div className="splash-pop flex h-20 w-20 items-center justify-center rounded-2xl bg-accent font-display text-4xl font-bold text-white shadow-2xl">
        N
      </div>
      <p className="splash-fade-in mt-5 font-display text-2xl font-semibold tracking-tight text-white">
        Nagar Bazaar
      </p>
      <div className="splash-fade-in mt-8 flex items-center gap-1.5">
        <span className="splash-dot h-1.5 w-1.5 rounded-full bg-white/70" />
        <span className="splash-dot h-1.5 w-1.5 rounded-full bg-white/70" />
        <span className="splash-dot h-1.5 w-1.5 rounded-full bg-white/70" />
      </div>
    </div>
  );
}
