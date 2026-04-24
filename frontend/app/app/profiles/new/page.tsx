import AppProfileNew from "../../../../client/pages/AppProfileNew";
import ClientRouteGuard from "../../../../client/components/auth/ClientRouteGuard";

export default function AppProfileNewPage() {
  return (
    <ClientRouteGuard mode="protected" requiredRole="USER">
      <AppProfileNew />
    </ClientRouteGuard>
  );
}
