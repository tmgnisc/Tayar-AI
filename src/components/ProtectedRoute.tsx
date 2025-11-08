import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, token } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading...</div>
          <div className="text-muted-foreground">Verifying your session...</div>
        </div>
      </div>
    );
  }

  // If no user after loading is complete, redirect to login
  // Check both user and token - if we have a token, we might still be loading user data
  if (!user) {
    // If we have a token but no user, it might mean the token is invalid
    // But we'll let the auth context handle that - just redirect to login
    return <Navigate to="/auth/signin" replace />;
  }

  // Check admin requirement
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}


