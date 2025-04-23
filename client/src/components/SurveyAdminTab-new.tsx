import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  getSurveyTemplates, 
  getSurveyQuestions,
  getSurveyQuestionsByTemplateId,
  createSurveyTemplate, 
  updateSurveyTemplate, 
  deleteSurveyTemplate, 
  publishSurveyTemplate,
  createSurveyQuestion,
  updateSurveyQuestion,
  deleteSurveyQuestion
} from "@/lib/surveyAdminApi";
import { SurveyTemplate, SurveyQuestion } from "@shared/schema";
import { Edit, Plus, Trash2, Eye, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function SurveyAdminTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Templates and Questions queries
  const templatesQuery = useQuery<SurveyTemplate[]>({
    queryKey: ['/api/survey-templates'],
    queryFn: getSurveyTemplates,
    retry: false
  });
  
  const questionsQuery = useQuery<SurveyQuestion[]>({
    queryKey: ['/api/survey-questions'],
    queryFn: getSurveyQuestions,
    retry: false
  });
  
  // Templates state
  const [editingTemplate, setEditingTemplate] = useState<SurveyTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    title: "",
    description: "",
    status: "draft"
  });
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  
  // Questions state
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    templateId: null as number | null,
    questionText: "",
    questionType: "radio",
    required: true,
    order: 1,
    options: [] as string[],
    active: true
  });
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [optionsText, setOptionsText] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  
  // Filtered questions query
  const filteredQuestionsQuery = useQuery<SurveyQuestion[]>({
    queryKey: ['/api/survey-questions', selectedTemplateId],
    queryFn: () => selectedTemplateId 
      ? getSurveyQuestionsByTemplateId(selectedTemplateId)
      : getSurveyQuestions(),
    enabled: questionsQuery.isSuccess,
    retry: false
  });
  
  // Mutations for Templates
  const createTemplateMutation = useMutation({
    mutationFn: (template: { title: string; description: string; status: string }) => {
      return createSurveyTemplate(template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey-templates'] });
      setIsTemplateDialogOpen(false);
      toast({
        title: "Success",
        description: "Survey template created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  const updateTemplateMutation = useMutation({
    mutationFn: (template: SurveyTemplate) => {
      return updateSurveyTemplate(template.id, {
        title: template.title,
        description: template.description,
        status: template.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey-templates'] });
      setIsTemplateDialogOpen(false);
      toast({
        title: "Success",
        description: "Survey template updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => {
      return deleteSurveyTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey-templates'] });
      toast({
        title: "Success",
        description: "Survey template deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  const publishTemplateMutation = useMutation({
    mutationFn: (id: number) => {
      return publishSurveyTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey-templates'] });
      toast({
        title: "Success",
        description: "Survey template published successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to publish template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutations for Questions
  const createQuestionMutation = useMutation({
    mutationFn: (question: SurveyQuestion) => {
      return createSurveyQuestion(question);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey-questions'] });
      setIsQuestionDialogOpen(false);
      toast({
        title: "Success",
        description: "Survey question created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create question: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  const updateQuestionMutation = useMutation({
    mutationFn: (question: SurveyQuestion) => {
      return updateSurveyQuestion(question.id, {
        questionText: question.questionText,
        questionType: question.questionType,
        required: question.required,
        order: question.order,
        options: question.options,
        active: question.active,
        templateId: question.templateId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey-questions'] });
      if (selectedTemplateId) {
        queryClient.invalidateQueries({ queryKey: ['/api/survey-questions', selectedTemplateId] });
      }
      setIsQuestionDialogOpen(false);
      toast({
        title: "Success",
        description: "Survey question updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update question: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  const deleteQuestionMutation = useMutation({
    mutationFn: (id: number) => {
      return deleteSurveyQuestion(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey-questions'] });
      if (selectedTemplateId) {
        queryClient.invalidateQueries({ queryKey: ['/api/survey-questions', selectedTemplateId] });
      }
      toast({
        title: "Success",
        description: "Survey question deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete question: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  // Handlers
  const handleTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTemplate) {
      updateTemplateMutation.mutate({
        ...editingTemplate,
        title: newTemplate.title,
        description: newTemplate.description,
        status: newTemplate.status,
      });
    } else {
      createTemplateMutation.mutate(newTemplate);
    }
  };
  
  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const options = optionsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    const finalQuestion = {
      ...newQuestion,
      options: ['radio', 'checkbox', 'select'].includes(newQuestion.questionType)
        ? options
        : []
    };
    
    if (editingQuestion) {
      updateQuestionMutation.mutate({
        ...editingQuestion,
        questionText: finalQuestion.questionText,
        questionType: finalQuestion.questionType,
        required: finalQuestion.required,
        order: finalQuestion.order,
        options: finalQuestion.options,
        active: finalQuestion.active,
        templateId: finalQuestion.templateId
      });
    } else {
      createQuestionMutation.mutate(finalQuestion as SurveyQuestion);
    }
  };
  
  const handleTemplateDialogClose = () => {
    setIsTemplateDialogOpen(false);
    setEditingTemplate(null);
    setNewTemplate({
      title: "",
      description: "",
      status: "draft"
    });
  };
  
  const handleQuestionDialogClose = () => {
    setIsQuestionDialogOpen(false);
    setEditingQuestion(null);
    setNewQuestion({
      templateId: selectedTemplateId,
      questionText: "",
      questionType: "radio",
      required: true,
      order: questionsQuery.data?.length 
        ? Math.max(...questionsQuery.data.map(q => q.order)) + 1 
        : 1,
      options: [],
      active: true
    });
    setOptionsText("");
  };
  
  const openEditTemplateDialog = (template: SurveyTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      title: template.title,
      description: template.description || "",
      status: template.status,
    });
    setIsTemplateDialogOpen(true);
  };
  
  const openEditQuestionDialog = (question: SurveyQuestion) => {
    setEditingQuestion(question);
    setNewQuestion({
      templateId: question.templateId,
      questionText: question.questionText,
      questionType: question.questionType,
      required: question.required,
      order: question.order,
      options: question.options || [],
      active: question.active
    });
    setOptionsText((question.options || []).join('\n'));
    setIsQuestionDialogOpen(true);
  };
  
  // Display data to use
  const displayQuestions = filteredQuestionsQuery.isSuccess 
    ? filteredQuestionsQuery.data 
    : questionsQuery.data || [];
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Survey Administration</h2>
      <p className="text-muted-foreground">
        Manage survey templates and questions for employee feedback collection.
      </p>
      
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Survey Templates</TabsTrigger>
          <TabsTrigger value="questions">Survey Questions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Manage Survey Templates</h3>
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingTemplate(null);
                  setNewTemplate({
                    title: "",
                    description: "",
                    status: "draft"
                  });
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? "Edit Template" : "Add New Template"}</DialogTitle>
                  <DialogDescription>
                    {editingTemplate 
                      ? "Update the details of your survey template." 
                      : "Create a new template for your survey."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleTemplateSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Template Title</Label>
                      <Input
                        id="title"
                        value={newTemplate.title}
                        onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                        placeholder="Enter title"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newTemplate.description}
                        onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                        placeholder="Enter description"
                        rows={3}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={newTemplate.status}
                        onValueChange={(value) => setNewTemplate({ ...newTemplate, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleTemplateDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingTemplate ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {templatesQuery.isLoading ? (
            <div className="text-center py-4">Loading survey templates...</div>
          ) : templatesQuery.error ? (
            <div className="text-center py-4 text-red-500">
              Error loading templates: {templatesQuery.error.message}
            </div>
          ) : templatesQuery.data?.length === 0 ? (
            <Card className="bg-slate-50">
              <CardContent className="pt-6 text-center">
                <p className="text-slate-600">No survey templates found. Add your first template to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templatesQuery.data?.map((template) => (
                <Card key={template.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle>{template.title}</CardTitle>
                      <Badge variant={
                        template.status === "draft" ? "outline" : 
                        template.status === "active" ? "default" : 
                        "secondary"
                      }>
                        {template.status}
                      </Badge>
                    </div>
                    <CardDescription className="mt-2">
                      {template.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p>Created on:</p>
                        <p className="font-medium">{formatDate(template.createdAt)}</p>
                      </div>
                      <div>
                        <p>Last updated:</p>
                        <p className="font-medium">{formatDate(template.updatedAt)}</p>
                      </div>
                    </div>
                    {template.publishedAt && (
                      <div className="mt-2">
                        <p>Published on:</p>
                        <p className="font-medium">{formatDate(template.publishedAt)}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2 pt-2 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openEditTemplateDialog(template)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {template.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => publishTemplateMutation.mutate(template.id)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Publish
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${template.title}"?`)) {
                          deleteTemplateMutation.mutate(template.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="questions" className="space-y-4 mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Manage Survey Questions</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="templateFilter">Filter by Template:</Label>
                  <Select 
                    value={selectedTemplateId?.toString() || ""}
                    onValueChange={(value) => setSelectedTemplateId(value ? parseInt(value) : null)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All templates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All templates</SelectItem>
                      {templatesQuery.data?.map(template => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingQuestion(null);
                      setNewQuestion({
                        templateId: selectedTemplateId,
                        questionText: "",
                        questionType: "radio",
                        required: true,
                        order: questionsQuery.data?.length 
                          ? Math.max(...questionsQuery.data.map(q => q.order)) + 1 
                          : 1,
                        options: [],
                        active: true
                      });
                      setOptionsText("");
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
                      <DialogDescription>
                        {editingQuestion 
                          ? "Update the details of your survey question." 
                          : "Add a new question to your survey."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleQuestionSubmit}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="questionText">Question Text</Label>
                          <Input
                            id="questionText"
                            value={newQuestion.questionText}
                            onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                            placeholder="Enter question text"
                            required
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="templateId">Survey Template</Label>
                          <Select
                            value={newQuestion.templateId?.toString() || ""}
                            onValueChange={(value) => setNewQuestion({ 
                              ...newQuestion, 
                              templateId: value ? parseInt(value) : null 
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {templatesQuery.data?.map(template => (
                                <SelectItem key={template.id} value={template.id.toString()}>
                                  {template.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="questionType">Question Type</Label>
                          <Select
                            value={newQuestion.questionType}
                            onValueChange={(value) => setNewQuestion({ ...newQuestion, questionType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select question type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text Input</SelectItem>
                              <SelectItem value="radio">Radio Buttons</SelectItem>
                              <SelectItem value="checkbox">Checkboxes</SelectItem>
                              <SelectItem value="select">Dropdown</SelectItem>
                              <SelectItem value="textarea">Text Area</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {['radio', 'checkbox', 'select'].includes(newQuestion.questionType) && (
                          <div className="grid gap-2">
                            <Label htmlFor="options">Options (one per line)</Label>
                            <Textarea
                              id="options"
                              value={optionsText}
                              onChange={(e) => setOptionsText(e.target.value)}
                              placeholder="Enter options (one per line)"
                              rows={4}
                              required
                            />
                          </div>
                        )}
                        
                        <div className="grid gap-2">
                          <Label htmlFor="order">Display Order</Label>
                          <Input
                            id="order"
                            type="number"
                            value={newQuestion.order}
                            onChange={(e) => setNewQuestion({ ...newQuestion, order: parseInt(e.target.value) })}
                            min={1}
                            required
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="required"
                            checked={newQuestion.required}
                            onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, required: checked })}
                          />
                          <Label htmlFor="required">Required Question</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="active"
                            checked={newQuestion.active}
                            onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, active: checked })}
                          />
                          <Label htmlFor="active">Active</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleQuestionDialogClose}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingQuestion ? "Update" : "Add"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {filteredQuestionsQuery.isLoading ? (
              <div className="text-center py-4">Loading survey questions...</div>
            ) : filteredQuestionsQuery.error ? (
              <div className="text-center py-4 text-red-500">
                Error loading questions: {filteredQuestionsQuery.error.message}
              </div>
            ) : displayQuestions.length === 0 ? (
              <Card className="bg-slate-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-600">No survey questions found. Add your first question to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Order</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead className="w-20">Required</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayQuestions.sort((a, b) => a.order - b.order).map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>{question.order}</TableCell>
                      <TableCell className="font-medium">{question.questionText}</TableCell>
                      <TableCell className="capitalize">{question.questionType}</TableCell>
                      <TableCell>
                        {question.templateId 
                          ? templatesQuery.data?.find(t => t.id === question.templateId)?.title || "Unknown"
                          : "None"}
                      </TableCell>
                      <TableCell>{question.required ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <Badge variant={question.active ? "default" : "outline"}>
                          {question.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditQuestionDialog(question)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete this question?`)) {
                                deleteQuestionMutation.mutate(question.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}