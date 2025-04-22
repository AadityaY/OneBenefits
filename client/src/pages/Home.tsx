import { useEffect } from "react";
import { useLocation } from "wouter";
import DocumentUpload from "@/components/DocumentUpload";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { getDocuments } from "@/lib/documentApi";

export default function Home() {
  const [_, setLocation] = useLocation();
  
  // Check if documents exist, if so redirect to dashboard
  const { data: documents } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: getDocuments
  });
  
  useEffect(() => {
    if (documents && documents.length > 0) {
      setLocation("/dashboard");
    }
  }, [documents, setLocation]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        <DocumentUpload />
      </main>
      <Footer />
    </div>
  );
}
