import AppProfiles from "../../../client/pages/AppProfiles";
import ClientRouteGuard from "../../../client/components/auth/ClientRouteGuard";

export default function AppProfilesPage() {
  return (
    <ClientRouteGuard mode="protected" requiredRole="USER">
      <AppProfiles />
    </ClientRouteGuard>
  );
}
