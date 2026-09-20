import DashboardShell from '@/components/DashboardShell';

export default function AdminLayout({ children }) {
  return <DashboardShell role="admin">{children}</DashboardShell>;
}
