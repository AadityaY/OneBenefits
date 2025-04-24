import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import DocumentViewerComponent from "@/components/DocumentViewerComponent";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const DocumentViewerPage = () => {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute<{ id: string }>("/document/:id");
  const { user } = useAuth();
  
  // If not logged in, redirect to auth page
  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);
  
  // If no match or no params, show error
  if (!match || !params.id) {
    return (
      <div className="container mx-auto py-10 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Document Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The document you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => setLocation("/")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Return to Dashboard
        </Button>
      </div>
    );
  }
  
  // Parse document ID from params
  const documentId = parseInt(params.id);
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/content")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Documents
        </Button>
      </div>
      
      <DocumentViewerComponent documentId={documentId} />
    </div>
  );
};

export default DocumentViewerPage;