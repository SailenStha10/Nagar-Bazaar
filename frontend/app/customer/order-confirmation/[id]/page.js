import OrderConfirmationClient from './OrderConfirmationClient';

export default async function OrderConfirmationPage({ params }) {
  const { id } = await params;
  return <OrderConfirmationClient id={id} />;
}
