import SellerStorefrontClient from './SellerStorefrontClient';

export default async function SellerStorefrontPage({ params }) {
  const { id } = await params;
  return <SellerStorefrontClient id={id} />;
}
