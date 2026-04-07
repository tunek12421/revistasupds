import { Navigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";

export default function AdminRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  // Wait for user to be loaded
  if (!user) {
    return null;
  }
  if (!user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
