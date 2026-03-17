import { AdminMeetingDetail } from "@/components/admin/admin-meeting-detail";

type AdminMeetingDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminMeetingDetailPage({ params }: AdminMeetingDetailPageProps) {
  const { id } = await params;
  const meetingId = Number(id);

  return <AdminMeetingDetail meetingId={meetingId} />;
}
