import Link from "next/link";
import {
  ShieldCheck,
  Store,
  Leaf,
  MessageSquareWarning,
  ArrowRight,
  Star,
  CheckCircle2,
  Landmark,
  BadgeCheck,
  TrendingUp,
  FileText,
  Megaphone,
  Truck,
  UserCheck,
  ClipboardCheck,
} from "lucide-react";

const stats = [
  { label: "Verified Sellers", value: "180+" },
  { label: "Local Products Listed", value: "1,200+" },
  { label: "Complaints Resolved", value: "94%" },
  { label: "Markets Monitored", value: "12" },
];

const pathways = [
  {
    icon: Store,
    tag: "For Citizens & Shoppers",
    title: "Shop the Marketplace",
    description:
      "Browse authentic local and grocery products from sellers vetted by government officers, with transparent pricing and real reviews.",
    points: ["Government-verified sellers", "Authentic local & Nepali goods", "Track orders end to end"],
    cta: { href: "/products", label: "Browse Products" },
    tone: "accent",
  },
  {
    icon: Landmark,
    tag: "For Oversight & Grievances",
    title: "Access Civic Services",
    description:
      "File complaints about pricing or quality, follow official notices, and see how government officers monitor the market in real time.",
    points: ["File & track complaints", "Read public market notices", "Officer-led resolutions"],
    cta: { href: "/customer/complaints/new", label: "File a Complaint" },
    tone: "primary",
  },
];

const features = [
  { icon: BadgeCheck, title: "Officer-Verified Sellers", description: "Every store passes a government verification review before it can sell." },
  { icon: Leaf, title: "Authentic Local Products", description: "A dedicated showcase for producer-sourced Nepali goods, priced fairly." },
  { icon: MessageSquareWarning, title: "Transparent Grievances", description: "Complaints are tracked publicly, timestamped, and resolved by real officers." },
  { icon: TrendingUp, title: "Market Price Monitoring", description: "Officers flag overpricing automatically by comparing seller prices market-wide." },
];

const steps = [
  { icon: UserCheck, title: "Register & Verify", description: "Sign up as a citizen or seller; sellers submit shop details for officer review." },
  { icon: Store, title: "List or Browse", description: "Sellers publish authentic products; shoppers browse, compare, and order." },
  { icon: Truck, title: "Order & Track", description: "Orders are placed with COD or online payment and tracked to delivery." },
  { icon: ClipboardCheck, title: "Resolve & Report", description: "Any issue is filed as a complaint and resolved by an assigned officer." },
];

const notices = [
  { category: "Price Info", priority: "high", title: "Maximum retail price ceiling set for essential grocery items", date: "2 days ago" },
  { category: "Consumer Awareness", priority: "medium", title: "How to verify a seller's government certification badge", date: "5 days ago" },
  { category: "Market Info", priority: "low", title: "New market monitoring zone added for Kalimati region", date: "1 week ago" },
];

const localProducts = [
  { name: "Gundruk (250g)", producer: "Himalayan Organics", price: 180, location: "Dolakha" },
  { name: "Mustard Oil (500ml)", producer: "Local Harvest Nepal", price: 420, location: "Palpa" },
  { name: "Nepali Tea (100g)", producer: "Valley Grocery Store", price: 260, location: "Ilam" },
  { name: "Homemade Pickle (300g)", producer: "Kathmandu Fresh Mart", price: 210, location: "Bhaktapur" },
];

const priorityColor = {
  high: "bg-accent-light text-accent-dark",
  medium: "bg-local-light text-local",
  low: "bg-surface-alt text-ink-muted",
};

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary-light/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-32 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/85">
              <ShieldCheck size={14} className="text-accent" />
              Government-aligned marketplace platform
            </span>

            <h1 className="mt-6 text-balance font-display text-4xl font-semibold leading-[1.1] text-white sm:text-5xl lg:text-[3.4rem]">
              Commerce you can shop.
              <br />
              Governance you can trust.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
              Nagar Bazaar brings verified local sellers and government oversight onto one platform
              &mdash; so citizens shop with confidence and grievances get resolved in the open.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-dark"
              >
                Shop the Marketplace
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/notices"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                Explore Civic Services
              </Link>
            </div>

            <dl className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-2xl font-semibold text-white sm:text-3xl">{stat.value}</dt>
                  <dd className="mt-1 text-xs text-white/60">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Floating visual composition */}
          <div className="relative hidden h-105 lg:block">
            <div className="absolute right-8 top-4 w-72 rounded-2xl border border-white/10 bg-surface-raised p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-local-light px-2.5 py-1 text-[11px] font-semibold text-local">
                  Local Product
                </span>
                <Star size={15} className="fill-accent text-accent" />
              </div>
              <p className="mt-3 font-display text-lg font-semibold text-ink">Gundruk (250g)</p>
              <p className="text-sm text-ink-muted">Himalayan Organics &middot; Dolakha</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-display text-xl font-semibold text-primary">NPR 180</span>
                <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white">
                  Add to Cart
                </span>
              </div>
            </div>

            <div className="absolute left-2 top-52 w-64 rounded-2xl border border-white/10 bg-surface-raised p-5 shadow-2xl">
              <div className="flex items-center gap-2 text-accent-dark">
                <Megaphone size={16} />
                <span className="text-[11px] font-semibold uppercase tracking-wide">Public Notice</span>
              </div>
              <p className="mt-2 text-sm font-medium leading-snug text-ink">
                Price ceiling issued for essential grocery items this quarter
              </p>
              <p className="mt-3 text-xs text-ink-muted">Issued by Market Monitoring Office</p>
            </div>

            <div className="absolute bottom-2 right-16 flex w-60 items-center gap-3 rounded-2xl border border-white/10 bg-surface-raised p-4 shadow-2xl">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-local-light text-local">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Complaint Resolved</p>
                <p className="text-xs text-ink-muted">NC-2026-00042 &middot; 2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual pathways */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Two platforms, one trust layer</span>
          <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">Built for both sides of the marketplace</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {pathways.map((path) => (
            <div
              key={path.title}
              className="group relative overflow-hidden rounded-3xl border border-border bg-surface-raised p-8 transition hover:shadow-xl"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  path.tone === "accent" ? "bg-accent-light text-accent-dark" : "bg-primary/10 text-primary"
                }`}
              >
                <path.icon size={22} />
              </div>
              <span className="mt-5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {path.tag}
              </span>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ink">{path.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{path.description}</p>

              <ul className="mt-5 space-y-2.5">
                {path.points.map((point) => (
                  <li key={point} className="flex items-center gap-2.5 text-sm text-ink">
                    <CheckCircle2 size={16} className="shrink-0 text-local" />
                    {point}
                  </li>
                ))}
              </ul>

              <Link
                href={path.cta.href}
                className={`mt-7 inline-flex items-center gap-2 text-sm font-semibold ${
                  path.tone === "accent" ? "text-accent-dark" : "text-primary"
                }`}
              >
                {path.cta.label}
                <ArrowRight size={15} className="transition group-hover:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-surface-alt px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Why Nagar Bazaar</span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
              A marketplace with government-grade accountability
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-border bg-surface-raised p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon size={20} />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local products preview */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-local">Local Showcase</span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">Authentic products, straight from producers</h2>
          </div>
          <Link href="/local-products" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            View all local products
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {localProducts.map((product) => (
            <div key={product.name} className="rounded-2xl border border-border bg-surface-raised p-5">
              <div className="flex h-28 items-center justify-center rounded-xl bg-linear-to-br from-primary/10 to-accent-light">
                <Leaf className="text-local" size={28} />
              </div>
              <span className="mt-4 inline-block rounded-full bg-local-light px-2.5 py-1 text-[11px] font-semibold text-local">
                Local Product
              </span>
              <p className="mt-3 font-display font-semibold text-ink">{product.name}</p>
              <p className="text-xs text-ink-muted">{product.producer} &middot; {product.location}</p>
              <p className="mt-3 font-display text-lg font-semibold text-primary">NPR {product.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-primary-dark px-4 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">The Process</span>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">How Nagar Bazaar works</h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-accent">
                  <step.icon size={20} />
                </div>
                <span className="mt-4 block font-display text-3xl font-semibold text-white/15">
                  0{i + 1}
                </span>
                <h3 className="mt-1 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notices preview */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Civic Updates</span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">Latest government notices</h2>
          </div>
          <Link href="/notices" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            View all notices
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {notices.map((notice) => (
            <div key={notice.title} className="rounded-2xl border border-border bg-surface-raised p-6">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityColor[notice.priority]}`}>
                  {notice.category}
                </span>
                <FileText size={16} className="text-ink-muted" />
              </div>
              <p className="mt-4 font-display font-semibold leading-snug text-ink">{notice.title}</p>
              <p className="mt-4 text-xs text-ink-muted">{notice.date}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-accent px-8 py-14 text-center sm:px-16">
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Have a complaint, or want to sell on Nagar Bazaar?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">
            Whether you&rsquo;re a citizen seeking resolution or a seller seeking reach, Nagar Bazaar
            gives you a transparent, government-aligned place to start.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-full bg-white px-6 py-3.5 font-semibold text-accent-dark hover:bg-white/90"
            >
              Create Free Account
            </Link>
            <Link
              href="/customer/complaints/new"
              className="rounded-full border border-white/40 px-6 py-3.5 font-semibold text-white hover:bg-white/10"
            >
              File a Complaint
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
