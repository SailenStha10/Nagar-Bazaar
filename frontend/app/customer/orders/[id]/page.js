import OrderTrackingClient from './OrderTrackingClient';

export default async function OrderTrackingPage({ params }) {
  const { id } = await params;
  return <OrderTrackingClient id={id} />;
}
