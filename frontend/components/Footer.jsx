import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-16 bg-[#172033] text-gray-300">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <h3 className="mb-3 text-lg font-semibold text-white">Nagar Bazaar</h3>
          <p className="text-sm">
            A unified platform bridging e-commerce and e-governance for local markets, connecting
            citizens, sellers, and government officers.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products" className="hover:text-white">Products</Link></li>
            <li><Link href="/local-products" className="hover:text-white">Local Products</Link></li>
            <li><Link href="/sellers" className="hover:text-white">Stores</Link></li>
            <li><Link href="/notices" className="hover:text-white">Notices</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li>Kathmandu, Nepal</li>
            <li>support@nagarbazaar.gov.np</li>
            <li>+977-1-4000000</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Follow Us</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white">Facebook</a></li>
            <li><a href="#" className="hover:text-white">Twitter</a></li>
            <li><a href="#" className="hover:text-white">Instagram</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Nagar Bazaar. All rights reserved.
      </div>
    </footer>
  );
}
