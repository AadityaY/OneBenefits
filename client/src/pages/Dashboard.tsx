import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DocumentList from "@/components/DocumentList";
import SurveyAdminTab from "@/components/SurveyAdminTab";
import SurveyResponseTab from "@/components/SurveyResponseTab";
import SurveyAnalyticsTab from "@/components/SurveyAnalyticsTab";
import ChatbotTab from "@/components/ChatbotTab";
import CalendarTab from "@/components/CalendarTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, Calendar, BarChart, ClipboardEdit, FileSpreadsheet, LogOut, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDocuments } from "@/lib/documentApi";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const { user, isAdmin, logoutMutation } = useAuth();
  
  // Default tab is different based on user role
  const defaultTab = isAdmin ? "survey" : "surveyResponse";
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Check if documents exist
  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: getDocuments
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Benefits Dashboard</h1>
            <p className="text-gray-500">
              Welcome, {user?.username}
              {isAdmin && <Badge className="ml-2 bg-primary">Admin</Badge>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setLocation('/company-settings')}
              >
                <Settings className="h-4 w-4" />
                Company Settings
              </Button>
            )}
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>

        {/* Document list only shown to admins */}
        {isAdmin && <DocumentList />}
        
        <Tabs defaultValue={defaultTab} value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-slate-200">
              <TabsList className="h-auto bg-transparent w-full justify-start rounded-none">
                {/* Admin tabs */}
                {isAdmin && (
                  <TabsTrigger 
                    value="survey" 
                    className="flex items-center data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-6 py-4 rounded-none"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Survey Admin
                  </TabsTrigger>
                )}
                
                {/* User and Admin tabs */}
                <TabsTrigger 
                  value="surveyResponse"
                  className="flex items-center data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-6 py-4 rounded-none"
                >
                  <ClipboardEdit className="h-4 w-4 mr-2" />
                  Take Survey
                </TabsTrigger>
                
                {/* Admin tabs */}
                {isAdmin && (
                  <TabsTrigger 
                    value="surveyAnalytics"
                    className="flex items-center data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-6 py-4 rounded-none"
                  >
                    <BarChart className="h-4 w-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                )}
                
                {/* User and Admin tabs */}
                <TabsTrigger 
                  value="chatbot"
                  className="flex items-center data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-6 py-4 rounded-none"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Document Chat
                </TabsTrigger>
                
                {/* Admin only tab */}
                {isAdmin && (
                  <TabsTrigger 
                    value="calendar"
                    className="flex items-center data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-6 py-4 rounded-none"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
            
            {/* Admin tab content */}
            {isAdmin && (
              <TabsContent value="survey" className="p-6">
                <SurveyAdminTab />
              </TabsContent>
            )}
            
            {/* User and Admin tab content */}
            <TabsContent value="surveyResponse" className="p-6">
              <SurveyResponseTab />
            </TabsContent>
            
            {/* Admin tab content */}
            {isAdmin && (
              <TabsContent value="surveyAnalytics" className="p-6">
                <SurveyAnalyticsTab />
              </TabsContent>
            )}
            
            {/* User and Admin tab content */}
            <TabsContent value="chatbot" className="p-6">
              <ChatbotTab />
            </TabsContent>
            
            {/* Admin only tab content */}
            {isAdmin && (
              <TabsContent value="calendar" className="p-6">
                <CalendarTab />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
