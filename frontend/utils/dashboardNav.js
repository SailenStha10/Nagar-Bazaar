import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  ShoppingCart,
  ClipboardList,
  MessageSquareWarning,
  Megaphone,
  Users,
  Store,
  Package,
  Tag,
  UserCog,
  BarChart3,
  Plus,
  ShieldCheck,
  LineChart,
  FilePlus,
  Boxes,
  Gift,
  Ticket,
  BadgePercent,
  Award,
  Settings,
  Warehouse,
  LifeBuoy,
  Percent,
} from 'lucide-react';

// Quick-actions sidebar config, per role. Each role gets grouped links that
// route to their own dedicated pages, so "going through the actions" always
// lands on a focused page rather than a crowded single dashboard.
export const dashboardNav = {
  customer: [
    {
      title: 'Shop',
      items: [
        { href: '/customer/products', label: 'Full Marketplace', icon: Store },
        { href: '/customer/wishlist', label: 'Wishlist', icon: Heart },
        { href: '/customer/cart', label: 'Cart', icon: ShoppingCart },
      ],
    },
    {
      title: 'Account',
      items: [
        { href: '/customer/dashboard', label: 'Account Overview', icon: LayoutDashboard },
        { href: '/customer/orders', label: 'My Orders', icon: ClipboardList },
      ],
    },
    {
      title: 'Rewards',
      items: [
        { href: '/customer/refer-earn', label: 'Refer & Earn', icon: Gift },
        { href: '/customer/coupons', label: 'Discount Coupons', icon: Ticket },
        { href: '/customer/promo-codes', label: 'Promo Codes', icon: BadgePercent },
        { href: '/customer/rewards', label: 'Rewards', icon: Award },
      ],
    },
    {
      title: 'Civic Services',
      items: [
        { href: '/customer/complaints', label: 'My Complaints', icon: MessageSquareWarning },
        { href: '/customer/complaints/new', label: 'File a Complaint', icon: FilePlus },
        { href: '/notices', label: 'Government Notices', icon: Megaphone },
      ],
    },
  ],
  admin: [
    {
      title: 'Overview',
      items: [{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Management',
      items: [
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/sellers', label: 'Sellers', icon: Store },
        { href: '/admin/products', label: 'Products', icon: Package },
        { href: '/admin/categories', label: 'Categories', icon: Tag },
        { href: '/admin/officers', label: 'Officers', icon: UserCog },
      ],
    },
    {
      title: 'Operations',
      items: [
        { href: '/admin/complaints', label: 'Complaints', icon: ClipboardList },
        {
          href: '/admin/notices',
          label: 'Notices',
          icon: Megaphone,
          children: [
            { href: '/admin/notices', label: 'All Notices', icon: Megaphone },
            { href: '/admin/notices/new', label: 'New Notice', icon: FilePlus },
          ],
        },
        { href: '/admin/market-monitoring', label: 'Market Monitoring', icon: LineChart },
        { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
  ],
  seller: [
    {
      title: 'Overview',
      items: [{ href: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Catalog',
      items: [
        { href: '/seller/products', label: 'My Products', icon: Boxes },
        { href: '/seller/products/new', label: 'Add Product', icon: Plus },
        { href: '/seller/stock', label: 'Manage Stocks', icon: Warehouse },
        { href: '/seller/offers', label: 'Offers', icon: Percent },
      ],
    },
    {
      title: 'Sales',
      items: [{ href: '/seller/orders', label: 'Orders', icon: ClipboardList }],
    },
    {
      title: 'Store',
      items: [
        { href: '/seller/settings', label: 'Settings', icon: Settings },
        { href: '/seller/support', label: 'Support', icon: LifeBuoy },
      ],
    },
  ],
  government: [
    {
      title: 'Overview',
      items: [{ href: '/government/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Oversight',
      items: [
        { href: '/government/sellers', label: 'Seller Verification', icon: ShieldCheck },
        { href: '/government/market-monitoring', label: 'Market Monitoring', icon: LineChart },
      ],
    },
    {
      title: 'Civic Services',
      items: [
        { href: '/government/complaints', label: 'Complaints', icon: ClipboardList },
        { href: '/government/notices', label: 'Notices', icon: Megaphone },
        { href: '/government/notices/new', label: 'New Notice', icon: FilePlus },
      ],
    },
  ],
};

dashboardNav.officer = dashboardNav.government;
