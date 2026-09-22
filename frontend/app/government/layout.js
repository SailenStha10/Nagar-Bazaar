import DashboardShell from '@/components/DashboardShell';
import GovernmentTopBar from '@/components/GovernmentTopBar';

export default function GovernmentLayout({ children }) {
  return (
    <>
      <GovernmentTopBar />
      <DashboardShell role="government">{children}</DashboardShell>
    </>
  );
}
