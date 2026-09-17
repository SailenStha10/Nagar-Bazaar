import EditSellerProductClient from './EditSellerProductClient';

export default async function EditSellerProductPage({ params }) {
  const { id } = await params;
  return <EditSellerProductClient id={id} />;
}
