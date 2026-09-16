import Link from 'next/link';
import { MapPin, Mail, Phone, ShieldCheck } from 'lucide-react';

const socials = ['f', 'x', 'in'];

const columns = [
  {
    title: 'Marketplace',
    links: [
      { href: '/products', label: 'All Products' },
      { href: '/local-products', label: 'Local Products' },
      { href: '/sellers', label: 'Verified Stores' },
      { href: '/register', label: 'Become a Seller' },
    ],
  },
  {
    title: 'Civic Services',
    links: [
      { href: '/customer/complaints/new', label: 'File a Complaint' },
      { href: '/notices', label: 'Government Notices' },
      { href: '/market-monitoring', label: 'Market Price Monitoring' },
      { href: '/register', label: 'Officer Access' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '#', label: 'About Nagar Bazaar' },
      { href: '#', label: 'How It Works' },
      { href: '#', label: 'Trust &amp; Safety' },
      { href: '#', label: 'Contact Support' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-primary-dark text-white/70">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-display text-lg font-semibold text-white">
                N
              </span>
              <span className="font-display text-xl font-semibold text-white">Nagar Bazaar</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              A unified civic-commerce platform connecting citizens, verified local sellers, and
              government officers &mdash; authentic products, transparent grievance redressal, one
              trusted marketplace.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-accent-light">
              <ShieldCheck size={14} />
              Sellers verified through official review
            </div>
            <div className="mt-6 flex gap-3">
              {socials.map((letter) => (
                <a
                  key={letter}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-xs font-semibold uppercase transition hover:bg-accent hover:text-white"
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 border-t border-white/10 pt-8 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2.5">
            <MapPin size={16} className="text-accent" />
            Kathmandu, Nepal
          </div>
          <div className="flex items-center gap-2.5">
            <Mail size={16} className="text-accent" />
            support@nagarbazaar.example
          </div>
          <div className="flex items-center gap-2.5">
            <Phone size={16} className="text-accent" />
            +977-1-4000000
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        &copy; {new Date().getFullYear()} Nagar Bazaar. A university capstone project. All rights reserved.
      </div>
    </footer>
  );
}
