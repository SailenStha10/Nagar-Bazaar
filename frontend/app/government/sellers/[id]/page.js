import SellerVerificationClient from './SellerVerificationClient';

export default async function GovernmentSellerDetailPage({ params }) {
  const { id } = await params;
  return <SellerVerificationClient id={id} />;
}
