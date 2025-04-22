import { Document } from "@shared/schema";
import { FileText, Download, MoreVertical } from "lucide-react";
import { formatFileSize, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDocuments, deleteDocument } from "@/lib/documentApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function DocumentList() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: getDocuments
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document deleted",
        description: "The document has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
    }
  });
  
  const handleAddDocument = () => {
    document.getElementById("file-upload")?.click();
  };
  
  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Uploaded Benefits Documents</h2>
          <Button variant="ghost" size="sm" onClick={handleAddDocument}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Add Document
          </Button>
        </div>
        
        <div className="flex overflow-x-auto space-x-4 pb-2">
          {[1, 2].map(i => (
            <div key={i} className="flex-shrink-0 w-64">
              <Skeleton className="h-[140px] w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Uploaded Benefits Documents</h2>
        <Button variant="ghost" size="sm" className="text-primary" onClick={handleAddDocument}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Add Document
        </Button>
      </div>
      
      <div className="flex overflow-x-auto space-x-4 pb-2">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <div key={doc.id} className="flex-shrink-0 w-64 bg-white border border-slate-200 rounded-lg shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <FileText className="text-slate-500 mr-2 h-5 w-5" />
                  <h3 className="font-medium">{doc.originalName.split('.').slice(0, -1).join('.')}</h3>
                </div>
                <div className="flex">
                  <button className="text-slate-400 hover:text-slate-600">
                    <Download className="h-4 w-4" />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="ml-2 text-slate-400 hover:text-slate-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => deleteMutation.mutate(doc.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-2">Uploaded on {formatDate(doc.uploadedAt)}</p>
              <div className="flex items-center text-xs">
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Processed</Badge>
                <span className="text-slate-400 mx-2">|</span>
                <span className="text-slate-500">
                  {doc.mimeType.includes('pdf') ? 'PDF' : doc.mimeType.includes('word') ? 'DOCX' : 'Document'} • {formatFileSize(doc.size)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full text-center py-8 text-slate-500">
            No documents uploaded yet. Click "Add Document" to get started.
          </div>
        )}
      </div>
    </div>
  );
}
