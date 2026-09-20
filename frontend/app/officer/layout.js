import DashboardShell from '@/components/DashboardShell';

export default function OfficerLayout({ children }) {
  return <DashboardShell role="officer">{children}</DashboardShell>;
}
