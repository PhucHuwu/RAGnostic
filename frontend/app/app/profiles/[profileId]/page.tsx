import AppProfileDetails from "../../../../client/pages/AppProfileDetails";
import ClientRouteGuard from "../../../../client/components/auth/ClientRouteGuard";

export default function AppProfileDetailsPage() {
  return (
    <ClientRouteGuard mode="protected" requiredRole="USER">
      <AppProfileDetails />
    </ClientRouteGuard>
  );
}
