import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  FileText
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
  
  // Fetch all survey questions if a template is selected
  const {
    data: questions,
    isLoading: loadingQuestions,
  } = useQuery<SurveyQuestionType[]>({
    queryKey: ["/api/survey-questions", selectedTemplate?.id],
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
  
  // Create a form schema for survey questions
  const questionSchema = insertSurveyQuestionSchema.extend({
    questionText: z.string().min(5, { message: "Question text must be at least 5 characters" }),
    questionType: questionTypeEnum,
    options: z.string().optional(),
    templateId: z.number(),
    order: z.number(),
    isRequired: z.boolean(),
  });
  
  // Create a form for new questions
  const questionForm = useForm<z.infer<typeof questionSchema>>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionText: "",
      questionType: "text",
      options: "",
      isRequired: true,
      order: 0,
      templateId: 0,
    },
  });
  
  // Initialize question form with template ID when a template is selected
  useState(() => {
    if (selectedTemplate) {
      questionForm.setValue("templateId", selectedTemplate.id);
      // Set order to the next available order number
      if (questions && questions.length > 0) {
        const maxOrder = Math.max(...questions.map(q => q.order));
        questionForm.setValue("order", maxOrder + 1);
      } else {
        questionForm.setValue("order", 1);
      }
    }
  });
  
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
      const res = await apiRequest(
        "POST", 
        `/api/survey-questions`, 
        question
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survey-questions"] });
      setIsAddingQuestion(false);
      questionForm.reset({
        questionText: "",
        questionType: "text",
        options: "",
        isRequired: true,
        order: questions ? Math.max(...questions.map(q => q.order)) + 1 : 1,
        templateId: selectedTemplate?.id || 0,
      });
      toast({
        title: "Question added",
        description: "Survey question has been added successfully.",
      });
    },
    onError: (error: Error) => {
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
  const handleCreateTemplate = (data: z.infer<typeof templateSchema>) => {
    createTemplateMutation.mutate(data);
  };
  
  // Handle form submission for new question
  const handleAddQuestion = (data: z.infer<typeof questionSchema>) => {
    // If the question type is multichoice or select, ensure options are provided
    if ((data.questionType === "multichoice" || data.questionType === "select") && (!data.options || data.options.trim() === "")) {
      questionForm.setError("options", {
        type: "manual",
        message: "Options are required for multichoice or select questions",
      });
      return;
    }
    
    createQuestionMutation.mutate(data);
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
            <TabsTrigger value="questions" disabled={!selectedTemplate}>
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
            
            {activeTab === "questions" && selectedTemplate && (
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
                      Add a new question to the "{selectedTemplate.title}" survey template.
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
                                <SelectItem value="text">Text (Short Answer)</SelectItem>
                                <SelectItem value="textarea">Long Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="select">Dropdown Selection</SelectItem>
                                <SelectItem value="multichoice">Multiple Choice</SelectItem>
                                <SelectItem value="checkbox">Checkboxes</SelectItem>
                                <SelectItem value="scale">Rating Scale (1-5)</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The type of input for this question
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {(questionType === "select" || questionType === "multichoice" || questionType === "checkbox") && (
                        <FormField
                          control={questionForm.control}
                          name="options"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Answer Options</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                                  className="min-h-[80px]"
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
                        name="isRequired"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Required Question</FormLabel>
                              <FormDescription>
                                Make this question mandatory to answer
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
                      
                      <SheetFooter>
                        <Button type="submit" disabled={createQuestionMutation.isPending}>
                          {createQuestionMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            "Add Question"
                          )}
                        </Button>
                      </SheetFooter>
                    </form>
                  </Form>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
        
        <TabsContent value="templates" className="space-y-4">
          {templates && templates.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`overflow-hidden ${selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Questions
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleEditTemplate}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Template
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleDeleteTemplate}>
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Template
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={handlePublishTemplate}
                            disabled={template.status === "published"}
                          >
                            <FilePlus className="h-4 w-4 mr-2" />
                            {template.status === "published" ? "Already Published" : "Publish Template"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div>Created: {new Date(template.createdAt).toLocaleDateString()}</div>
                      {template.updatedAt && (
                        <div>Updated: {new Date(template.updatedAt).toLocaleDateString()}</div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 p-3 flex justify-between">
                    <Badge variant="secondary">
                      {template.status === "published" ? "Published" : "Draft"}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedTemplate(template)}
                    >
                      Select
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Survey Templates</h3>
              <p className="text-muted-foreground mb-4">
                Create your first survey template to start collecting feedback.
              </p>
              <Button onClick={() => setIsCreatingTemplate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          )}
          
          {/* Edit Template Dialog */}
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Edit Survey Template</DialogTitle>
                <DialogDescription>
                  Make changes to the survey template.
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
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Published Status</FormLabel>
                          <FormDescription>
                            Controls whether this survey is available to users
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
                  
                  <DialogFooter>
                    <Button type="submit" disabled={updateTemplateMutation.isPending}>
                      {updateTemplateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="questions" className="space-y-4">
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedTemplate.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTemplate.description}</p>
                </div>
                <Badge variant={selectedTemplate.isPublished ? "success" : "secondary"}>
                  {selectedTemplate.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
              
              {loadingQuestions ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading questions...</span>
                </div>
              ) : questions && questions.length > 0 ? (
                <div className="space-y-3">
                  {questions
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
                            {question.isRequired && (
                              <Badge variant="secondary">Required</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteQuestionMutation.mutate(question.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {(question.questionType === "select" || 
                        question.questionType === "multichoice" || 
                        question.questionType === "checkbox") && question.options && (
                        <CardContent className="pb-2">
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Options:</span>
                            <ul className="list-disc list-inside mt-1 pl-2">
                              {question.options.split('\n').map((option, i) => (
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
                <Badge variant={selectedTemplate.isPublished ? "success" : "secondary"}>
                  {selectedTemplate.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
              
              {loadingQuestions ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading preview...</span>
                </div>
              ) : questions && questions.length > 0 ? (
                <div className="border rounded-lg p-6 bg-card">
                  <h3 className="text-lg font-semibold mb-4">Survey Preview</h3>
                  
                  <div className="space-y-6">
                    {questions
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
                              {question.isRequired && <span className="text-destructive ml-1">*</span>}
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
                                  {question.options.split('\n').map((option, i) => (
                                    <SelectItem key={i} value={`option-${i}`}>{option}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {question.questionType === "date" && (
                              <Input type="date" className="mt-2" />
                            )}
                            
                            {question.questionType === "multichoice" && question.options && (
                              <div className="space-y-2 mt-2">
                                {question.options.split('\n').map((option, i) => (
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
                                {question.options.split('\n').map((option, i) => (
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