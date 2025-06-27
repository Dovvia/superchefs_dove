import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<"admin" | "staff" | "manager" | "baker" | "cook" | "sales_rep" | "procurement" | "quality_control" | "accountant">;
}

const RoleProtectedRoute = ({
  children,
  allowedRoles,
}: RoleProtectedRouteProps) => {
  const { session, userRoles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>; // Or a spinner
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const hasRequiredRole = Array.isArray(userRoles)
    ? userRoles.some((role) => allowedRoles.includes(role))
    : allowedRoles.includes(
        userRoles as unknown as "admin" | "staff" | "manager" | "baker" | "cook" | "sales_rep" | "procurement" | "quality_control" | "accountant"
      );
  if (!hasRequiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
