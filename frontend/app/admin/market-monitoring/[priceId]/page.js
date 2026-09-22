import PriceDetailClient from '@/app/government/market-monitoring/[priceId]/PriceDetailClient';

export default async function AdminMarketPriceDetailPage({ params }) {
  const { priceId } = await params;
  return <PriceDetailClient priceId={priceId} />;
}
