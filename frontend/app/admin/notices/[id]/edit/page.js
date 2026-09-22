import EditNoticeClient from '@/app/government/notices/[id]/edit/EditNoticeClient';

export default async function AdminNoticeEditPage({ params }) {
  const { id } = await params;
  return <EditNoticeClient id={id} />;
}
