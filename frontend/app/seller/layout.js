import DashboardShell from '@/components/DashboardShell';
import SellerTopBar from '@/components/SellerTopBar';

export default function SellerLayout({ children }) {
  return (
    <>
      <SellerTopBar />
      <DashboardShell role="seller">{children}</DashboardShell>
    </>
  );
}
