import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SurveyAdminTab from "@/components/SurveyAdminTab";
import SurveyTakingTab from "@/components/SurveyTakingTab";
import AnalyticsTab from "@/components/AnalyticsTab";
import ChatTab from "@/components/ChatTab";
import CalendarTab from "@/components/CalendarTab";

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
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 gradient-heading">
            {showAdminTabs ? "Administration Dashboard" : "Employee Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            {showAdminTabs 
              ? "Manage surveys, view analytics, and handle employee requests" 
              : "Access your benefits information, take surveys, and view upcoming events"}
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-background/50 backdrop-blur-sm border-gradient p-1">
            {/* Only show admin tabs if user is admin and on the admin page */}
            {showAdminTabs && (
              <TabsTrigger value="survey-admin" className="hover-lift">Survey Administration</TabsTrigger>
            )}
            
            {/* Always show the survey taking tab */}
            <TabsTrigger value="take-survey" className="hover-lift">Take Survey</TabsTrigger>
            
            {/* Only show analytics to admins */}
            {showAdminTabs && (
              <TabsTrigger value="analytics" className="hover-lift">Analytics</TabsTrigger>
            )}
            
            {/* Always show chat tab for all users */}
            <TabsTrigger value="chat" className="hover-lift">Benefits Chat</TabsTrigger>
            
            {/* Always show calendar tab for all users */}
            <TabsTrigger value="calendar" className="hover-lift">Calendar</TabsTrigger>
          </TabsList>
          
          {/* Tab contents */}
          {showAdminTabs && (
            <TabsContent value="survey-admin" className="space-y-4 pt-4">
              <div className="p-1 rounded-lg">
                <SurveyAdminTab />
              </div>
            </TabsContent>
          )}
          
          <TabsContent value="take-survey" className="space-y-4 pt-4">
            <div className="p-1 rounded-lg">
              <SurveyTakingTab />
            </div>
          </TabsContent>
          
          {showAdminTabs && (
            <TabsContent value="analytics" className="space-y-4 pt-4">
              <div className="p-1 rounded-lg">
                <AnalyticsTab />
              </div>
            </TabsContent>
          )}
          
          <TabsContent value="chat" className="space-y-4 pt-4">
            <div className="p-1 rounded-lg">
              <ChatTab />
            </div>
          </TabsContent>
          
          <TabsContent value="calendar" className="space-y-4 pt-4">
            <div className="p-1 rounded-lg">
              <CalendarTab />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}