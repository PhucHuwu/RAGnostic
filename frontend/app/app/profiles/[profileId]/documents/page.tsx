import AppDocuments from "../../../../../client/pages/AppDocuments";
import ClientRouteGuard from "../../../../../client/components/auth/ClientRouteGuard";

export default function AppDocumentsPage() {
  return (
    <ClientRouteGuard mode="protected" requiredRole="USER">
      <AppDocuments />
    </ClientRouteGuard>
  );
}
