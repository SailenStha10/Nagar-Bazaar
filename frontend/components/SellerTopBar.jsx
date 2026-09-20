'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Bell, User, LogOut, LayoutDashboard } from 'lucide-react';
import useAuth from '@/hooks/useAuth';

export default function SellerTopBar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-border bg-surface-raised px-4 py-3 shadow-sm lg:pl-83">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search your products, orders..."
            className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition-all duration-200 hover:bg-surface-alt hover:text-primary"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
          </button>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full bg-surface-alt py-1.5 pl-1.5 pr-3 text-sm font-medium text-ink transition-colors duration-200 hover:bg-primary/10"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                <User size={15} />
              </span>
              <span className="hidden sm:inline">{user?.name?.split(' ')[0] || 'Seller'}</span>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface-raised py-1 shadow-xl">
                <Link
                  href="/seller/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-surface-alt"
                >
                  <LayoutDashboard size={15} />
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-accent-dark hover:bg-surface-alt"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
