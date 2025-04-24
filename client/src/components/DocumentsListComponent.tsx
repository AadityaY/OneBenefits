import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Search, Filter, File, ArrowUpDown, Calendar, FileQuestion } from "lucide-react";

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

const DocumentsListComponent = () => {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "name">("newest");
  
  // Fetch all public documents
  const { data: documents = [], isLoading, isError } = useQuery({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/documents");
      const data = await response.json() as Document[];
      console.log("Documents fetched:", data); // Debug log
      return data;
    }
  });
  
  // Filter and sort documents
  const filteredAndSortedDocuments = documents
    // Apply search filter
    .filter(doc => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        (doc.title?.toLowerCase().includes(searchLower) || false) ||
        (doc.description?.toLowerCase().includes(searchLower) || false) ||
        doc.originalName.toLowerCase().includes(searchLower) ||
        (doc.category?.toLowerCase().includes(searchLower) || false)
      );
    })
    // Apply category filter
    .filter(doc => {
      if (!categoryFilter) return true;
      return doc.category === categoryFilter;
    })
    // Apply sorting
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      } else if (sortOrder === "oldest") {
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      } else {
        // Sort by name (title or original name)
        const nameA = (a.title || a.originalName).toLowerCase();
        const nameB = (b.title || b.originalName).toLowerCase();
        return nameA.localeCompare(nameB);
      }
    });
  
  // Get unique categories for filter dropdown
  const categoriesSet = new Set<string>();
  documents.forEach(doc => {
    if (doc.category) categoriesSet.add(doc.category);
  });
  const categories = Array.from(categoriesSet);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return <FileText className="h-10 w-10 text-red-500" />;
    if (mimeType.includes("image")) return <FileText className="h-10 w-10 text-blue-500" />;
    if (mimeType.includes("word") || mimeType.includes("document")) return <FileText className="h-10 w-10 text-blue-700" />;
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return <FileText className="h-10 w-10 text-green-700" />;
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return <FileText className="h-10 w-10 text-orange-600" />;
    return <File className="h-10 w-10 text-gray-500" />;
  };

  const handleViewDocument = (id: number) => {
    setLocation(`/document/${id}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="frost-glass rounded-lg p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="w-40">
              <Select
                value={categoryFilter || "all_categories"}
                onValueChange={(value) => setCategoryFilter(value === "all_categories" ? null : value)}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>{categoryFilter || "All Categories"}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_categories">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-36">
              <Select
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as "newest" | "oldest" | "name")}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <span>Sort By</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-destructive">Error loading documents</p>
        </div>
      ) : filteredAndSortedDocuments.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-60 border rounded-lg border-dashed">
          <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No documents found</h3>
          <p className="text-muted-foreground text-sm">
            {searchTerm || categoryFilter
              ? "Try adjusting your search or filters"
              : "No documents are available at this time"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedDocuments.map((document) => (
            <Card key={document.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  {getFileIcon(document.mimeType)}
                  <div>
                    <CardTitle className="text-lg line-clamp-1">
                      {document.title || document.originalName}
                    </CardTitle>
                    <CardDescription className="line-clamp-1">
                      {formatFileSize(document.size)} • {formatDate(document.uploadedAt)}
                    </CardDescription>
                  </div>
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
                <div>
                  {document.category && (
                    <Badge variant="outline">
                      {document.category}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleViewDocument(document.id)}
                >
                  <FileText className="h-4 w-4" />
                  View
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsListComponent;