import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import AuthPage from "@/pages/auth-page";
import CompanySettings from "@/pages/CompanySettings";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { CompanyThemeProvider } from "@/hooks/use-company-theme";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

// Router with role-based redirects
function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Don't show the layout on auth page
  if (location === '/auth') {
    return <>{children}</>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      {user && <Sidebar />}
      <div className="flex flex-col md:ml-64">
        {user && <Header />}
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}

function Router() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Handle root route redirects based on user role
  if (location === '/') {
    // If user is logged in, redirect to appropriate dashboard
    if (user) {
      const isAdmin = user.role === "admin" || user.role === "superadmin";
      if (isAdmin) {
        return <Redirect to="/admin" />;
      } else {
        return <Redirect to="/dashboard" />;
      }
    } else {
      // If not logged in, redirect to auth page
      return <Redirect to="/auth" />;
    }
  }
  
  return (
    <AppLayout>
      <Switch>
        {/* Dashboard is protected and requires login */}
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        
        {/* Admin dashboard - only for admins and superadmins */}
        <ProtectedRoute path="/admin" component={Dashboard} roles={["admin", "superadmin"]} />
        
        {/* Company Settings - only for admins and superadmins */}
        <ProtectedRoute path="/company-settings" component={CompanySettings} roles={["admin", "superadmin"]} />
        
        {/* Login/Registration page */}
        <Route path="/auth" component={AuthPage} />
        
        {/* 404 Page */}
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <CompanyThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </CompanyThemeProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
