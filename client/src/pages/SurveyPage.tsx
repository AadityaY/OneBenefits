import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSurveyTemplate } from "@/lib/surveyAdminApi";
import { getSurveyQuestionsByTemplateId } from "@/lib/surveyAdminApi";
import { submitSurveyResponse } from "@/lib/surveyApi";
import { SurveyQuestion, SurveyTemplate, InsertSurveyResponse } from "@shared/schema";

export default function SurveyPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const templateId = parseInt(id, 10);
  
  // Track current question index
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Track answers in a map
  const [answers, setAnswers] = useState<Map<number, string>>(new Map());
  
  // Track overall submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Fetch survey template
  const { 
    data: template, 
    isLoading: isLoadingTemplate, 
    error: templateError 
  } = useQuery({
    queryKey: ['/api/survey-templates', templateId],
    queryFn: () => getSurveyTemplate(templateId)
  });
  
  // Fetch survey questions
  const { 
    data: questions, 
    isLoading: isLoadingQuestions, 
    error: questionsError 
  } = useQuery({
    queryKey: ['/api/survey-templates', templateId, 'questions'],
    queryFn: () => getSurveyQuestionsByTemplateId(templateId)
  });
  
  // Submit survey response mutation
  const submitMutation = useMutation({
    mutationFn: submitSurveyResponse,
    onSuccess: () => {
      setSubmitSuccess(true);
      toast({
        title: "Survey submitted successfully!",
        description: "Thank you for your feedback",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit survey",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });
  
  // Handle next/previous navigation
  const goToNextQuestion = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // Handle answer change
  const handleAnswerChange = (questionId: number, value: string) => {
    const newAnswers = new Map(answers);
    newAnswers.set(questionId, value);
    setAnswers(newAnswers);
  };
  
  // Handle survey submission
  const handleSubmit = () => {
    if (!user || !template || !questions) return;
    
    // Check if all questions are answered
    const unansweredQuestions = questions.filter(q => !answers.has(q.id));
    
    if (unansweredQuestions.length > 0) {
      toast({
        title: "Please answer all questions",
        description: "There are some unanswered questions",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Format survey responses
    const response: InsertSurveyResponse = {
      templateId: template.id,
      userId: user.id,
      companyId: user.companyId,
      responses: Array.from(answers.entries()).map(([questionId, answer]) => ({
        questionId,
        response: answer
      })),
      submittedAt: new Date().toISOString()
    };
    
    submitMutation.mutate(response);
  };
  
  // When submission is successful, redirect after a delay
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        navigate('/surveys');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [submitSuccess, navigate]);
  
  // Loading state
  if (isLoadingTemplate || isLoadingQuestions) {
    return (
      <div className="p-6 pt-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Error state
  if (templateError || questionsError || !template || !questions) {
    return (
      <div className="p-6 pt-1">
        <div className="flex items-center space-x-2 text-destructive mb-4">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading survey. Please try again later.</span>
        </div>
        <Button onClick={() => navigate('/surveys')}>Return to Surveys</Button>
      </div>
    );
  }
  
  // Success state after submission
  if (submitSuccess) {
    return (
      <div className="p-6 pt-1">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-gradient-primary">Survey Submitted</CardTitle>
            <CardDescription>Thank you for completing the survey!</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
            <p className="text-center mb-2">Your feedback has been recorded successfully.</p>
            <p className="text-center text-muted-foreground">
              Redirecting you back to the surveys page...
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => navigate('/surveys')}
            >
              Return to Surveys
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Get current question
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  
  // Options for radio buttons
  const getOptions = (question: SurveyQuestion) => {
    if (!question.options) return [];
    
    try {
      return typeof question.options === 'string'
        ? JSON.parse(question.options)
        : question.options;
    } catch (e) {
      return [];
    }
  };
  
  return (
    <div className="p-6 pt-1">
      <PageHeader 
        title={template.title}
        description={template.description || "Please complete the following survey."} 
      />
      
      <div className="mt-6 max-w-3xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <Card className="shadow-md border-gradient">
          <CardHeader>
            <CardTitle className="text-gradient-primary">
              {currentQuestion.questionText}
            </CardTitle>
            {currentQuestion.description && (
              <CardDescription>{currentQuestion.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Form>
              {currentQuestion.type === 'text' ? (
                <div className="space-y-3">
                  <Label htmlFor="answer">Your Answer</Label>
                  <Textarea
                    id="answer"
                    placeholder="Type your answer here..."
                    value={answers.get(currentQuestion.id) || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>
              ) : (
                <RadioGroup
                  value={answers.get(currentQuestion.id) || ''}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  className="space-y-3"
                >
                  {getOptions(currentQuestion).map((option: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </Form>
          </CardContent>
          <Separator />
          <CardFooter className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button onClick={goToNextQuestion}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-primary to-primary-foreground hover-lift"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>Submit Survey</>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}