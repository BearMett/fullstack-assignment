import { AdminNavbar } from "@/components/admin-navbar";
import { AdminOnlyRoute } from "@/components/route-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminOnlyRoute>
      <AdminNavbar />
      {children}
    </AdminOnlyRoute>
  );
}
