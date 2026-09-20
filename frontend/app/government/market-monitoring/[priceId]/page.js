import PriceDetailClient from './PriceDetailClient';

export default async function MarketPriceDetailPage({ params }) {
  const { priceId } = await params;
  return <PriceDetailClient priceId={priceId} />;
}
