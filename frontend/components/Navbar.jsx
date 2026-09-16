'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, User, ShoppingCart, ShieldCheck, ChevronDown } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Marketplace' },
  { href: '/local-products', label: 'Local Products' },
  { href: '/sellers', label: 'Stores' },
  { href: '/notices', label: 'Govt. Notices' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cart } = useCart();

  return (
    <header className="sticky top-0 z-50">
      <div className="hidden bg-primary-dark px-4 py-1.5 text-xs text-white/80 sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-accent" />
            A civic-commerce initiative connecting citizens, verified sellers &amp; local authorities
          </span>
          <span>Kathmandu Metropolitan Region</span>
        </div>
      </div>

      <div className="border-b border-white/10 bg-primary/95 text-white shadow-sm backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-display text-lg font-semibold text-white">
              N
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">
              Nagar Bazaar
            </span>
          </Link>

          <ul className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-white/85 transition hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full bg-white/10 py-2 pl-3 pr-2.5 text-sm font-medium hover:bg-white/15"
                >
                  <User size={15} />
                  {user.name.split(' ')[0]}
                  <ChevronDown size={14} className="text-white/60" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface-raised py-1 text-ink shadow-xl">
                    <Link href={`/${user.role}/dashboard`} className="block px-4 py-2.5 text-sm hover:bg-surface-alt">
                      Dashboard
                    </Link>
                    <Link href="/customer/cart" className="block px-4 py-2.5 text-sm hover:bg-surface-alt">
                      Cart
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full px-4 py-2.5 text-left text-sm text-accent-dark hover:bg-surface-alt"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-white/85 hover:text-white">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark"
                >
                  Get Started
                </Link>
              </>
            )}
            <Link
              href="/customer/cart"
              className="relative rounded-full p-2 text-white/85 hover:bg-white/10 hover:text-white"
              aria-label="Cart"
            >
              <ShoppingCart size={19} />
              {cart.totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {cart.totalItems}
                </span>
              )}
            </Link>
          </div>

          <button className="text-white md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {open && (
          <div className="border-t border-white/10 px-4 pb-4 md:hidden">
            <ul className="flex flex-col gap-3 pt-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="block text-sm font-medium" onClick={() => setOpen(false)}>
                    {link.label}
                  </Link>
                </li>
              ))}
              {user ? (
                <>
                  <li>
                    <Link href={`/${user.role}/dashboard`} className="block text-sm font-medium">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <button onClick={logout} className="block text-sm font-medium text-accent-light">
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="block text-sm font-medium">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="block text-sm font-medium">
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
