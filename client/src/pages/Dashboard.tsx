import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Creating simple fallback components if the actual tab components don't exist
const SurveyAdminTab = () => {
  return <div className="p-4 border rounded-lg">
    <h2 className="text-xl font-semibold mb-4">Survey Administration</h2>
    <p>This panel will allow administrators to create and manage survey templates and questions.</p>
  </div>;
};

const SurveyTakingTab = () => {
  return <div className="p-4 border rounded-lg">
    <h2 className="text-xl font-semibold mb-4">Take Survey</h2>
    <p>Available surveys for completion will appear here.</p>
  </div>;
};

const AnalyticsTab = () => {
  return <div className="p-4 border rounded-lg">
    <h2 className="text-xl font-semibold mb-4">Analytics Dashboard</h2>
    <p>Survey response analytics and reporting will be displayed here.</p>
  </div>;
};

const ChatTab = () => {
  return <div className="p-4 border rounded-lg">
    <h2 className="text-xl font-semibold mb-4">Benefits Chat Assistant</h2>
    <p>Ask questions about your benefits and receive instant responses.</p>
  </div>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Determine if this is the admin view based on URL
  const isAdminView = location === "/admin";
  
  // Determine if user is admin or superadmin for access control
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  
  // Only show admin tabs if user is admin and on the admin page
  const showAdminTabs = isAdmin && isAdminView;
  
  // Set default tab based on user role and location
  const defaultTab = showAdminTabs ? "survey-admin" : "take-survey";
  
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">
          {showAdminTabs ? "Administration Dashboard" : "Employee Dashboard"}
        </h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            {/* Only show admin tabs if user is admin and on the admin page */}
            {showAdminTabs && (
              <TabsTrigger value="survey-admin">Survey Administration</TabsTrigger>
            )}
            
            {/* Always show the survey taking tab */}
            <TabsTrigger value="take-survey">Take Survey</TabsTrigger>
            
            {/* Only show analytics to admins */}
            {showAdminTabs && (
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            )}
            
            {/* Always show chat tab for all users */}
            <TabsTrigger value="chat">Benefits Chat</TabsTrigger>
          </TabsList>
          
          {/* Tab contents */}
          {showAdminTabs && (
            <TabsContent value="survey-admin" className="space-y-4">
              <SurveyAdminTab />
            </TabsContent>
          )}
          
          <TabsContent value="take-survey" className="space-y-4">
            <SurveyTakingTab />
          </TabsContent>
          
          {showAdminTabs && (
            <TabsContent value="analytics" className="space-y-4">
              <AnalyticsTab />
            </TabsContent>
          )}
          
          <TabsContent value="chat" className="space-y-4">
            <ChatTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}