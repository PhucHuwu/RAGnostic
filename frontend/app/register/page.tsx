import Register from "../../client/pages/Register";
import ClientRouteGuard from "../../client/components/auth/ClientRouteGuard";

export default function RegisterPage() {
  return (
    <ClientRouteGuard mode="public-only">
      <Register />
    </ClientRouteGuard>
  );
}
