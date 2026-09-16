'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, User, ShoppingCart } from 'lucide-react';
import useAuth from '@/hooks/useAuth';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/sellers', label: 'Stores' },
  { href: '/notices', label: 'Notices' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-[#12355B] text-white shadow-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Nagar Bazaar
        </Link>

        <ul className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sm font-medium hover:text-gray-200">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
              >
                <User size={16} />
                {user.name}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 text-[#172033] shadow-lg">
                  <Link href={`/${user.role}/dashboard`} className="block px-4 py-2 text-sm hover:bg-gray-100">
                    Dashboard
                  </Link>
                  <Link href="/customer/cart" className="block px-4 py-2 text-sm hover:bg-gray-100">
                    Cart
                  </Link>
                  <button
                    onClick={logout}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-gray-200">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#12355B] hover:bg-gray-100"
              >
                Register
              </Link>
            </>
          )}
          <Link href="/customer/cart" className="hover:text-gray-200">
            <ShoppingCart size={20} />
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-[#12355B] px-4 pb-4 md:hidden">
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
                  <button onClick={logout} className="block text-sm font-medium text-red-300">
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
    </header>
  );
}
