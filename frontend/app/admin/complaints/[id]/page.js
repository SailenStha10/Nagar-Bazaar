import OfficerComplaintClient from '@/app/government/complaints/[id]/OfficerComplaintClient';

export default async function AdminComplaintDetailPage({ params }) {
  const { id } = await params;
  return <OfficerComplaintClient id={id} />;
}
