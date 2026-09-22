import DashboardShell from '@/components/DashboardShell';
import AdminTopBar from '@/components/AdminTopBar';

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminTopBar />
      <DashboardShell role="admin">{children}</DashboardShell>
    </>
  );
}
