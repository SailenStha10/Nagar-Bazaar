'use client';

import useAuth from '@/hooks/useAuth';

export default function OfficerDashboard() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-2xl font-bold text-[#172033]">Welcome, {user?.name || 'Officer'}</h1>
      <p className="mt-2 text-gray-600">
        Your officer dashboard. Complaint management and verification tools will appear here in later sprints.
      </p>
    </div>
  );
}
