import EditNoticeClient from './EditNoticeClient';

export default async function EditNoticePage({ params }) {
  const { id } = await params;
  return <EditNoticeClient id={id} />;
}
