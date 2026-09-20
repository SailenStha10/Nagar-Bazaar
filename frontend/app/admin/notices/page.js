'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminNoticesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/government/notices');
  }, [router]);

  return null;
}
