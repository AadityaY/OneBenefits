import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger, 
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, MoreVertical, Trash2, Edit, FileText, Eye, EyeOff, File, FilePlus } from "lucide-react";

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

const DocumentManagementTab = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploadFormData, setUploadFormData] = useState({
    title: "",
    description: "",
    category: "general",
    isPublic: false,
    selectedFiles: [] as File[]
  });

  // Fetch documents
  const { data: documents = [], isLoading, isError } = useQuery({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/documents");
      return response.json() as Promise<Document[]>;
    }
  });

  // Upload documents mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload documents");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Documents uploaded",
        description: "Your documents have been uploaded successfully.",
        variant: "default",
      });
      resetUploadForm();
      setUploadDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/documents/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document deleted",
        description: "The document has been deleted successfully.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update document mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Document> }) => {
      const response = await apiRequest("PATCH", `/api/documents/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document updated",
        description: "The document has been updated successfully.",
        variant: "default",
      });
      setSelectedDocument(null);
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Toggle public status mutation
  const togglePublicMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: number, isPublic: boolean }) => {
      const response = await apiRequest("PATCH", `/api/documents/${id}`, { isPublic });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update availability",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadFormData({
        ...uploadFormData,
        selectedFiles: Array.from(e.target.files)
      });
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFormData.selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    uploadFormData.selectedFiles.forEach(file => {
      formData.append("documents", file);
    });
    
    formData.append("title", uploadFormData.title);
    formData.append("description", uploadFormData.description);
    formData.append("category", uploadFormData.category);
    formData.append("isPublic", uploadFormData.isPublic.toString());
    
    uploadMutation.mutate(formData);
  };

  const handleEditDocument = (document: Document) => {
    setSelectedDocument(document);
    setEditDialogOpen(true);
  };

  const handleUpdateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocument) return;

    updateMutation.mutate({
      id: selectedDocument.id,
      data: {
        title: selectedDocument.title,
        description: selectedDocument.description,
        category: selectedDocument.category,
        isPublic: selectedDocument.isPublic
      }
    });
  };

  const resetUploadForm = () => {
    setUploadFormData({
      title: "",
      description: "",
      category: "general",
      isPublic: false,
      selectedFiles: []
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return <FileText className="h-10 w-10 text-red-500" />;
    if (mimeType.includes("image")) return <FileText className="h-10 w-10 text-blue-500" />;
    if (mimeType.includes("word") || mimeType.includes("document")) return <FileText className="h-10 w-10 text-blue-700" />;
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return <FileText className="h-10 w-10 text-green-700" />;
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return <FileText className="h-10 w-10 text-orange-600" />;
    return <File className="h-10 w-10 text-gray-500" />;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-muted-foreground">Upload and manage documents for your company</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <FilePlus className="h-4 w-4" />
              Upload Documents
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
              <DialogDescription>
                Upload documents to share with your team. Documents marked as public will be visible to all users.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Select files</Label>
                <Input 
                  id="file" 
                  type="file" 
                  onChange={handleFileChange} 
                  multiple 
                  className="py-1.5"
                />
                {uploadFormData.selectedFiles.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {uploadFormData.selectedFiles.length} file(s) selected
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={uploadFormData.title} 
                  onChange={(e) => setUploadFormData({...uploadFormData, title: e.target.value})}
                  placeholder="Enter document title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={uploadFormData.description} 
                  onChange={(e) => setUploadFormData({...uploadFormData, description: e.target.value})}
                  placeholder="Enter document description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category" 
                  value={uploadFormData.category} 
                  onChange={(e) => setUploadFormData({...uploadFormData, category: e.target.value})}
                  placeholder="e.g., Benefits, Policies, Training"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isPublic" 
                  checked={uploadFormData.isPublic} 
                  onCheckedChange={(checked) => setUploadFormData({...uploadFormData, isPublic: checked})}
                />
                <Label htmlFor="isPublic">Make available to all users</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-destructive">Error loading documents</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-60 border rounded-lg border-dashed">
          <File className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No documents yet</h3>
          <p className="text-muted-foreground text-sm">Upload your first document to get started</p>
          <Button className="mt-4" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((document) => (
            <Card key={document.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getFileIcon(document.mimeType)}
                    <div>
                      <CardTitle className="text-lg line-clamp-1">
                        {document.title || document.originalName}
                      </CardTitle>
                      <CardDescription className="line-clamp-1">
                        {formatFileSize(document.size)} • {new Date(document.uploadedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditDocument(document)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => togglePublicMutation.mutate({ 
                          id: document.id, 
                          isPublic: !document.isPublic 
                        })}
                      >
                        {document.isPublic ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Make Private
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Make Public
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this document?")) {
                            deleteMutation.mutate(document.id);
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {document.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {document.description}
                  </p>
                )}
              </CardContent>
              <CardFooter className="pt-1 flex justify-between items-center">
                <div className="flex items-center">
                  <div
                    className={`h-2.5 w-2.5 rounded-full mr-2 ${
                      document.isPublic ? "bg-green-500" : "bg-amber-500"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {document.isPublic ? "Public" : "Admin Only"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {document.category && (
                    <span className="px-2 py-0.5 bg-secondary rounded-full">
                      {document.category}
                    </span>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Document Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update document details and availability.
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <form onSubmit={handleUpdateDocument} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input 
                  id="edit-title" 
                  value={selectedDocument.title || ""} 
                  onChange={(e) => setSelectedDocument({...selectedDocument, title: e.target.value})}
                  placeholder="Enter document title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  value={selectedDocument.description || ""} 
                  onChange={(e) => setSelectedDocument({...selectedDocument, description: e.target.value})}
                  placeholder="Enter document description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input 
                  id="edit-category" 
                  value={selectedDocument.category || ""} 
                  onChange={(e) => setSelectedDocument({...selectedDocument, category: e.target.value})}
                  placeholder="e.g., Benefits, Policies, Training"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="edit-isPublic" 
                  checked={selectedDocument.isPublic} 
                  onCheckedChange={(checked) => setSelectedDocument({...selectedDocument, isPublic: checked})}
                />
                <Label htmlFor="edit-isPublic">Make available to all users</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentManagementTab;