import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import AuthPage from "@/pages/auth-page";
import CompanySettings from "@/pages/CompanySettings";
import DocumentViewerPage from "@/pages/DocumentViewerPage";
import SurveysPage from "@/pages/SurveysPage";
import ChatPage from "@/pages/ChatPage";
import CalendarPage from "@/pages/CalendarPage";
import ContentPage from "@/pages/ContentPage";
import ExplorePage from "@/pages/ExplorePage";
import BenefitDetailPage from "@/pages/BenefitDetailPage";
import VideosPage from "@/pages/VideosPage";
import HomePage from "@/pages/HomePage";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { CompanyThemeProvider } from "@/hooks/use-company-theme";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

// Layouts for different user types
import { ConsumerLayout } from "@/components/ConsumerLayout";

// Router with role-based redirects
function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Don't show the layout on auth page
  if (location === '/auth') {
    return <>{children}</>;
  }
  
  // Use consumer layout for regular users
  if (user && user.role === 'user') {
    return (
      <ConsumerLayout showHero={location === '/' || location === '/home'}>
        {children}
      </ConsumerLayout>
    );
  }
  
  // Use admin layout for admins and superadmins
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
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  
  // Show loading state while authentication is being determined
  if (isLoading && location === '/') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }
  
  // Handle root route redirects once user is loaded
  if (location === '/' && user) {
    // Redirect based on user role
    const isAdmin = user.role === "admin" || user.role === "superadmin";
    if (isAdmin) {
      return <Redirect to="/admin/surveys" />;
    } else {
      // Regular users go to home page 
      return <Redirect to="/home" />;
    }
  }
  
  // Redirect to auth if not logged in (except for auth page itself)
  if (!user && location !== '/auth' && location !== '/') {
    return <Redirect to="/auth" />;
  }
  
  return (
    <AppLayout>
      <Switch>
        {/* Root route handling with loading state */}
        <Route path="/">
          {isLoading ? (
            <div className="flex items-center justify-center h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : user ? (
            user.role === "admin" || user.role === "superadmin" ? 
            <Redirect to="/admin/surveys" /> : 
            <Redirect to="/home" />
          ) : (
            <Redirect to="/auth" />
          )}
        </Route>
        
        {/* User Dashboard Routes */}
        <Route path="/home">
          {user ? <HomePage /> : <Redirect to="/auth" />}
        </Route>
        <Route path="/explore">
          {user ? <ExplorePage /> : <Redirect to="/auth" />}
        </Route>
        <Route path="/benefits/:benefitId">
          {user ? <BenefitDetailPage /> : <Redirect to="/auth" />}
        </Route>
        <Route path="/chat">
          {user ? <ChatPage /> : <Redirect to="/auth" />}
        </Route>
        <Route path="/surveys">
          {user ? <SurveysPage /> : <Redirect to="/auth" />}
        </Route>
        <Route path="/videos">
          {user ? <VideosPage /> : <Redirect to="/auth" />}
        </Route>
        <Route path="/calendar">
          {user ? <CalendarPage /> : <Redirect to="/auth" />}
        </Route>
        <Route path="/content">
          {user ? <ContentPage /> : <Redirect to="/auth" />}
        </Route>
        
        {/* Admin Dashboard Routes */}
        <Route path="/admin/surveys">
          {user && (user.role === "admin" || user.role === "superadmin") ? 
            <Dashboard /> : <Redirect to="/auth" />}
        </Route>
        <Route path="/admin/analytics">
          {user && (user.role === "admin" || user.role === "superadmin") ? 
            <Dashboard /> : <Redirect to="/auth" />}
        </Route>
        <Route path="/admin/email">
          {user && (user.role === "admin" || user.role === "superadmin") ? 
            <Dashboard /> : <Redirect to="/auth" />}
        </Route>
        <Route path="/admin/events">
          {user && (user.role === "admin" || user.role === "superadmin") ? 
            <Dashboard /> : <Redirect to="/auth" />}
        </Route>
        <Route path="/admin/documents">
          {user && (user.role === "admin" || user.role === "superadmin") ? 
            <Dashboard /> : <Redirect to="/auth" />}
        </Route>
        <Route path="/admin/company-settings">
          {user && (user.role === "admin" || user.role === "superadmin") ? 
            <CompanySettings /> : <Redirect to="/auth" />}
        </Route>
        
        {/* Document Viewer Page */}
        <Route path="/document/:id">
          {user ? <DocumentViewerPage /> : <Redirect to="/auth" />}
        </Route>
        
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
