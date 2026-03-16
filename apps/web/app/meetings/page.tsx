import { MeetingsBrowser } from "@/components/meetings-browser";
import { ProtectedRoute } from "@/components/route-guard";

export default function MeetingsPage() {
  return (
    <ProtectedRoute>
      <MeetingsBrowser />
    </ProtectedRoute>
  );
}
