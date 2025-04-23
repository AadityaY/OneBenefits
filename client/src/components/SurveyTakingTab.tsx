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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Loader2,
  FileText,
  ChevronRight,
  CalendarClock,
  ClipboardCheck,
  AlertCircle,
  FileCheck
} from "lucide-react";
import { 
  SurveyTemplate, 
  SurveyQuestion,
  SurveyResponse,
  questionTypeEnum,
  insertSurveyResponseSchema
} from "@shared/schema";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function SurveyTakingTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get company ID from user
  const companyId = user?.companyId;
  
  // States for survey taking flow
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyTemplate | null>(null);
  const [surveyStarted, setSurveyStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  
  // Fetch all published survey templates
  const { 
    data: templates, 
    isLoading: loadingTemplates 
  } = useQuery<SurveyTemplate[]>({ 
    queryKey: ["/api/survey-templates", companyId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!companyId,
  });
  
  // Fetch survey questions when a template is selected
  const { 
    data: questions, 
    isLoading: loadingQuestions 
  } = useQuery<SurveyQuestion[]>({ 
    queryKey: ["/api/survey-questions", selectedTemplate?.id],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!selectedTemplate,
  });
  
  // Fetch previously submitted responses by this user for this template
  const { 
    data: previousResponses, 
    isLoading: loadingPreviousResponses
  } = useQuery<SurveyResponse[]>({ 
    queryKey: ["/api/survey", selectedTemplate?.id],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!selectedTemplate && !!user,
  });
  
  // Submit survey response
  const submitResponseMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(
        "POST", 
        `/api/survey?companyId=${companyId}`, 
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survey"] });
      setSubmitSuccess(true);
      setSubmitting(false);
      toast({
        title: "Survey submitted",
        description: "Thank you for completing the survey!",
      });
    },
    onError: (error: Error) => {
      setSubmitting(false);
      toast({
        title: "Failed to submit survey",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Check if user has already completed this survey
  const hasCompletedSurvey = previousResponses && previousResponses.length > 0;
  
  // Get sorted questions
  const sortedQuestions = questions 
    ? [...questions].sort((a, b) => a.order - b.order) 
    : [];
  
  // Current question being answered
  const currentQuestion = sortedQuestions[currentQuestionIndex];
  
  // Calculate progress percentage
  const progressPercentage = sortedQuestions.length 
    ? Math.round(((currentQuestionIndex + 1) / sortedQuestions.length) * 100) 
    : 0;
  
  // Handle starting a survey
  const handleStartSurvey = (template: SurveyTemplate) => {
    setSelectedTemplate(template);
    setSurveyStarted(true);
    setCurrentQuestionIndex(0);
    setResponses({});
    setSubmitSuccess(false);
  };
  
  // Handle response changes
  const handleResponseChange = (questionId: number, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };
  
  // Handle moving to the next question
  const handleNextQuestion = () => {
    // Ensure current question is answered if required
    if (currentQuestion.required && !responses[currentQuestion.id]) {
      toast({
        title: "Required question",
        description: "Please answer this question before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentQuestionIndex < sortedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Show submit confirmation
      setShowConfirmSubmit(true);
    }
  };
  
  // Handle moving to the previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  // Handle survey submission
  const handleSubmitSurvey = async () => {
    if (sortedQuestions.length === 0 || !selectedTemplate) return;
    
    // Check if all required questions are answered
    const unansweredRequired = sortedQuestions
      .filter(q => q.required && !responses[q.id])
      .map(q => q.questionText);
    
    if (unansweredRequired.length > 0) {
      toast({
        title: "Required questions",
        description: `Please answer all required questions before submitting.`,
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    // Format responses for submission
    const formattedResponses = sortedQuestions.map(question => ({
      questionId: question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      response: responses[question.id] || null
    }));
    
    const surveyResponse = {
      templateId: selectedTemplate.id,
      responses: formattedResponses,
    };
    
    submitResponseMutation.mutate(surveyResponse);
  };
  
  // Handle returning to the templates list
  const handleReturnToList = () => {
    setSelectedTemplate(null);
    setSurveyStarted(false);
    setCurrentQuestionIndex(0);
    setResponses({});
    setSubmitSuccess(false);
  };
  
  // Render loading state
  if (loadingTemplates) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading available surveys...</span>
      </div>
    );
  }
  
  // Render success screen after submission
  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <CheckCircle className="h-12 w-12" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Thank You for Your Feedback!</h2>
        <p className="text-muted-foreground">
          Your responses have been successfully submitted and will help us improve.
        </p>
        <Button onClick={handleReturnToList} size="lg">
          Return to Surveys
        </Button>
      </div>
    );
  }
  
  // Render survey-taking interface if a survey is started
  if (surveyStarted && selectedTemplate && questions) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Survey Header */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{selectedTemplate.title}</h2>
          <p className="text-muted-foreground">{selectedTemplate.description}</p>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm">
              Question {currentQuestionIndex + 1} of {sortedQuestions.length}
            </div>
            <div className="text-sm font-medium">{progressPercentage}% Complete</div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        {/* Current Question */}
        {currentQuestion && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start space-x-4">
                <span className="flex-none w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                  {currentQuestionIndex + 1}
                </span>
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    {currentQuestion.questionText}
                    {currentQuestion.required && <span className="text-destructive ml-1">*</span>}
                  </CardTitle>
                  <CardDescription>
                    {currentQuestion.required 
                      ? "This question requires an answer" 
                      : "This question is optional"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Render different input types based on question type */}
              {currentQuestion.questionType === "text" && (
                <Input
                  placeholder="Your answer..."
                  value={responses[currentQuestion.id] || ""}
                  onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                />
              )}
              
              {currentQuestion.questionType === "textarea" && (
                <Textarea
                  placeholder="Your answer..."
                  className="min-h-[120px]"
                  value={responses[currentQuestion.id] || ""}
                  onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                />
              )}
              
              {currentQuestion.questionType === "number" && (
                <Input
                  type="number"
                  placeholder="0"
                  value={responses[currentQuestion.id] || ""}
                  onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                />
              )}
              
              {currentQuestion.questionType === "select" && currentQuestion.options && (
                <Select
                  value={responses[currentQuestion.id] || ""}
                  onValueChange={(value) => handleResponseChange(currentQuestion.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentQuestion.options.split('\n').map((option, i) => (
                      <SelectItem key={i} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {currentQuestion.questionType === "date" && (
                <Input
                  type="date"
                  value={responses[currentQuestion.id] || ""}
                  onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                />
              )}
              
              {currentQuestion.questionType === "multichoice" && currentQuestion.options && (
                <RadioGroup
                  value={responses[currentQuestion.id] || ""}
                  onValueChange={(value) => handleResponseChange(currentQuestion.id, value)}
                  className="space-y-3"
                >
                  {currentQuestion.options.split('\n').map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${currentQuestion.id}-${i}`} />
                      <Label htmlFor={`option-${currentQuestion.id}-${i}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              
              {currentQuestion.questionType === "checkbox" && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.split('\n').map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox
                        id={`check-${currentQuestion.id}-${i}`}
                        checked={
                          responses[currentQuestion.id]
                            ? responses[currentQuestion.id].includes(option)
                            : false
                        }
                        onCheckedChange={(checked) => {
                          const currentValues = responses[currentQuestion.id] || [];
                          const newValues = checked
                            ? [...currentValues, option]
                            : currentValues.filter((val: string) => val !== option);
                          handleResponseChange(currentQuestion.id, newValues);
                        }}
                      />
                      <Label htmlFor={`check-${currentQuestion.id}-${i}`}>{option}</Label>
                    </div>
                  ))}
                </div>
              )}
              
              {currentQuestion.questionType === "scale" && (
                <div className="flex justify-between space-x-2 py-4">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="text-center">
                      <div 
                        className={`
                          w-12 h-12 rounded-full border flex items-center justify-center 
                          text-lg font-medium cursor-pointer transition-colors
                          ${responses[currentQuestion.id] === num.toString() 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-primary/10'}
                        `}
                        onClick={() => handleResponseChange(currentQuestion.id, num.toString())}
                      >
                        {num}
                      </div>
                      {num === 1 && <div className="text-xs mt-1">Poor</div>}
                      {num === 3 && <div className="text-xs mt-1">Average</div>}
                      {num === 5 && <div className="text-xs mt-1">Excellent</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t bg-muted/50 p-3 flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button onClick={handleNextQuestion}>
                {currentQuestionIndex < sortedQuestions.length - 1 ? "Next" : "Review & Submit"}
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Survey?</AlertDialogTitle>
              <AlertDialogDescription>
                You're about to submit your responses for this survey. Once submitted, your responses cannot be changed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Review Answers</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleSubmitSurvey}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Survey"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Button to return to survey list */}
        <div className="pt-6 border-t">
          <Button variant="ghost" onClick={handleReturnToList}>
            Return to survey list
          </Button>
        </div>
      </div>
    );
  }
  
  // Render survey selection list
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Available Surveys</h2>
      </div>
      
      {templates && templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{template.title}</span>
                  <Badge variant="outline">
                    <FileText className="h-3 w-3 mr-1" />
                    Survey
                  </Badge>
                </CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-0">
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarClock className="h-3 w-3 mr-1" />
                  <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
                
                {previousResponses?.some(r => r.templateId === template.id) && (
                  <div className="mt-3 flex items-center p-2 rounded bg-green-50 text-green-700 text-sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>You've already completed this survey</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-4">
                <Button 
                  className="w-full"
                  onClick={() => handleStartSurvey(template)}
                  disabled={loadingPreviousResponses}
                >
                  {previousResponses?.some(r => r.templateId === template.id)
                    ? "View Responses" 
                    : "Start Survey"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg p-8 text-center">
          <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Surveys Available</h3>
          <p className="text-muted-foreground">
            There are no surveys available for you to take at this time. Please check back later.
          </p>
        </div>
      )}
    </div>
  );
}