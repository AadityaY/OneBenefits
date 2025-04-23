import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useRoute } from "wouter";

type Role = "user" | "admin" | "superadmin";

export function ProtectedRoute({
  path,
  component: Component,
  roles = ["user", "admin", "superadmin"],
}: {
  path: string;
  component: React.ComponentType;
  roles?: Role[];
}) {
  const { user, isLoading } = useAuth();
  const [isMatch] = useRoute(path);

  if (!isMatch) {
    return null;
  }

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if user has the required role
  if (!roles.includes(user.role as Role)) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8 text-center">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Go Back
          </button>
        </div>
      </Route>
    );
  }

  return <Component />;
}