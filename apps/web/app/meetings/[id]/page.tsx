import { MeetingDetailView } from "@/components/meeting-detail/meeting-detail-view";
import { SiteNavbar } from "@/components/site-navbar";
import { ProtectedRoute } from "@/components/route-guard";

type MeetingDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = await params;
  const meetingId = Number(id);

  return (
    <ProtectedRoute>
      <SiteNavbar />
      <MeetingDetailView meetingId={meetingId} />
    </ProtectedRoute>
  );
}
