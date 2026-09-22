import SellerVerificationClient from '@/app/government/sellers/[id]/SellerVerificationClient';

export default async function AdminSellerDetailPage({ params }) {
  const { id } = await params;
  return <SellerVerificationClient id={id} />;
}
