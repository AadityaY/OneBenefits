import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar, User, Info, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface Document {
  id: number;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  title: string | null;
  description: string | null;
  isPublic: boolean;
  category: string | null;
  uploadedAt: string;
  uploadedBy: number | null;
}

interface DocumentViewerComponentProps {
  documentId: number;
}

const DocumentViewerComponent = ({ documentId }: DocumentViewerComponentProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Fetch document details
  const { data: document, isLoading, isError } = useQuery({
    queryKey: ["/api/documents", documentId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/documents/${documentId}`);
      return response.json() as Promise<Document>;
    }
  });

  useEffect(() => {
    if (document) {
      // Create URL for the PDF file
      setPdfUrl(`/uploads/${document.fileName}`);
    }
    
    return () => {
      // Clean up URL when component unmounts
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [document]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">Document Not Found</h3>
        <p className="text-muted-foreground max-w-md">
          We couldn't find the document you're looking for. It may have been moved or deleted.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Viewer - Takes up 2/3 of the space on larger screens */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle>{document.title || document.originalName}</CardTitle>
              {document.description && (
                <CardDescription>{document.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-full min-h-[600px] border rounded overflow-hidden">
                {document.mimeType.includes("pdf") ? (
                  <iframe 
                    src={`${pdfUrl}#toolbar=0&navpanes=0`} 
                    className="w-full h-full min-h-[600px]"
                    title={document.title || document.originalName}
                  />
                ) : document.mimeType.includes("image") ? (
                  <img 
                    src={pdfUrl || ""} 
                    alt={document.title || document.originalName}
                    className="max-w-full max-h-full object-contain mx-auto"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      This file type cannot be previewed. <a href={pdfUrl || ""} download className="text-primary hover:underline">Download</a> to view.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Info Panel - Takes up 1/3 of the space on larger screens */}
        <div>
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="metadata" className="flex-1">Metadata</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="pt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">Document Title</h4>
                        <p className="text-sm text-muted-foreground">
                          {document.title || document.originalName}
                        </p>
                      </div>
                    </div>
                    
                    {document.description && (
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium">Description</h4>
                          <p className="text-sm text-muted-foreground">
                            {document.description}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">Upload Date</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(document.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <User className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">Visibility</h4>
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <div
                            className={`h-2 w-2 rounded-full mr-2 ${
                              document.isPublic ? "bg-green-500" : "bg-amber-500"
                            }`}
                          />
                          {document.isPublic ? "Public" : "Admin Only"}
                        </p>
                      </div>
                    </div>
                    
                    {document.category && (
                      <div className="flex items-start">
                        <FileText className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium">Category</h4>
                          <Badge variant="outline" className="mt-1">
                            {document.category}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="metadata" className="pt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">File Name</h4>
                        <p className="text-sm text-muted-foreground">
                          {document.originalName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">File Type</h4>
                        <p className="text-sm text-muted-foreground">
                          {document.mimeType}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">File Size</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(document.size)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Eye className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">Access Information</h4>
                        <p className="text-sm text-muted-foreground">
                          This document is{" "}
                          {document.isPublic
                            ? "available to all users"
                            : "only accessible to administrators"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Document ID</p>
                    <p className="text-sm font-mono">#{document.id}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerComponent;