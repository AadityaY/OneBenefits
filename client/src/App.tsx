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
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Router redirects to /auth by default
function Router() {
  const [location] = useLocation();
  
  return (
    <Switch>
      {/* Default route redirects to auth */}
      <Route path="/">
        <Redirect to="/auth" />
      </Route>
      
      {/* Dashboard is protected and requires login */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      
      {/* Admin dashboard - same component but with adminOnly flag */}
      <ProtectedRoute path="/admin" component={Dashboard} adminOnly={true} />
      
      {/* Company Settings - admin only */}
      <ProtectedRoute path="/company-settings" component={CompanySettings} adminOnly={true} />
      
      {/* Login/Registration page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* 404 Page */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
