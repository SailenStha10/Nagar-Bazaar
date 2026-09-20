import NoticeDetailClient from './NoticeDetailClient';

export default async function NoticeDetailPage({ params }) {
  const { id } = await params;
  return <NoticeDetailClient id={id} />;
}
