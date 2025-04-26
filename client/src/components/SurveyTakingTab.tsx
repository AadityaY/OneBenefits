import { useState } from "react";
import benefitsHeroSvg from '../assets/benefits_hero.svg';
import benefitsSurveySvg from '../assets/benefits_survey.svg';
import healthBenefitSvg from '../assets/health_benefit.svg';
import retirementBenefitSvg from '../assets/retirement_benefit.svg';
import wellbeingBenefitSvg from '../assets/wellbeing_benefit.svg';

// Helper function to safely handle options that could be string or string[]
const getOptionsArray = (options: string | string[] | null): string[] => {
  if (!options) return [];
  if (typeof options === 'string') return options.split('\n');
  return options;
};
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
    data: allTemplates, 
    isLoading: loadingTemplates 
  } = useQuery<SurveyTemplate[]>({ 
    queryKey: ["/api/survey-templates", companyId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!companyId,
  });
  
  // Filter for only published templates
  const templates = allTemplates?.filter(template => template.published === true);
  
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
    // Make sure there is a current question before proceeding
    if (!currentQuestion) {
      toast({
        title: "Error",
        description: "No question found. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    
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
    // Make sure there are questions to navigate through
    if (!sortedQuestions.length) {
      toast({
        title: "Error",
        description: "No questions found. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  // Handle survey submission
  const handleSubmitSurvey = async () => {
    if (sortedQuestions.length === 0 || !selectedTemplate) {
      toast({
        title: "Cannot submit survey",
        description: "No questions or template found. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    
    try {
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
    } catch (error) {
      console.error('Error during survey submission:', error);
      setSubmitting(false);
      toast({
        title: "Error",
        description: "An error occurred while submitting your survey. Please try again.",
        variant: "destructive",
      });
    }
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
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="bg-gradient-to-br from-purple-50 to-cyan-50 p-8 rounded-xl shadow-sm">
          <div className="flex flex-col items-center space-y-8">
            {/* Success animation with gradient */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 blur-lg opacity-30 animate-pulse"></div>
              <div className="relative h-28 w-28 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 flex items-center justify-center">
                <CheckCircle className="h-14 w-14 text-white" />
              </div>
            </div>
            
            <div className="space-y-3 max-w-xl">
              <h2 className="text-3xl font-bold gradient-text">Thank You for Your Feedback!</h2>
              <p className="text-gray-600 text-lg">
                Your responses have been successfully submitted and will help us enhance your benefits experience.
              </p>
            </div>
            
            <div className="pt-4 flex gap-4">
              <Button 
                onClick={handleReturnToList} 
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                Return to Surveys
              </Button>
            </div>
            
            {/* Decorative illustrations */}
            <div className="flex items-center justify-center gap-8 mt-4">
              <img src={healthBenefitSvg} alt="" className="w-20 h-20 opacity-80" />
              <img src={retirementBenefitSvg} alt="" className="w-20 h-20 opacity-80" />
              <img src={wellbeingBenefitSvg} alt="" className="w-20 h-20 opacity-80" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render survey-taking interface if a survey is started
  if (surveyStarted && selectedTemplate && questions) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Survey Header with gradient styling */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-cyan-50 p-6 rounded-xl">
            <h2 className="text-2xl font-bold gradient-text">{selectedTemplate.title}</h2>
            <p className="text-gray-600 mt-2">{selectedTemplate.description}</p>
            
            <div className="flex items-center space-x-4 mt-6">
              <img src={benefitsSurveySvg} alt="Survey" className="w-16 h-16" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-purple-700">
                    Question {currentQuestionIndex + 1} of {sortedQuestions.length}
                  </div>
                  <div className="text-sm font-medium text-pink-600">{progressPercentage}% Complete</div>
                </div>
                <Progress value={progressPercentage} className="h-3 mt-1 bg-gray-100 rounded-full progress-gradient" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Current Question */}
        {currentQuestion && (
          <Card className="border shadow-sm card-hover">
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
                    {getOptionsArray(currentQuestion.options).map((option: string, i: number) => (
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
              
              {currentQuestion.questionType === "radio" && currentQuestion.options && (
                <RadioGroup
                  value={responses[currentQuestion.id] || ""}
                  onValueChange={(value) => handleResponseChange(currentQuestion.id, value)}
                  className="space-y-3"
                >
                  {getOptionsArray(currentQuestion.options).map((option: string, i: number) => (
                    <div key={i} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${currentQuestion.id}-${i}`} />
                      <Label htmlFor={`option-${currentQuestion.id}-${i}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              
              {currentQuestion.questionType === "checkbox" && currentQuestion.options && (
                <div className="space-y-3">
                  {getOptionsArray(currentQuestion.options).map((option: string, i: number) => (
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
  // Avatar images for visual appeal - these are from an open API that generates avatars
  const avatarImages = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Bailey",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe"
  ];
  
  // Hero illustration backgrounds for cards
  const cardBackgrounds = [
    "https://api.dicebear.com/7.x/shapes/svg?seed=survey1&backgroundColor=edf2ff",
    "https://api.dicebear.com/7.x/shapes/svg?seed=survey2&backgroundColor=fff0f6",
    "https://api.dicebear.com/7.x/shapes/svg?seed=survey3&backgroundColor=f3f0ff",
    "https://api.dicebear.com/7.x/shapes/svg?seed=survey4&backgroundColor=e6fcf5"
  ];
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-heading">Available Surveys</h2>
          <p className="text-muted-foreground mt-1">Complete surveys to help us improve your benefits experience</p>
        </div>
        
        <div className="flex -space-x-3">
          {avatarImages.slice(0, 4).map((avatar, i) => (
            <div key={i} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden">
              <img src={avatar} alt="Team member avatar" />
            </div>
          ))}
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium border-2 border-background">
            +12
          </div>
        </div>
      </div>
      
      {templates && templates.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {templates.map((template, index) => {
            // Get a consistent background and avatar for each template
            const bgIndex = template.id % cardBackgrounds.length;
            const cardBg = cardBackgrounds[bgIndex];
            
            return (
              <Card key={template.id} className="overflow-hidden card-hover border-gradient relative">
                {/* Decorative gradient circle */}
                <div className="absolute top-0 right-0 h-32 w-32 opacity-20 -mt-10 -mr-10 rounded-full bg-gradient-to-br from-secondary via-primary to-accent z-0" />
                
                <div className="absolute right-0 top-0 h-24 w-24 opacity-10">
                  <img src={cardBg} alt="" className="object-cover" />
                </div>
                
                <CardHeader className="pb-2 relative z-10">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl mb-1 gradient-text">{template.title}</CardTitle>
                    <Badge variant={previousResponses?.some(r => r.templateId === template.id) ? "secondary" : "default"}>
                      {previousResponses?.some(r => r.templateId === template.id) ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </>
                      ) : (
                        <>
                          <FileText className="h-3 w-3 mr-1" />
                          New
                        </>
                      )}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pb-2 relative z-10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <CalendarClock className="h-3 w-3 mr-1" />
                      <span>Added {new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex -space-x-2">
                      {[0, 1, 2].map((i) => (
                        <img 
                          key={i} 
                          src={avatarImages[(i + bgIndex) % avatarImages.length]}
                          alt="User avatar" 
                          className="w-7 h-7 rounded-full border-2 border-background" 
                        />
                      ))}
                    </div>
                  </div>
                  
                  {previousResponses?.some(r => r.templateId === template.id) && (
                    <div className="mt-3 flex items-center p-2 rounded bg-green-50 text-green-700 text-sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span>You've already completed this survey</span>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="p-4 pt-2 relative z-10">
                  <Button 
                    className="w-full group"
                    variant={previousResponses?.some(r => r.templateId === template.id) ? "outline" : "default"}
                    onClick={() => handleStartSurvey(template)}
                    disabled={loadingPreviousResponses}
                  >
                    <span>
                      {previousResponses?.some(r => r.templateId === template.id)
                        ? "View Your Responses" 
                        : "Start Survey"}
                    </span>
                    <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="border rounded-lg p-12 text-center glass-effect">
          <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <ClipboardCheck className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-medium mb-2 gradient-text">No Surveys Available</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            There are no surveys available for you to take at this time. Please check back later.
          </p>
          <div className="mt-8 flex justify-center">
            {avatarImages.slice(0, 3).map((avatar, i) => (
              <div key={i} className="w-12 h-12 rounded-full border-2 border-background -ml-2 first:ml-0 overflow-hidden">
                <img src={avatar} alt="Team member avatar" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}