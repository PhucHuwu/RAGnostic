import AdminModel from "../../../client/pages/AdminModel";
import ClientRouteGuard from "../../../client/components/auth/ClientRouteGuard";

export default function AdminModelPage() {
  return (
    <ClientRouteGuard mode="protected" requiredRole="ADMIN">
      <AdminModel />
    </ClientRouteGuard>
  );
}
