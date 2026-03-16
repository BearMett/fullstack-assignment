import { MeetingCreateScreen } from "@/components/meeting-create-screen";
import { AdminOnlyRoute } from "@/components/route-guard";

export default function NewMeetingPage() {
  return (
    <AdminOnlyRoute>
      <MeetingCreateScreen />
    </AdminOnlyRoute>
  );
}
