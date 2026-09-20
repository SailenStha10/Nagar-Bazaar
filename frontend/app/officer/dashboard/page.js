'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OfficerDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/government/dashboard');
  }, [router]);

  return null;
}
