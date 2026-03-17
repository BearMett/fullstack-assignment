import { MyApplicationsScreen } from "@/components/my-applications-screen";
import { SiteNavbar } from "@/components/site-navbar";
import { ProtectedRoute } from "@/components/route-guard";

export default function MyApplicationsPage() {
  return (
    <ProtectedRoute>
      <SiteNavbar />
      <MyApplicationsScreen />
    </ProtectedRoute>
  );
}
