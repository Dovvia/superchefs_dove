import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<"admin" | "staff" | "manager">;
}

const RoleProtectedRoute = ({
  children,
  allowedRoles,
}: RoleProtectedRouteProps) => {
  const { session, userRoles } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const hasRequiredRole = Array.isArray(userRoles)
    ? userRoles.some((role) => allowedRoles.includes(role))
    : allowedRoles.includes(
        userRoles as unknown as "admin" | "staff" | "manager"
      );
  if (!hasRequiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
