import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CloudUpload, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatFileSize } from "@/lib/utils";
import { uploadDocuments } from "@/lib/documentApi";
import { useLocation } from "wouter";

export default function DocumentUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(file => 
        ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
      );
      
      if (newFiles.length !== e.dataTransfer.files.length) {
        toast({
          title: "Invalid file type",
          description: "Only PDF and Word documents are supported.",
          variant: "destructive",
        });
      }
      
      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);
      }
    }
  }, [toast]);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(file => 
        ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
      );
      
      if (newFiles.length !== e.target.files.length) {
        toast({
          title: "Invalid file type",
          description: "Only PDF and Word documents are supported.",
          variant: "destructive",
        });
      }
      
      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);
      }
    }
  }, [toast]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const processFiles = useCallback(async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      await uploadDocuments(files);
      
      toast({
        title: "Upload successful",
        description: `${files.length} document${files.length > 1 ? 's' : ''} uploaded successfully.`,
      });
      
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error uploading the documents.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [files, toast, setLocation]);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-3">Employee Benefits Document Upload</h2>
        <p className="text-slate-600 max-w-xl mx-auto">
          Upload your employee benefits documentation to get started. We'll analyze the content and set up your benefits portal.
        </p>
      </div>
      
      <Card className="w-full max-w-xl">
        <div
          className={`border-2 border-dashed ${isDragging ? 'border-primary' : 'border-slate-300'} rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileSelect}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept=".pdf,.docx,.doc"
            onChange={handleFileInputChange}
          />
          <CloudUpload className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="font-medium mb-2">Drag &amp; drop files here</h3>
          <p className="text-sm text-slate-500 mb-4">or click to browse</p>
          <Button>
            Select Files
          </Button>
          <p className="mt-4 text-xs text-slate-500">
            Supported formats: PDF, DOCX, DOC (max 10MB)
          </p>
        </div>
        
        {files.length > 0 && (
          <CardContent className="border-t border-slate-200">
            <h4 className="font-medium mb-2">Files to upload:</h4>
            <ul className="divide-y divide-slate-200">
              {files.map((file, index) => (
                <li key={index} className="py-2 flex justify-between items-center">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-slate-500 mr-2" />
                    <span>{file.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-slate-500 mr-2">{formatFileSize(file.size)}</span>
                    <button 
                      className="text-slate-500 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  processFiles();
                }}
                disabled={isUploading}
              >
                {isUploading ? 'Processing...' : 'Process Files'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
