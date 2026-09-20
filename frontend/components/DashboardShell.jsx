'use client';

import { usePathname } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import DashboardSidebar from './DashboardSidebar';

// Routes that render their own full-bleed layout (e.g. a role-specific login
// screen) and should never get the quick-actions sidebar wrapper.
const BARE_ROUTES = new Set(['/admin']);

export default function DashboardShell({ role, children }) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (BARE_ROUTES.has(pathname) || !user) {
    return children;
  }

  return (
    <div className="flex flex-col gap-6 px-3 pt-4 lg:flex-row lg:gap-6 lg:px-4">
      <DashboardSidebar role={role} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
