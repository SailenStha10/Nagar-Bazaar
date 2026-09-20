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
    ],
  },
  {
    title: 'Civic Services',
    links: [
      { href: '/customer/complaints/new', label: 'File a Complaint' },
      { href: '/notices', label: 'Government Notices' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-primary-dark text-white/70">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-display text-base font-semibold text-white">
                N
              </span>
              <span className="font-display text-lg font-semibold text-white">Nagar Bazaar</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-accent-light">
              <ShieldCheck size={13} />
              Sellers verified through official review
            </div>
            <div className="mt-4 flex gap-2">
              {socials.map((letter) => (
                <a
                  key={letter}
                  href="#"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-[11px] font-semibold uppercase transition-all duration-200 hover:scale-110 hover:bg-accent hover:text-white"
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-5">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-white">{col.title}</h4>
                <ul className="mt-2.5 space-y-1.5 text-xs">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="transition-colors duration-200 hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 text-xs">
            <span className="flex items-center gap-2">
              <MapPin size={13} className="text-accent" />
              Kathmandu, Nepal
            </span>
            <span className="flex items-center gap-2">
              <Mail size={13} className="text-accent" />
              support@nagarbazaar.example
            </span>
            <span className="flex items-center gap-2">
              <Phone size={13} className="text-accent" />
              +977-1-4000000
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 text-center text-[11px] text-white/50">
          &copy; {new Date().getFullYear()} Nagar Bazaar. A university capstone project. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
