import Link from "next/link";
import { ShieldCheck, Store, Leaf, MessageSquareWarning } from "lucide-react";

const features = [
  {
    icon: Store,
    title: "Local Sellers",
    description: "Discover verified sellers from your community and support local businesses.",
  },
  {
    icon: Leaf,
    title: "Authentic Products",
    description: "Shop genuine Nepali and local products, sourced directly from producers.",
  },
  {
    icon: ShieldCheck,
    title: "Government Verified",
    description: "Sellers are verified by government officers for a trustworthy marketplace.",
  },
  {
    icon: MessageSquareWarning,
    title: "Grievance Redressal",
    description: "File complaints and track resolutions through official government channels.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-[#12355B] to-[#1b4a7a] px-4 py-20 text-center text-white">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold sm:text-5xl">
          Nagar Bazaar
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-200">
          A unified platform bridging e-commerce and e-governance for local markets.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/products"
            className="rounded-md bg-white px-6 py-3 font-semibold text-[#12355B] hover:bg-gray-100"
          >
            Shop Now
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-white px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            Become a Seller
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-[#172033]">Why Nagar Bazaar?</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-gray-200 p-6 text-center shadow-sm">
              <feature.icon className="mx-auto mb-4 text-[#12355B]" size={32} />
              <h3 className="font-semibold text-[#172033]">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-[#172033]">Have a complaint about a product or seller?</h2>
          <p className="mt-3 text-gray-600">
            File a complaint directly with government officers and track its resolution transparently.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-md bg-[#12355B] px-6 py-3 font-semibold text-white hover:bg-[#0e2a48]"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}
