import ComplaintDetailClient from './ComplaintDetailClient';

export default async function ComplaintDetailPage({ params }) {
  const { id } = await params;
  return <ComplaintDetailClient id={id} />;
}
