import AdminDocuments from "../../../client/pages/AdminDocuments";
import ClientRouteGuard from "../../../client/components/auth/ClientRouteGuard";

export default function AdminDocumentsPage() {
  return (
    <ClientRouteGuard mode="protected" requiredRole="ADMIN">
      <AdminDocuments />
    </ClientRouteGuard>
  );
}
