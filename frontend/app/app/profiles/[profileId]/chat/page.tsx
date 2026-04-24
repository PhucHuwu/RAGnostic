import AppChat from "../../../../../client/pages/AppChat";
import ClientRouteGuard from "../../../../../client/components/auth/ClientRouteGuard";

export default function AppChatPage() {
  return (
    <ClientRouteGuard mode="protected" requiredRole="USER">
      <AppChat />
    </ClientRouteGuard>
  );
}
