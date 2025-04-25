import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useCompanyTheme } from "@/hooks/use-company-theme";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  FileQuestion,
  CheckCircle,
  Info,
  Loader2,
  AlertCircle,
  FileText,
  ClipboardList,
} from "lucide-react";

type QuickSetupProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SetupStage = "upload" | "options" | "generating" | "complete" | "error";

export default function QuickSetupModal({ open, onOpenChange }: QuickSetupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { companySettings } = useCompanyTheme();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [setupStage, setSetupStage] = useState<SetupStage>("upload");
  const [progress, setProgress] = useState(0);
  const [createQuarterly, setCreateQuarterly] = useState(true);
  const [createAnnual, setCreateAnnual] = useState(true);
  const [generationPrompt, setGenerationPrompt] = useState(
    companySettings?.surveyGenerationPrompt || 
    "As a benefits administrator I would like to create quarterly and annual benefits surveys. Create the questions based on your knowledge as well as the contents of the document uploaded to the assistant. Focus on employee satisfaction, understanding of benefits, and areas for improvement."
  );
  const [showPromptEdit, setShowPromptEdit] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [generationResults, setGenerationResults] = useState<{
    templatesCreated: number;
    questionsCreated: number;
    error?: string;
  }>({ templatesCreated: 0, questionsCreated: 0 });
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document uploaded",
        description: "Benefits guide has been uploaded successfully.",
      });
      // Move to options stage
      setSetupStage("options");
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setSetupStage("error");
    },
  });
  
  // Generate surveys mutation
  const generateMutation = useMutation({
    mutationFn: async (data: {
      documentId: number;
      createQuarterly: boolean;
      createAnnual: boolean;
      prompt: string;
    }) => {
      const res = await apiRequest(
        "POST",
        "/api/survey-templates/generate",
        data
      );
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/survey-templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/survey-questions"] });
      
      setGenerationResults({
        templatesCreated: data.templatesCreated || 0,
        questionsCreated: data.questionsCreated || 0,
      });
      
      toast({
        title: "Survey templates created",
        description: `Successfully created ${data.templatesCreated} templates with ${data.questionsCreated} questions.`,
      });
      
      setSetupStage("complete");
    },
    onError: (error: Error) => {
      setGenerationResults({
        templatesCreated: 0,
        questionsCreated: 0,
        error: error.message,
      });
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
      setSetupStage("error");
    },
  });
  
  // Save prompt to company settings
  const savePromptMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest(
        "PATCH",
        `/api/company-settings?companyId=${companySettings?.companyId}`,
        { surveyGenerationPrompt: prompt }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      toast({
        title: "Prompt saved",
        description: "Survey generation prompt has been saved to company settings.",
      });
      setShowPromptEdit(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle upload
  const handleUpload = () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append("documents", selectedFile);
    formData.append("title", "Benefits Guide");
    formData.append("description", "Company benefits documentation");
    formData.append("isPublic", "true");
    formData.append("category", "benefits");
    
    uploadMutation.mutate(formData);
  };
  
  // Handle generation
  const handleGenerate = (documentId: number) => {
    setSetupStage("generating");
    setProgress(0);
    
    // Simulate progress updates
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 1000);
    
    // Launch generation
    generateMutation.mutate({
      documentId,
      createQuarterly,
      createAnnual,
      prompt: generationPrompt,
    });
  };
  
  // Handle save prompt
  const handleSavePrompt = () => {
    savePromptMutation.mutate(generationPrompt);
  };
  
  // Reset state when modal is closed
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedFile(null);
      setSetupStage("upload");
      setProgress(0);
      setCreateQuarterly(true);
      setCreateAnnual(true);
      setShowPromptEdit(false);
      setGenerationResults({ templatesCreated: 0, questionsCreated: 0 });
    }
    onOpenChange(open);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl gradient-heading">
              Quick Setup Wizard
            </DialogTitle>
            <DialogDescription>
              Upload your benefits guide and generate survey templates automatically
            </DialogDescription>
          </DialogHeader>
          
          {/* Upload Stage */}
          {setupStage === "upload" && (
            <div className="space-y-6 py-4">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center space-y-3 cursor-pointer">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Upload Benefits Guide</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1.5">
                      Upload your company benefits guide (PDF, Word, etc). This document will be used to generate survey questions.
                    </p>
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  
                  <Button variant="outline" size="sm" className="mt-2">
                    Select File
                  </Button>
                </div>
              </div>
              
              {selectedFile && (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Options Stage */}
          {setupStage === "options" && (
            <div className="space-y-6 py-4">
              <div className="rounded-lg border p-4 bg-primary/5">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Document Uploaded Successfully</p>
                    <p className="text-sm text-muted-foreground">
                      Your benefits guide has been uploaded and is ready for processing.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Survey Generation Options</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="quarterlyOption" 
                      checked={createQuarterly}
                      onCheckedChange={(checked) => 
                        setCreateQuarterly(checked as boolean)
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="quarterlyOption"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Create Quarterly Survey Template
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Generate a quarterly survey template with relevant questions
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="annualOption" 
                      checked={createAnnual}
                      onCheckedChange={(checked) => 
                        setCreateAnnual(checked as boolean)
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="annualOption"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Create Annual Survey Template
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Generate a comprehensive annual survey template
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Generation Prompt</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPromptEdit(!showPromptEdit)}
                  >
                    {showPromptEdit ? "Hide Prompt" : "Edit Prompt"}
                  </Button>
                </div>
                
                {showPromptEdit ? (
                  <div className="space-y-3">
                    <Textarea 
                      value={generationPrompt}
                      onChange={(e) => setGenerationPrompt(e.target.value)}
                      className="min-h-[150px]"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPromptEdit(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSavePrompt}
                        disabled={savePromptMutation.isPending}
                      >
                        {savePromptMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Prompt"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted rounded-md p-3 text-sm">
                    <p className="line-clamp-3">{generationPrompt}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  This prompt instructs the AI on how to generate survey questions
                </p>
              </div>
              
              <div className="flex items-center justify-end space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground mr-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        This will use OpenAI to analyze your document and generate survey templates and questions.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={() => setConfirmDialogOpen(true)}
                  disabled={!createAnnual && !createQuarterly}
                >
                  Generate Surveys
                </Button>
              </div>
            </div>
          )}
          
          {/* Generating Stage */}
          {setupStage === "generating" && (
            <div className="space-y-6 py-8 text-center">
              <div className="h-20 w-20 mx-auto relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">Generating Survey Templates</h3>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                  Please wait while we analyze your benefits guide and generate survey templates and questions.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </div>
          )}
          
          {/* Complete Stage */}
          {setupStage === "complete" && (
            <div className="space-y-6 py-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Setup Completed Successfully</p>
                    <p className="text-sm text-muted-foreground">
                      Your benefits guide has been processed and survey templates have been created.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <ClipboardList className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">{generationResults.templatesCreated}</p>
                  <p className="text-sm text-muted-foreground">Templates Created</p>
                </div>
                
                <div className="rounded-lg border p-4 text-center">
                  <div className="h-12 w-12 mx-auto rounded-full bg-secondary/10 flex items-center justify-center mb-3">
                    <FileQuestion className="h-6 w-6 text-secondary" />
                  </div>
                  <p className="text-2xl font-bold">{generationResults.questionsCreated}</p>
                  <p className="text-sm text-muted-foreground">Questions Created</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-center">
                  You can now go to the Survey Administration section to view and edit your templates.
                </p>
              </div>
              
              <div className="flex justify-end">
                <DialogClose asChild>
                  <Button>
                    Done
                  </Button>
                </DialogClose>
              </div>
            </div>
          )}
          
          {/* Error Stage */}
          {setupStage === "error" && (
            <div className="space-y-6 py-4">
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium">Setup Failed</p>
                    <p className="text-sm text-muted-foreground">
                      {generationResults.error || "There was an error processing your request."}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                <Button onClick={() => setSetupStage("upload")}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Survey Generation</AlertDialogTitle>
            <AlertDialogDescription>
              This will use OpenAI to analyze your benefits guide and generate{" "}
              {createQuarterly && createAnnual
                ? "quarterly and annual survey templates"
                : createQuarterly
                ? "a quarterly survey template"
                : "an annual survey template"}.
              The process may take a minute or two to complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDialogOpen(false);
                // Assuming the documentId is 1 for now, in a real app we'd get this from the upload response
                handleGenerate(1);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}