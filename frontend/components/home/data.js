import {
  Store,
  Leaf,
  MessageSquareWarning,
  Landmark,
  BadgeCheck,
  TrendingUp,
  Truck,
  ShoppingCart,
  PackageSearch,
  Megaphone,
  FileSearch,
  ShieldCheck,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const stats = [
  { label: 'Verified Sellers', value: '180+' },
  { label: 'Local Products Listed', value: '1,200+' },
  { label: 'Complaints Resolved', value: '94%' },
  { label: 'Markets Monitored', value: '12' },
];

export const pathways = [
  {
    icon: Store,
    tag: 'E-Commerce',
    title: 'Shop the Marketplace',
    description: 'Verified sellers. Transparent pricing. Real reviews.',
    points: ['Browse local products', 'Shop verified sellers', 'Track every order'],
    cta: { href: '/products', label: 'Browse Products' },
    tone: 'accent',
  },
  {
    icon: Landmark,
    tag: 'E-Governance',
    title: 'Access Civic Services',
    description: 'Report issues. Track outcomes. Stay informed.',
    points: ['Report market issues', 'Track complaint status', 'Read official notices'],
    cta: { href: '/customer/complaints/new', label: 'File a Complaint' },
    tone: 'primary',
  },
];

export const features = [
  { icon: BadgeCheck, title: 'Officer-Verified Sellers', description: 'Every store, government-reviewed.' },
  { icon: Leaf, title: 'Authentic Local Products', description: 'Producer-sourced. Fairly priced.' },
  { icon: MessageSquareWarning, title: 'Transparent Grievances', description: 'Public, timestamped, resolved.' },
  { icon: TrendingUp, title: 'Market Price Monitoring', description: 'Overpricing flagged automatically.' },
];

// Products cross-referenced by producer name, so the Verified Sellers
// section can show each storefront next to a sample of what it actually
// sells — the "sellers and products linked" relationship.
export const localProducts = [
  { name: 'Gundruk (250g)', producer: 'Himalayan Organics', price: 180 },
  { name: 'Local Honey (500g)', producer: 'Himalayan Organics', price: 650 },
  { name: 'Nepali Tea (100g)', producer: 'Valley Grocery Store', price: 260 },
  { name: 'Basmati Rice (5kg)', producer: 'Valley Grocery Store', price: 890 },
  { name: 'Mustard Oil (500ml)', producer: 'Local Harvest Nepal', price: 420 },
  { name: 'Homemade Pickle (300g)', producer: 'Kathmandu Fresh Mart', price: 210 },
];

// Demo storefronts for the homepage showcase — the live, real data lives at
// /sellers; these mirror that page's card fields without an API call.
export const demoSellers = [
  { name: 'Kathmandu Fresh Mart', location: 'Kathmandu', rating: 4.6, productCount: 42 },
  { name: 'Valley Grocery Store', location: 'Lalitpur', rating: 4.4, productCount: 35 },
  { name: 'Local Harvest Nepal', location: 'Bhaktapur', rating: 4.8, productCount: 28 },
  { name: 'Himalayan Organics', location: 'Pokhara', rating: 4.7, productCount: 51 },
];

export const localBusinessBenefits = [
  { icon: Users, title: 'Reach more buyers', description: 'Get discovered across Nepal, not just your district.' },
  { icon: ShieldCheck, title: 'Earn a trust badge', description: 'Officer verification tells buyers you’re legitimate.' },
  { icon: TrendingUp, title: 'Fair price protection', description: 'Officers guard against unfair undercutting.' },
];

export const citizenServices = [
  { icon: AlertCircle, title: 'Report Market Issue', description: 'Flag overpricing or poor quality.', href: '/customer/complaints/new' },
  { icon: FileSearch, title: 'Track Complaint', description: 'Follow your case, in the open.', href: '/customer/complaints' },
  { icon: Megaphone, title: 'Government Notices', description: 'Price ceilings & advisories.', href: '/notices' },
  { icon: TrendingUp, title: 'Market Price Info', description: 'How officers compare markets.', href: '/notices' },
];

export const ecommerceSteps = [
  { icon: PackageSearch, title: 'Browse', description: 'Explore verified sellers.' },
  { icon: Store, title: 'Choose', description: 'Compare price & authenticity.' },
  { icon: ShoppingCart, title: 'Order', description: 'Checkout securely.' },
  { icon: Truck, title: 'Track', description: 'Follow it to delivery.' },
];

export const governanceSteps = [
  { icon: AlertCircle, title: 'Report', description: 'File the complaint.' },
  { icon: FileSearch, title: 'Review', description: 'An officer takes the case.' },
  { icon: MessageSquareWarning, title: 'Response', description: 'Get progress updates.' },
  { icon: CheckCircle2, title: 'Resolve', description: 'Closed, with a public outcome.' },
];

// Demo/sample figures for the market-transparency section — not live
// government statistics.
export const transparencyMetrics = [
  { icon: Users, label: 'Registered Sellers', value: 214, suffix: '', trend: '+12 this month' },
  { icon: ShieldCheck, label: 'Verified Sellers', value: 180, suffix: '', trend: '84% of registered' },
  { icon: MessageSquareWarning, label: 'Market Complaints', value: 356, suffix: '', trend: 'last 6 months' },
  { icon: CheckCircle2, label: 'Resolved Complaints', value: 94, suffix: '%', trend: 'resolution rate' },
];

export const transparencyTrend = [
  { month: 'Apr', complaints: 42, resolved: 36 },
  { month: 'May', complaints: 51, resolved: 44 },
  { month: 'Jun', complaints: 47, resolved: 45 },
  { month: 'Jul', complaints: 60, resolved: 52 },
  { month: 'Aug', complaints: 55, resolved: 53 },
  { month: 'Sep', complaints: 63, resolved: 58 },
];

export const notices = [
  { category: 'Price Info', priority: 'high', title: 'Price ceiling set for essential grocery items', date: '2 days ago' },
  { category: 'Consumer Awareness', priority: 'medium', title: "How to verify a seller's certification badge", date: '5 days ago' },
  { category: 'Market Info', priority: 'low', title: 'New monitoring zone added for Kalimati', date: '1 week ago' },
];

export const priorityColor = {
  high: 'bg-accent-light text-accent-dark',
  medium: 'bg-local-light text-local',
  low: 'bg-surface-alt text-ink-muted',
};
