'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  User,
  ShoppingCart,
  Heart,
  LayoutDashboard,
  LogOut,
  Home,
  Store,
  Leaf,
  Landmark,
  Megaphone,
  ChevronDown,
  Search,
} from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import useCart from '@/hooks/useCart';
import { dashboardPathForRole } from '@/utils/roles';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/products', label: 'Marketplace', icon: Store },
  { href: '/local-products', label: 'Local Products', icon: Leaf },
  { href: '/sellers', label: 'Stores', icon: Landmark },
  { href: '/notices', label: 'Govt. Notices', icon: Megaphone },
];

// Roles whose dashboard sidebar now carries the logo itself (see
// DashboardSidebar.jsx) — the top bar drops its own logo there to avoid
// showing it twice, and centers its remaining content instead of leaving
// dead space where the logo used to sit.
const SIDEBAR_ROLE_PREFIXES = ['/customer', '/admin', '/government', '/officer'];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // Sellers, officers and admins get their own slim top bar (search +
  // notifications + profile) instead of the site-wide navbar — see
  // components/SellerTopBar.jsx, components/GovernmentTopBar.jsx and
  // components/AdminTopBar.jsx. The admin login screen itself (bare route,
  // no user yet) still falls through to the default navbar below.
  if (user?.role === 'seller' || user?.role === 'officer' || (user?.role === 'admin' && pathname !== '/admin')) return null;

  const isCustomer = user?.role === 'customer';
  const inSidebarArea = Boolean(user) && SIDEBAR_ROLE_PREFIXES.some((p) => pathname.startsWith(p));
  const inCustomerDashboard = isCustomer && pathname.startsWith('/customer');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchValue.trim();
    router.push(q ? `/customer/products?q=${encodeURIComponent(q)}#marketplace` : '/customer/products#marketplace');
  };

  // Customer dashboard gets a full-width bar (matching the seller dashboard's
  // top bar) with a search field, instead of the floating pill nav — the
  // sidebar already covers primary navigation there.
  if (inCustomerDashboard) {
    return (
      <div className="fixed inset-x-0 top-0 z-50 border-b border-border bg-surface-raised px-4 py-3 shadow-sm lg:pl-83">
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative max-w-md flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search for products, e.g. Gundruk, Rice, Honey..."
              className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white transition-colors duration-200 hover:bg-primary-dark"
            >
              <Search size={13} />
            </button>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link
              href="/customer/wishlist"
              aria-label="Wishlist"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition-all duration-200 hover:bg-surface-alt hover:text-primary"
            >
              <Heart size={17} />
            </Link>

            <Link
              href="/customer/cart"
              aria-label="Cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition-all duration-200 hover:bg-surface-alt hover:text-primary"
            >
              <ShoppingCart size={17} />
              {cart.totalItems > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                  {cart.totalItems}
                </span>
              )}
            </Link>

            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-surface-alt py-1.5 pl-1.5 pr-3 text-sm font-medium text-ink transition-colors duration-200 hover:bg-primary/10"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  <User size={15} />
                </span>
                <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
                <ChevronDown size={13} className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface-raised py-1 shadow-xl">
                  <Link
                    href={dashboardPathForRole(user.role)}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-surface-alt"
                  >
                    <LayoutDashboard size={15} />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
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

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-2 pt-3 pb-2">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3">
        {!inSidebarArea && (
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-display text-sm font-semibold text-white shadow-md transition-transform duration-300 hover:rotate-12">
              N
            </span>
            <span className="hidden text-sm font-semibold tracking-tight text-ink lg:inline">Nagar Bazaar</span>
          </Link>
        )}

        <nav className="mx-auto flex items-center rounded-full bg-primary px-3 py-2 text-white shadow-xl">
          <div className="no-scrollbar flex shrink-0 items-center gap-1 overflow-x-auto">
            <ul className="flex shrink-0 items-center gap-0.5">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href} className="shrink-0">
                    <Link
                      href={link.href}
                      className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        active ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <link.icon size={15} className="shrink-0" />
                      <span className="hidden md:inline">{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <span className="h-6 w-px shrink-0 bg-white/10" />
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {user ? (
                <>
                  {isCustomer && (
                    <Link
                      href="/customer/wishlist"
                      aria-label="Wishlist"
                      className="flex shrink-0 items-center justify-center rounded-full p-2.5 text-white/85 transition-all duration-200 hover:scale-110 hover:bg-white/10 hover:text-white"
                    >
                      <Heart size={17} />
                    </Link>
                  )}

                  {isCustomer && (
                    <Link
                      href="/customer/cart"
                      aria-label="Cart"
                      className="relative flex shrink-0 items-center justify-center rounded-full p-2.5 text-white/85 transition-all duration-200 hover:scale-110 hover:bg-white/10 hover:text-white"
                    >
                      <ShoppingCart size={17} />
                      {cart.totalItems > 0 && (
                        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                          {cart.totalItems}
                        </span>
                      )}
                    </Link>
                  )}

                  <div ref={menuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuOpen((v) => !v)}
                      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-white/85 transition-all duration-200 hover:bg-white/10 hover:text-white"
                    >
                      <User size={15} />
                      <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
                      <ChevronDown size={13} className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {menuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface-raised py-1 text-ink shadow-xl">
                        <Link
                          href={dashboardPathForRole(user.role)}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-surface-alt"
                        >
                          <LayoutDashboard size={15} />
                          Dashboard
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            logout();
                          }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-accent-dark hover:bg-surface-alt"
                        >
                          <LogOut size={15} />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium text-white/85 transition-all duration-200 hover:bg-white/10 hover:text-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="shrink-0 whitespace-nowrap rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-dark"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
        </nav>
      </div>
    </div>
  );
}
