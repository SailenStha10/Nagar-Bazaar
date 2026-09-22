'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';
import DashboardSidebar from './DashboardSidebar';
import SellerPendingNotice from './SellerPendingNotice';

// Routes that render their own full-bleed layout (e.g. a role-specific login
// screen) and should never get the quick-actions sidebar wrapper.
const BARE_ROUTES = new Set(['/admin']);

// A seller with no profile yet is left alone — /seller/dashboard shows its
// own "set up your store" step for that case. Every other non-approved
// status blocks every /seller/* page behind SellerPendingNotice, since this
// shell wraps all of them.
const BLOCKING_STATUSES = new Set(['pending', 'review_required', 'rejected']);

export default function DashboardShell({ role, children }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [sellerVerification, setSellerVerification] = useState(null);

  useEffect(() => {
    if (role !== 'seller' || !user) return;
    let ignore = false;
    api
      .get('/sellers/profile')
      .then((res) => {
        if (!ignore) {
          setSellerVerification({
            status: res.data.data.verificationStatus,
            reason: res.data.data.rejectionReason || res.data.data.reviewReason,
          });
        }
      })
      .catch((err) => {
        if (!ignore) setSellerVerification({ status: err.response?.status === 404 ? 'no-profile' : 'error' });
      });
    return () => {
      ignore = true;
    };
  }, [role, user]);

  if (BARE_ROUTES.has(pathname) || !user) {
    return children;
  }

  const isSellerLoading = role === 'seller' && !sellerVerification;
  const isBlocked = role === 'seller' && BLOCKING_STATUSES.has(sellerVerification?.status);

  return (
    <div className="flex flex-col gap-6 px-3 pt-4 lg:flex-row lg:gap-6 lg:px-4">
      <DashboardSidebar role={role} />
      <div className="min-w-0 flex-1">
        {isSellerLoading ? (
          <div className="mx-auto max-w-lg animate-pulse px-4 py-20">
            <div className="mx-auto h-14 w-14 rounded-full bg-surface-alt" />
            <div className="mx-auto mt-5 h-6 w-2/3 rounded bg-surface-alt" />
          </div>
        ) : isBlocked ? (
          <SellerPendingNotice status={sellerVerification.status} reason={sellerVerification.reason} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
