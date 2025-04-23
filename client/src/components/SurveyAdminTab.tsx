import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Helper function to safely handle options that could be string or string[]
const getOptionsArray = (options: string | string[] | null): string[] => {
  if (!options) return [];
  if (typeof options === 'string') return options.split('\n');
  return options;
};
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  ChevronDown, 
  Copy, 
  Edit, 
  Eye, 
  Loader2, 
  MoreHorizontal, 
  Plus, 
  Trash, 
  FilePlus,
  BarChart,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  Check
} from "lucide-react";
import { 
  SurveyTemplate as SurveyTemplateType, 
  SurveyQuestion as SurveyQuestionType,
  insertSurveyTemplateSchema,
  insertSurveyQuestionSchema,
  questionTypeEnum
} from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SurveyAdminTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyTemplateType | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Get company ID from user
  const companyId = user?.companyId;
  
  // Fetch all survey templates
  const {
    data: templates,
    isLoading: loadingTemplates,
  } = useQuery<SurveyTemplateType[]>({
    queryKey: ["/api/survey-templates", companyId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!companyId,
  });
  
  // Fetch all survey questions for a company
  const {
    data: allQuestions,
    isLoading: loadingAllQuestions,
  } = useQuery<SurveyQuestionType[]>({
    queryKey: ["/api/survey-questions", companyId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!companyId,
  });
  
  // Fetch questions assigned to the selected template
  const {
    data: templateQuestions,
    isLoading: loadingTemplateQuestions,
  } = useQuery<SurveyQuestionType[]>({
    queryKey: ["/api/survey-templates", selectedTemplate?.id, "questions"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!selectedTemplate,
  });

  // Create a form schema for new survey templates
  const templateSchema = insertSurveyTemplateSchema.extend({
    title: z.string().min(3, { message: "Title must be at least 3 characters" }),
    description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  });

  // Create a form for new templates
  const templateForm = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
      companyId: companyId || 0,
    },
  });
  
  // Keep track of selected questions during template creation/editing
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);

  // Create a form schema for survey questions
  const questionSchema = insertSurveyQuestionSchema.extend({
    questionText: z.string().min(5, { message: "Question text must be at least 5 characters" }),
    questionType: questionTypeEnum,
    options: z.string().optional(),
    required: z.boolean().default(false),
    companyId: z.number().optional(), // Will be set on the server
  });

  // Create a form for new questions
  const defaultQuestionValues = {
    questionText: "",
    questionType: "text" as const,
    options: "",
    required: true,
    order: 1,
    companyId: companyId || undefined
  };
  
  const questionForm = useForm<z.infer<typeof questionSchema>>({
    resolver: zodResolver(questionSchema),
    defaultValues: defaultQuestionValues,
  });

  // Initialize question form when a template is selected
  useEffect(() => {
    if (selectedTemplate) {
      // Set order to the next available order number
      if (templateQuestions && templateQuestions.length > 0) {
        const maxOrder = Math.max(...templateQuestions.map(q => q.order));
        questionForm.setValue("order", maxOrder + 1);
      } else {
        questionForm.setValue("order", 1);
      }
    }
  }, [selectedTemplate, templateQuestions]);

  // Create a new survey template
  const createTemplateMutation = useMutation({
    mutationFn: async (template: z.infer<typeof templateSchema>) => {
      const res = await apiRequest(
        "POST", 
        `/api/survey-templates?companyId=${companyId}`, 
        template
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survey-templates"] });
      setIsCreatingTemplate(false);
      templateForm.reset();
      toast({
        title: "Template created",
        description: "Survey template has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update a survey template
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, template }: { id: number, template: Partial<z.infer<typeof templateSchema>> }) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/survey-templates/${id}?companyId=${companyId}`, 
        template
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survey-templates"] });
      setIsEditing(false);
      toast({
        title: "Template updated",
        description: "Survey template has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete a survey template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(
        "DELETE", 
        `/api/survey-templates/${id}?companyId=${companyId}`
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survey-templates"] });
      setSelectedTemplate(null);
      toast({
        title: "Template deleted",
        description: "Survey template has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Publish a survey template
  const publishTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(
        "POST", 
        `/api/survey-templates/${id}/publish?companyId=${companyId}`
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survey-templates"] });
      toast({
        title: "Template published",
        description: "Survey template has been published successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to publish template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create a new survey question
  const createQuestionMutation = useMutation({
    mutationFn: async (question: z.infer<typeof questionSchema>) => {
      // Additional debug logging
      console.log('Question submission received:', JSON.stringify(question));

      // Convert options string to array if provided
      const processedQuestion = {
        ...question,
        companyId: companyId, // Ensure company ID is included
        // Convert options string to array for question types that need options
        options: ['radio', 'select', 'checkbox', 'scale'].includes(question.questionType) && question.options
          ? getOptionsArray(question.options)
          : undefined,
        // Remove any extra fields that aren't in the database schema
        templateId: undefined
      };
      
      console.log('Creating question with data:', JSON.stringify(processedQuestion));
      
      try {
        const res = await apiRequest(
          "POST", 
          `/api/survey-questions`, 
          processedQuestion
        );
        const data = await res.json();
        console.log('Question creation response:', data);
        return data;
      } catch (error) {
        console.error('Error in question creation:', error);
        throw error;
      }
    },
    onSuccess: (createdQuestion) => {
      console.log('Question created successfully:', createdQuestion);
      queryClient.invalidateQueries({ queryKey: ["/api/survey-questions"] });
      setIsAddingQuestion(false);
      
      // Reset form with default values
      questionForm.reset(defaultQuestionValues);
      
      toast({
        title: "Question added",
        description: "Survey question has been added successfully.",
      });
      
      // Note: We've removed the automatic addition of questions to templates
      // Questions are now created independently and can be added to templates later
    },
    onError: (error: Error) => {
      console.error('Error creating question:', error);
      toast({
        title: "Failed to add question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete a survey question
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(
        "DELETE", 
        `/api/survey-questions/${id}`
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survey-questions"] });
      toast({
        title: "Question deleted",
        description: "Survey question has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission for new template
  const handleCreateTemplate = async (data: z.infer<typeof templateSchema>) => {
    try {
      // First create the template
      const templateResponse = await createTemplateMutation.mutateAsync(data);
      
      // Then add selected questions to the template if any are selected
      if (selectedQuestionIds.length > 0) {
        // Add each selected question to the newly created template
        for (let i = 0; i < selectedQuestionIds.length; i++) {
          await addQuestionToTemplateMutation.mutateAsync({
            templateId: templateResponse.id, 
            questionId: selectedQuestionIds[i],
            order: i + 1
          });
        }
      }
      
      // Reset selected questions
      setSelectedQuestionIds([]);
      
      // Provide success feedback
      toast({
        title: "Template created",
        description: `Survey template created with ${selectedQuestionIds.length} questions.`,
      });
      
      // Close the dialog
      setIsCreatingTemplate(false);
      templateForm.reset();
    } catch (error) {
      toast({
        title: "Error creating template",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Add an existing question to a template
  const addQuestionToTemplateMutation = useMutation({
    mutationFn: async ({ templateId, questionId, order }: { templateId: number, questionId: number, order: number }) => {
      const res = await apiRequest(
        "POST",
        `/api/survey-templates/${templateId}/questions`,
        { questionId, order }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survey-templates", selectedTemplate?.id, "questions"] });
      toast({
        title: "Question added to template",
        description: "Question has been added to the survey template.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add question to template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove a question from a template
  const removeQuestionFromTemplateMutation = useMutation({
    mutationFn: async ({ templateId, questionId }: { templateId: number, questionId: number }) => {
      const res = await apiRequest(
        "DELETE",
        `/api/survey-templates/${templateId}/questions/${questionId}`
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survey-templates", selectedTemplate?.id, "questions"] });
      toast({
        title: "Question removed from template",
        description: "Question has been removed from the survey template.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission for new question
  const handleAddQuestion = (data: z.infer<typeof questionSchema>) => {
    // If the question type is radio or select, ensure options are provided
    if ((data.questionType === "radio" || data.questionType === "select") && (!data.options || data.options.trim() === "")) {
      questionForm.setError("options", {
        type: "manual",
        message: "Options are required for radio or select questions",
      });
      return;
    }
    
    createQuestionMutation.mutate(data);
  };
  
  // Handle adding a question to a template
  const handleAddQuestionToTemplate = (questionId: number) => {
    if (!selectedTemplate) return;
    
    // Calculate next order number
    const nextOrder = templateQuestions && templateQuestions.length > 0
      ? Math.max(...templateQuestions.map(q => q.order)) + 1
      : 1;
    
    addQuestionToTemplateMutation.mutate({
      templateId: selectedTemplate.id,
      questionId,
      order: nextOrder
    });
  };
  
  // Handle removing a question from a template
  const handleRemoveQuestionFromTemplate = (questionId: number) => {
    if (!selectedTemplate) return;
    
    removeQuestionFromTemplateMutation.mutate({
      templateId: selectedTemplate.id,
      questionId
    });
  };

  // Handle editing a template
  const handleEditTemplate = () => {
    if (!selectedTemplate) return;
    
    templateForm.reset({
      title: selectedTemplate.title,
      description: selectedTemplate.description || "",
      status: selectedTemplate.status,
      companyId: selectedTemplate.companyId,
    });
    
    setIsEditing(true);
  };

  // Handle updating a template
  const handleUpdateTemplate = (data: z.infer<typeof templateSchema>) => {
    if (!selectedTemplate) return;
    
    updateTemplateMutation.mutate({
      id: selectedTemplate.id,
      template: data,
    });
  };

  // Handle deleting a template
  const handleDeleteTemplate = () => {
    if (!selectedTemplate) return;
    
    if (confirm(`Are you sure you want to delete the template "${selectedTemplate.title}"?`)) {
      deleteTemplateMutation.mutate(selectedTemplate.id);
    }
  };

  // Handle publishing a template
  const handlePublishTemplate = () => {
    if (!selectedTemplate) return;
    
    publishTemplateMutation.mutate(selectedTemplate.id);
  };

  // Watch the question type to conditionally show options input
  const questionType = questionForm.watch("questionType");
  
  if (loadingTemplates) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading survey templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="questions">
              Questions
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!selectedTemplate}>
              Preview
            </TabsTrigger>
          </TabsList>
          
          <div>
            {activeTab === "templates" && (
              <Dialog open={isCreatingTemplate} onOpenChange={setIsCreatingTemplate}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Create Survey Template</DialogTitle>
                    <DialogDescription>
                      Create a new survey template. You'll be able to add questions after creating the template.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...templateForm}>
                    <form onSubmit={templateForm.handleSubmit(handleCreateTemplate)} className="space-y-4 py-4">
                      <FormField
                        control={templateForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Quarterly Satisfaction Survey" {...field} />
                            </FormControl>
                            <FormDescription>
                              The title of your survey template
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={templateForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="This survey collects feedback on employee satisfaction and engagement."
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              A detailed description of the survey's purpose
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={templateForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Publish Status</FormLabel>
                              <FormDescription>
                                Make this survey available to users right away
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* Questions Selection Section */}
                      <div className="space-y-4 mt-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Select Questions</h3>
                          <Badge variant="outline">{selectedQuestionIds.length} selected</Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          Select questions from your question bank to include in this template.
                          You can also add questions later.
                        </p>
                        
                        {loadingAllQuestions ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="ml-2">Loading questions...</span>
                          </div>
                        ) : allQuestions && allQuestions.length > 0 ? (
                          <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                            {allQuestions.map(question => (
                              <div 
                                key={question.id} 
                                className={`border rounded-md p-3 transition-colors cursor-pointer ${
                                  selectedQuestionIds.includes(question.id) 
                                    ? 'border-primary bg-primary/5' 
                                    : 'hover:bg-accent'
                                }`}
                                onClick={() => {
                                  if (selectedQuestionIds.includes(question.id)) {
                                    setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== question.id));
                                  } else {
                                    setSelectedQuestionIds([...selectedQuestionIds, question.id]);
                                  }
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                                        selectedQuestionIds.includes(question.id) 
                                          ? 'bg-primary border-primary text-primary-foreground' 
                                          : 'border-input'
                                      }`}>
                                        {selectedQuestionIds.includes(question.id) && <Check className="h-3 w-3" />}
                                      </div>
                                      <h4 className="font-medium text-sm">{question.questionText}</h4>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {question.questionType}
                                      </Badge>
                                      {question.required && (
                                        <Badge variant="secondary" className="text-xs">Required</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {(question.questionType === 'radio' || 
                                  question.questionType === 'select' || 
                                  question.questionType === 'checkbox') && 
                                 question.options && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {getOptionsArray(question.options).map((option, i) => (
                                        <span key={i} className="px-2 py-1 bg-muted rounded text-xs">
                                          {option}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 border rounded-md">
                            <p className="text-muted-foreground">No questions available. Create questions first.</p>
                          </div>
                        )}
                      </div>
                      
                      <DialogFooter>
                        <Button type="submit" disabled={createTemplateMutation.isPending}>
                          {createTemplateMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Template"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
            
            {activeTab === "questions" && (
              <Sheet open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
                <SheetTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[480px] sm:max-w-none">
                  <SheetHeader>
                    <SheetTitle>Add Survey Question</SheetTitle>
                    <SheetDescription>
                      {selectedTemplate 
                        ? `Add a new question to the "${selectedTemplate.title}" survey template.`
                        : "Create a new survey question that can be added to any template."}
                    </SheetDescription>
                  </SheetHeader>
                  
                  <Form {...questionForm}>
                    <form onSubmit={questionForm.handleSubmit(handleAddQuestion)} className="space-y-4 py-4">
                      <FormField
                        control={questionForm.control}
                        name="questionText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Text</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="How satisfied are you with your work-life balance?"
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={questionForm.control}
                        name="questionType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a question type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="text">Short Text</SelectItem>
                                <SelectItem value="textarea">Long Text</SelectItem>
                                <SelectItem value="select">Dropdown</SelectItem>
                                <SelectItem value="radio">Multiple Choice</SelectItem>
                                <SelectItem value="checkbox">Checkboxes</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="scale">Rating Scale</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The type of input for this question
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {(questionType === "radio" || questionType === "select" || questionType === "checkbox") && (
                        <FormField
                          control={questionForm.control}
                          name="options"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Options</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Enter each option on a new line
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField
                        control={questionForm.control}
                        name="required"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Required</FormLabel>
                              <FormDescription>
                                Make this question mandatory
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end mt-6">
                        <Button 
                          type="submit" 
                          disabled={createQuestionMutation.isPending}
                          onClick={(e) => {
                            console.log('Submit button clicked');
                            // Let the form handle the submission
                          }}
                        >
                          {createQuestionMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            "Add Question"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
        
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates && templates.map((template) => (
              <Card 
                key={template.id} 
                className={`${
                  selectedTemplate?.id === template.id ? 'ring-2 ring-primary/50' : ''
                } cursor-pointer transition-all hover:shadow-md`}
                onClick={() => {
                  setSelectedTemplate(template);
                  setActiveTab("questions");
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    <Badge variant={template.status === "published" ? "default" : "secondary"}>
                      {template.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center text-sm text-muted-foreground gap-4">
                    <div className="flex items-center gap-1">
                      <ClipboardCheck className="h-4 w-4" />
                      <span>{
                        templateQuestions && selectedTemplate && selectedTemplate.id === template.id 
                          ? templateQuestions.length 
                          : 0
                      } questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart className="h-4 w-4" />
                      <span>0 responses</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex justify-between items-center w-full">
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTemplate(template);
                      setActiveTab("preview");
                    }}>
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(template);
                          handleEditTemplate();
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(template);
                          handleDeleteTemplate();
                        }}>
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                        {template.status !== "published" && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTemplate(template);
                            handlePublishTemplate();
                          }}>
                            <FilePlus className="h-4 w-4 mr-2" />
                            Publish
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardFooter>
              </Card>
            ))}
            
            {(!templates || templates.length === 0) && (
              <div className="md:col-span-2 lg:col-span-3 border rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Templates Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first survey template to get started.
                </p>
                <Button onClick={() => setIsCreatingTemplate(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Template
                </Button>
              </div>
            )}
          </div>
          
          {isEditing && selectedTemplate && (
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Edit Survey Template</DialogTitle>
                  <DialogDescription>
                    Update the details for "{selectedTemplate.title}".
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...templateForm}>
                  <form onSubmit={templateForm.handleSubmit(handleUpdateTemplate)} className="space-y-4 py-4">
                    <FormField
                      control={templateForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={templateForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={templateForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit" disabled={updateTemplateMutation.isPending}>
                        {updateTemplateMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Template"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>
        
        <TabsContent value="questions" className="space-y-4">
          {selectedTemplate ? (
            // Template-specific view
            <div>
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedTemplate.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTemplate.description}</p>
                </div>
                <Badge variant={selectedTemplate.status === "published" ? "secondary" : "secondary"}>
                  {selectedTemplate.status === "published" ? "Published" : "Draft"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between mb-4 mt-6">
                <div>
                  <h3 className="text-lg font-semibold">Template Questions</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage questions for this template
                  </p>
                </div>
                <Button variant="outline" onClick={() => setIsAddingQuestion(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Question
                </Button>
              </div>
              
              {(loadingTemplateQuestions || loadingAllQuestions) ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading questions...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Template Questions */}
                  {templateQuestions && templateQuestions.length > 0 ? (
                    <div className="space-y-3">
                      {templateQuestions
                        .sort((a, b) => a.order - b.order)
                        .map((question, index) => (
                        <Card key={question.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start space-x-2">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                  {index + 1}
                                </span>
                                <div>
                                  <CardTitle className="text-base">{question.questionText}</CardTitle>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="capitalize">
                                  {question.questionType}
                                </Badge>
                                {question.required && (
                                  <Badge variant="secondary">Required</Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveQuestionFromTemplate(question.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          {(question.questionType === "select" || 
                            question.questionType === "radio" || 
                            question.questionType === "checkbox") && question.options && (
                            <CardContent className="pb-2">
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Options:</span>
                                <ul className="list-disc list-inside mt-1 pl-2">
                                  {getOptionsArray(question.options).map((option, i) => (
                                    <li key={i}>{option}</li>
                                  ))}
                                </ul>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded-lg p-8 text-center">
                      <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Questions Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Add your first question to start building this survey.
                      </p>
                      <Button onClick={() => setIsAddingQuestion(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Question
                      </Button>
                    </div>
                  )}
                  
                  {/* Available Questions Bank */}
                  {allQuestions && allQuestions.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">Question Bank</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add existing questions from your company's question bank to this template
                      </p>
                      
                      <div className="space-y-2">
                        {allQuestions
                          .filter(q => !templateQuestions?.some(tq => tq.id === q.id))
                          .map(question => (
                          <Card key={question.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-base">{question.questionText}</CardTitle>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="capitalize">
                                    {question.questionType}
                                  </Badge>
                                  {question.required && (
                                    <Badge variant="secondary">Required</Badge>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddQuestionToTemplate(question.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add to Template
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            {(question.questionType === "select" || 
                              question.questionType === "radio" || 
                              question.questionType === "checkbox") && question.options && (
                              <CardContent className="pb-2">
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium">Options:</span>
                                  <ul className="list-disc list-inside mt-1 pl-2">
                                    {getOptionsArray(question.options).map((option, i) => (
                                      <li key={i}>{option}</li>
                                    ))}
                                  </ul>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Standalone question management when no template is selected
            <div>
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-xl font-semibold">Question Bank</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create and manage questions that can be added to any survey template
                  </p>
                </div>
                <Button variant="outline" onClick={() => setIsAddingQuestion(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Question
                </Button>
              </div>
              
              {loadingAllQuestions ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-lg">Loading questions...</span>
                </div>
              ) : (
                <>
                  {allQuestions && allQuestions.length > 0 ? (
                    <div className="space-y-3 mt-4">
                      {allQuestions.map((question) => (
                        <Card key={question.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base">{question.questionText}</CardTitle>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="capitalize">
                                  {question.questionType}
                                </Badge>
                                {question.required && (
                                  <Badge variant="secondary">Required</Badge>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => {
                                      deleteQuestionMutation.mutate(question.id);
                                    }}>
                                      <Trash className="h-4 w-4 mr-2" />
                                      Delete Question
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            {(question.questionType === 'radio' || question.questionType === 'select' || question.questionType === 'checkbox') && question.options && (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground mb-1">Options:</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {getOptionsArray(question.options).map((option, i) => (
                                    <div key={i} className="text-sm border rounded p-1.5 bg-muted/50">
                                      {option}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded-lg p-8 text-center mt-4">
                      <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Questions Created</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first survey question to get started.
                      </p>
                      <Button onClick={() => setIsAddingQuestion(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Question
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-4">
          {selectedTemplate && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedTemplate.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTemplate.description}</p>
                </div>
                <Badge variant={selectedTemplate.status === "published" ? "secondary" : "secondary"}>
                  {selectedTemplate.status === "published" ? "Published" : "Draft"}
                </Badge>
              </div>
              
              {loadingTemplateQuestions ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading preview...</span>
                </div>
              ) : templateQuestions && templateQuestions.length > 0 ? (
                <div className="border rounded-lg p-6 bg-card">
                  <h3 className="text-lg font-semibold mb-4">Survey Preview</h3>
                  
                  <div className="space-y-6">
                    {templateQuestions
                      .sort((a, b) => a.order - b.order)
                      .map((question, index) => (
                      <div key={question.id} className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <Label className="font-medium">
                              {question.questionText}
                              {question.required && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            
                            {/* Render different input types based on question type */}
                            {question.questionType === "text" && (
                              <Input placeholder="Short answer..." className="mt-2" />
                            )}
                            
                            {question.questionType === "textarea" && (
                              <Textarea placeholder="Long answer..." className="mt-2" />
                            )}
                            
                            {question.questionType === "number" && (
                              <Input type="number" placeholder="0" className="mt-2" />
                            )}
                            
                            {question.questionType === "select" && question.options && (
                              <Select>
                                <SelectTrigger className="mt-2">
                                  <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getOptionsArray(question.options).map((option, i) => (
                                    <SelectItem key={i} value={`option-${i}`}>{option}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {question.questionType === "date" && (
                              <Input type="date" className="mt-2" />
                            )}
                            
                            {question.questionType === "radio" && question.options && (
                              <div className="space-y-2 mt-2">
                                {getOptionsArray(question.options).map((option, i) => (
                                  <div key={i} className="flex items-center space-x-2">
                                    <input type="radio" id={`option-${question.id}-${i}`} name={`question-${question.id}`} />
                                    <Label htmlFor={`option-${question.id}-${i}`} className="font-normal">
                                      {option}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {question.questionType === "checkbox" && question.options && (
                              <div className="space-y-2 mt-2">
                                {getOptionsArray(question.options).map((option, i) => (
                                  <div key={i} className="flex items-center space-x-2">
                                    <input type="checkbox" id={`check-${question.id}-${i}`} />
                                    <Label htmlFor={`check-${question.id}-${i}`} className="font-normal">
                                      {option}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {question.questionType === "scale" && (
                              <div className="flex space-x-4 mt-3">
                                {[1, 2, 3, 4, 5].map((num) => (
                                  <div key={num} className="text-center">
                                    <div className="w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer hover:bg-primary/10">
                                      {num}
                                    </div>
                                    {num === 1 && <div className="text-xs mt-1">Poor</div>}
                                    {num === 5 && <div className="text-xs mt-1">Excellent</div>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t mt-8">
                      <Button>Submit Survey</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center">
                  <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Questions to Preview</h3>
                  <p className="text-muted-foreground mb-4">
                    Add questions to see a preview of how the survey will look to users.
                  </p>
                  <Button onClick={() => {
                    setActiveTab("questions");
                    setIsAddingQuestion(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Questions
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}