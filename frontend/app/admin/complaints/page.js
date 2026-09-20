'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminComplaintsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/government/complaints');
  }, [router]);

  return null;
}
