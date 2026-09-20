import DashboardShell from '@/components/DashboardShell';

export default function CustomerLayout({ children }) {
  return <DashboardShell role="customer">{children}</DashboardShell>;
}
