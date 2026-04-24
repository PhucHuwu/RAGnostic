import AdminUsers from "../../../client/pages/AdminUsers";
import ClientRouteGuard from "../../../client/components/auth/ClientRouteGuard";

export default function AdminUsersPage() {
  return (
    <ClientRouteGuard mode="protected" requiredRole="ADMIN">
      <AdminUsers />
    </ClientRouteGuard>
  );
}
