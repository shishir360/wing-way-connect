import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        // Redirect to login if not authenticated
        // For admin, redirect to admin login. For others, generic auth.
        if (location.pathname.startsWith('/admin')) {
            return <Navigate to="/admin/login" state={{ from: location }} replace />;
        }
        if (location.pathname.startsWith('/agent')) {
            return <Navigate to="/agent/login" state={{ from: location }} replace />;
        }
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // STRICT: If role is not yet loaded or not found, do not let them pass
    // (AuthContext handles loading=true, but if loading=false and role=null, we need to handle it)
    if (allowedRoles && (!role || !allowedRoles.includes(role))) {
        // Redirect logic to authorized area based on role
        if (role === 'admin') return <Navigate to="/admin" replace />;
        if (role === 'agent') return <Navigate to="/agent" replace />;
        if (role === 'user') return <Navigate to="/dashboard" replace />;

        // Fallback: If role is null/unknown, force re-login (Safe Default)
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
