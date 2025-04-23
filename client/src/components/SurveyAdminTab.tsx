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
    questionText: "",
    questionType: "radio",
    required: true,
    order: 1,
    options: [] as string[],
    active: true
  });
  const [optionsText, setOptionsText] = useState("");
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  
  // Actions for templates
  const createTemplateMutation = useMutation({
    mutationFn: createSurveyTemplate,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Survey template created successfully",
      });
      setIsTemplateDialogOpen(false);
      setNewTemplate({
        title: "",
        description: "",
        status: "draft"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/survey-templates'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create template",
        variant: "destructive",
      });
    }
  });
  
  const updateTemplateMutation = useMutation({
    mutationFn: (template: SurveyTemplate) => {
      const { id, ...templateData } = template;
      return updateSurveyTemplate(id, templateData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Survey template updated successfully",
      });
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      queryClient.invalidateQueries({ queryKey: ['/api/survey-templates'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update template",
        variant: "destructive",
      });
    }
  });
  
  const deleteTemplateMutation = useMutation({
    mutationFn: deleteSurveyTemplate,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Survey template deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/survey-templates'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete template",
        variant: "destructive",
      });
    }
  });
  
  const publishTemplateMutation = useMutation({
    mutationFn: publishSurveyTemplate,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Survey template published successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/survey-templates'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish template",
        variant: "destructive",
      });
    }
  });
  
  // Actions for questions
  const createQuestionMutation = useMutation({
    mutationFn: createSurveyQuestion,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Survey question created successfully",
      });
      setIsQuestionDialogOpen(false);
      setNewQuestion({
        questionText: "",
        questionType: "radio",
        required: true,
        order: 1,
        options: [],
        active: true
      });
      setOptionsText("");
      queryClient.invalidateQueries({ queryKey: ['/api/survey-questions'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create question",
        variant: "destructive",
      });
    }
  });
  
  const updateQuestionMutation = useMutation({
    mutationFn: (question: SurveyQuestion) => {
      const { id, ...questionData } = question;
      return updateSurveyQuestion(id, questionData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Survey question updated successfully",
      });
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
      setOptionsText("");
      queryClient.invalidateQueries({ queryKey: ['/api/survey-questions'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update question",
        variant: "destructive",
      });
    }
  });
  
  const deleteQuestionMutation = useMutation({
    mutationFn: deleteSurveyQuestion,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Survey question deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/survey-questions'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete question",
        variant: "destructive",
      });
    }
  });
  
  // Handle template form submission
  const handleTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updateTemplateMutation.mutate({
        ...editingTemplate,
        ...newTemplate
      });
    } else {
      createTemplateMutation.mutate(newTemplate);
    }
  };
  
  // Handle question form submission
  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse options from text field
    const options = optionsText
      .split('\n')
      .map(option => option.trim())
      .filter(option => option.length > 0);
    
    const questionData = {
      ...newQuestion,
      options
    };
    
    if (editingQuestion) {
      updateQuestionMutation.mutate({
        ...editingQuestion,
        ...questionData
      });
    } else {
      createQuestionMutation.mutate(questionData);
    }
  };
  
  // Set up edit template dialog
  const openEditTemplateDialog = (template: SurveyTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      title: template.title,
      description: template.description || "",
      status: template.status
    });
    setIsTemplateDialogOpen(true);
  };
  
  // Set up edit question dialog
  const openEditQuestionDialog = (question: SurveyQuestion) => {
    setEditingQuestion(question);
    setNewQuestion({
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
  
  // Handle dialog close
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
      questionText: "",
      questionType: "radio",
      required: true,
      order: 1,
      options: [],
      active: true
    });
    setOptionsText("");
  };
  
  // Get next order number for new questions
  useEffect(() => {
    if (questionsQuery.data && questionsQuery.data.length > 0) {
      const maxOrder = Math.max(...questionsQuery.data.map(q => q.order));
      setNewQuestion(prev => ({ ...prev, order: maxOrder + 1 }));
    }
  }, [questionsQuery.data]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Survey Administration</h2>
      </div>
      
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Survey Templates</TabsTrigger>
          <TabsTrigger value="questions">Survey Questions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex justify-between">
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
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? "Edit Survey Template" : "Create Survey Template"}</DialogTitle>
                  <DialogDescription>
                    {editingTemplate 
                      ? "Update the details of your survey template." 
                      : "Create a new survey template to organize your questions."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleTemplateSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newTemplate.title}
                        onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                        placeholder="Enter survey title"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newTemplate.description}
                        onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                        placeholder="Enter survey description"
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
                          <SelectItem value="published">Published</SelectItem>
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
                <p className="text-slate-600">No survey templates found. Create your first template to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templatesQuery.data?.map((template) => (
                <Card key={template.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{template.title}</CardTitle>
                      <Badge variant={
                        template.status === "published" ? "default" : 
                        template.status === "draft" ? "outline" : "secondary"
                      }>
                        {template.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Created: {formatDate(template.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 line-clamp-2">{template.description || "No description provided."}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2 pt-0">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditTemplateDialog(template)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteTemplateMutation.mutate(template.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    {template.status !== "published" && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => publishTemplateMutation.mutate(template.id)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Publish
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="questions" className="space-y-4 mt-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-semibold">Manage Survey Questions</h3>
            <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingQuestion(null);
                  setNewQuestion({
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
          
          {questionsQuery.isLoading ? (
            <div className="text-center py-4">Loading survey questions...</div>
          ) : questionsQuery.error ? (
            <div className="text-center py-4 text-red-500">
              Error loading questions: {questionsQuery.error.message}
            </div>
          ) : questionsQuery.data?.length === 0 ? (
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
                  <TableHead className="w-20">Required</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionsQuery.data?.sort((a, b) => a.order - b.order).map((question) => (
                  <TableRow key={question.id}>
                    <TableCell>{question.order}</TableCell>
                    <TableCell className="font-medium">{question.questionText}</TableCell>
                    <TableCell className="capitalize">{question.questionType}</TableCell>
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
                          onClick={() => deleteQuestionMutation.mutate(question.id)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}