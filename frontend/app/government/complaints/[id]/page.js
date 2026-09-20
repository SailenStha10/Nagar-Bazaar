import OfficerComplaintClient from './OfficerComplaintClient';

export default async function GovernmentComplaintDetailPage({ params }) {
  const { id } = await params;
  return <OfficerComplaintClient id={id} />;
}
