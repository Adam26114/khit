import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminLayoutShell } from "@/components/admin/layout-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </AdminGuard>
  );
}
