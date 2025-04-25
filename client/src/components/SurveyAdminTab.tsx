import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import QuickSetupModal from "./QuickSetupModal";
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
import { Checkbox } from "@/components/ui/checkbox";

// Helper function to safely handle options that could be string or string[]
const getOptionsArray = (options: string | string[] | null): string[] => {
  if (!options) return [];
  if (typeof options === 'string') return options.split('\n');
  return options;
};

export default function SurveyAdminTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyTemplateType | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [quickSetupOpen, setQuickSetupOpen] = useState(false);
  const [showTemplateDetails, setShowTemplateDetails] = useState(false);
  const [showTemplateQuestions, setShowTemplateQuestions] = useState(false);
  
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
    refetch: refetchTemplateQuestions
  } = useQuery<SurveyQuestionType[]>({
    queryKey: ["/api/survey-templates", selectedTemplate?.id, "questions"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!selectedTemplate,
  });
  
  // When selectedTemplate changes, refetch the questions
  useEffect(() => {
    if (selectedTemplate && showTemplateQuestions) {
      refetchTemplateQuestions();
      console.log("Refetching questions for template:", selectedTemplate.id);
    }
  }, [selectedTemplate, showTemplateQuestions, refetchTemplateQuestions]);

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
    if ((data.questionType === "radio" || data.questionType === "select" || data.questionType === "checkbox") && (!data.options || data.options.trim() === "")) {
      questionForm.setError("options", {
        type: "manual",
        message: "Options are required for this question type",
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
  
  // Toggle question selection during template creation
  const toggleQuestionSelection = (questionId: number) => {
    if (selectedQuestionIds.includes(questionId)) {
      setSelectedQuestionIds(prev => prev.filter(id => id !== questionId));
    } else {
      setSelectedQuestionIds(prev => [...prev, questionId]);
    }
  };
  
  // Initialize template form with selected template data
  const editTemplate = (template: SurveyTemplateType) => {
    templateForm.reset({
      title: template.title,
      description: template.description,
      status: template.status,
      companyId: template.companyId,
    });
    setIsEditing(true);
  };
  
  // Handle template update submission
  const handleUpdateTemplate = (data: z.infer<typeof templateSchema>) => {
    if (!selectedTemplate) return;
    
    updateTemplateMutation.mutate({
      id: selectedTemplate.id,
      template: data
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="questions">
              Questions
            </TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            {activeTab === "templates" && (
              <>
                <Button 
                  variant="outline" 
                  className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20"
                  onClick={() => setQuickSetupOpen(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Quick Setup
                </Button>
                <Button onClick={() => setIsCreatingTemplate(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </>
            )}
            {activeTab === "questions" && (
              <Button onClick={() => setIsAddingQuestion(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Question
              </Button>
            )}
          </div>
        </div>
        
        <TabsContent value="templates" className="space-y-4">
          {loadingTemplates ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div>
              {templates && templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className={`overflow-hidden ${selectedTemplate?.id === template.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{template.title}</CardTitle>
                            <CardDescription>{template.description}</CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedTemplate(template);
                                editTemplate(template);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit template
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedTemplate(template);
                                setShowTemplateQuestions(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View questions
                              </DropdownMenuItem>
                              {template.status === 'draft' && (
                                <DropdownMenuItem onClick={() => publishTemplateMutation.mutate(template.id)}>
                                  <Check className="h-4 w-4 mr-2" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive" 
                                onClick={() => deleteTemplateMutation.mutate(template.id)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={template.status === 'published' ? 'default' : 'outline'}>
                            {template.status === 'published' ? 'Published' : 'Draft'}
                          </Badge>
                          {template.createdByAI && (
                            <Badge variant="secondary">AI-Generated</Badge>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedTemplate(template);
                            setShowTemplateDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        {template.status === 'published' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20"
                          >
                            <BarChart className="h-4 w-4 mr-2" />
                            View Results
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center">
                  <FilePlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Templates Created</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first survey template to get started.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button onClick={() => setQuickSetupOpen(true)} variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Quick Setup
                    </Button>
                    <Button onClick={() => setIsCreatingTemplate(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </div>
                </div>
              )}

              {/* ... other parts of the component */}
              
              {/* Add Question Dialog */}
              <Dialog open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add Survey Question</DialogTitle>
                    <DialogDescription>
                      Create a new question for your survey templates
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...questionForm}>
                    <form onSubmit={questionForm.handleSubmit(handleAddQuestion)} className="space-y-4">
                      <FormField
                        control={questionForm.control}
                        name="questionText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Text</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. How satisfied are you with your benefits package?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={questionForm.control}
                          name="questionType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question Type</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="text">Text response</SelectItem>
                                  <SelectItem value="radio">Single choice (Radio)</SelectItem>
                                  <SelectItem value="checkbox">Multiple choice (Checkbox)</SelectItem>
                                  <SelectItem value="select">Dropdown select</SelectItem>
                                  <SelectItem value="scale">Scale (1-10)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={questionForm.control}
                          name="required"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-end space-x-2 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>Required question</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {['radio', 'select', 'checkbox', 'scale'].includes(questionForm.watch('questionType')) && (
                        <FormField
                          control={questionForm.control}
                          name="options"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Options</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter options, one per line" 
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
                      
                      <DialogFooter>
                        <Button type="submit">Add Question</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="questions">
          {/* Questions content here */}
        </TabsContent>
      </Tabs>
      
      {/* Quick Setup Modal */}
      <QuickSetupModal 
        open={quickSetupOpen} 
        onOpenChange={setQuickSetupOpen} 
      />

      {/* Template Details Dialog */}
      <Dialog open={showTemplateDetails} onOpenChange={setShowTemplateDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.title}</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Status</h4>
                <Badge variant={selectedTemplate?.status === 'published' ? 'default' : 'outline'}>
                  {selectedTemplate?.status === 'published' ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Created At</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate?.createdAt ? new Date(selectedTemplate.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            
            {selectedTemplate?.createdByAI && (
              <div className="mt-4">
                <Badge variant="secondary">AI-Generated</Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  This template was automatically generated based on your company documents.
                </p>
              </div>
            )}
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Actions</h4>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowTemplateDetails(false);
                    setShowTemplateQuestions(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Questions
                </Button>
                
                {selectedTemplate?.status === 'draft' && (
                  <Button 
                    size="sm"
                    onClick={() => {
                      publishTemplateMutation.mutate(selectedTemplate.id);
                      setShowTemplateDetails(false);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Questions Dialog */}
      <Dialog open={showTemplateQuestions} onOpenChange={setShowTemplateQuestions}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Questions for {selectedTemplate?.title}</DialogTitle>
            <DialogDescription>
              View and manage questions in this template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {loadingTemplateQuestions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : templateQuestions && templateQuestions.length > 0 ? (
              <div className="space-y-4">
                {templateQuestions.map((question, index) => (
                  <Card key={question.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div className="flex-1 pr-8">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="mb-1">
                              {question.questionType}
                            </Badge>
                            {question.required && (
                              <Badge variant="secondary" className="mb-1">Required</Badge>
                            )}
                          </div>
                          <CardTitle className="text-base font-medium">
                            {index + 1}. {question.questionText || `Question ${question.id}`}
                          </CardTitle>
                          {!question.questionText && (
                            <div className="mt-1 text-sm text-red-500">
                              Warning: Question text is missing
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      {question.options && Array.isArray(question.options) && question.options.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium mb-1">Options</h4>
                          <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                            {question.options.map((option, i) => (
                              <li key={i} className="text-muted-foreground">{option}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No questions in this template</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateQuestions(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}