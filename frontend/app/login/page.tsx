import Login from "../../client/pages/Login";
import ClientRouteGuard from "../../client/components/auth/ClientRouteGuard";

export default function LoginPage() {
  return (
    <ClientRouteGuard mode="public-only">
      <Login />
    </ClientRouteGuard>
  );
}
