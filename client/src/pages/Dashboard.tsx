import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import SurveyAdminTab from "@/components/SurveyAdminTab";
import SurveyTakingTab from "@/components/SurveyTakingTab";
import AnalyticsTab from "@/components/AnalyticsTab";
import ChatTab from "@/components/ChatTab";
import CalendarTab from "@/components/CalendarTab";
import DocumentManagementTab from "@/components/DocumentManagementTab";
import DocumentsListComponent from "@/components/DocumentsListComponent";
import { FileText } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Determine if user is admin or superadmin for access control
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  
  // Get the current tab based on location
  const renderContent = () => {
    // User routes
    if (location === "/take-survey") {
      return (
        <div className="space-y-8">
          <PageHeader 
            title="Take Survey" 
            description="Complete your benefits surveys to help us improve your experience."
          />
          <SurveyTakingTab />
        </div>
      );
    }
    
    if (location === "/chat") {
      return (
        <div className="space-y-8">
          <PageHeader 
            title="Benefits Chat" 
            description="Have questions about your benefits? Ask our AI assistant."
          />
          <ChatTab />
        </div>
      );
    }
    
    if (location === "/calendar") {
      return (
        <div className="space-y-8">
          <PageHeader 
            title="Benefits Calendar" 
            description="View upcoming benefits events and important dates."
          />
          <CalendarTab />
        </div>
      );
    }
    
    if (location === "/content") {
      return (
        <div className="space-y-8">
          <PageHeader 
            title="Benefits Content" 
            description="Access your benefits documentation and resources."
          />
          <DocumentsListComponent />
        </div>
      );
    }
    
    // Admin routes
    if (location === "/admin/surveys" && isAdmin) {
      return (
        <div className="space-y-8">
          <PageHeader 
            title="Survey Administration" 
            description="Create, edit, and manage employee surveys."
          />
          <SurveyAdminTab />
        </div>
      );
    }
    
    if (location === "/admin/analytics" && isAdmin) {
      return (
        <div className="space-y-8">
          <PageHeader 
            title="Analytics Dashboard" 
            description="View survey results and employee engagement metrics."
          />
          <AnalyticsTab />
        </div>
      );
    }
    
    if (location === "/admin/documents" && isAdmin) {
      return (
        <div className="space-y-8">
          <PageHeader 
            title="Document Management" 
            description="Upload and manage benefits documentation."
          />
          <DocumentManagementTab />
        </div>
      );
    }
    
    if ((location === "/admin/email" || 
         location === "/admin/events") && isAdmin) {
      const titles = {
        "/admin/email": "Email Campaigns",
        "/admin/events": "Events Management"
      };
      
      const descriptions = {
        "/admin/email": "Create and manage email campaigns for your employees.",
        "/admin/events": "Schedule and manage employee benefits events."
      };
      
      return (
        <div className="space-y-8">
          <PageHeader 
            title={titles[location]} 
            description={descriptions[location]}
          />
          <div className="frost-glass p-8 rounded-lg flex flex-col items-center justify-center min-h-[300px]">
            <FileText className="h-16 w-16 text-primary/50 mb-4" />
            <h3 className="text-xl font-medium mb-2">Coming Soon</h3>
            <p className="text-muted-foreground text-center max-w-md">
              This feature is currently under development. Check back soon for updates.
            </p>
          </div>
        </div>
      );
    }
    
    // Default or fallback content
    return (
      <div className="space-y-8">
        <PageHeader 
          title="Dashboard" 
          description="Select an option from the sidebar to get started."
        />
      </div>
    );
  };

  return (
    <div className="p-6 pt-1">
      {renderContent()}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description: string;
}

function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
        {title}
      </h1>
      <p className="text-muted-foreground">
        {description}
      </p>
    </div>
  );
}