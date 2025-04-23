import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DocumentList from "@/components/DocumentList";
import SurveyAdminTab from "@/components/SurveyAdminTab";
import ChatbotTab from "@/components/ChatbotTab";
import CalendarTab from "@/components/CalendarTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDocuments } from "@/lib/documentApi";

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("survey");
  
  // Check if documents exist, if not redirect to home page
  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: getDocuments
  });
  
  // Temporarily disabled the redirect to allow viewing the survey
  // useEffect(() => {
  //   if (!isLoading && (!documents || documents.length === 0)) {
  //     setLocation("/");
  //   }
  // }, [documents, isLoading, setLocation]);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        <DocumentList />
        
        <Tabs defaultValue="survey" value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-slate-200">
              <TabsList className="h-auto bg-transparent w-full justify-start rounded-none">
                <TabsTrigger 
                  value="survey" 
                  className="flex items-center data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-6 py-4 rounded-none"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Survey Admin
                </TabsTrigger>
                <TabsTrigger 
                  value="chatbot"
                  className="flex items-center data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-6 py-4 rounded-none"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Document Chat
                </TabsTrigger>
                <TabsTrigger 
                  value="calendar"
                  className="flex items-center data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent px-6 py-4 rounded-none"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Engagement Calendar
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="survey" className="p-6">
              <SurveyAdminTab />
            </TabsContent>
            
            <TabsContent value="chatbot" className="p-6">
              <ChatbotTab />
            </TabsContent>
            
            <TabsContent value="calendar" className="p-6">
              <CalendarTab />
            </TabsContent>
          </div>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
