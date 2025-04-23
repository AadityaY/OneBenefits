import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  getSurveyTemplates, 
  getSurveyQuestionsByTemplateId 
} from "@/lib/surveyAdminApi";
import { submitSurveyResponse } from "@/lib/surveyApi";
import { SurveyTemplate, SurveyQuestion, InsertSurveyResponse } from "@shared/schema";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function SurveyResponseTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyTemplate | null>(null);
  const [formResponses, setFormResponses] = useState<Record<number, any>>({});
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "submitted">("idle");

  // Queries
  const templatesQuery = useQuery<SurveyTemplate[]>({
    queryKey: ['/api/survey-templates'],
    queryFn: getSurveyTemplates,
    retry: false
  });

  const questionsQuery = useQuery<SurveyQuestion[]>({
    queryKey: ['/api/survey-questions', selectedTemplate?.id],
    queryFn: () => selectedTemplate?.id 
      ? getSurveyQuestionsByTemplateId(selectedTemplate.id)
      : Promise.resolve([]),
    enabled: !!selectedTemplate?.id,
    retry: false
  });

  // Get only published and active templates
  const publishedTemplates = templatesQuery.data?.filter(
    template => template.publishedAt && template.status === "active"
  ) || [];

  // Get questions sorted by order
  const sortedQuestions = questionsQuery.data
    ?.filter(question => question.active)
    ?.sort((a, b) => a.order - b.order) || [];

  // Mutation for submitting survey response
  const submitResponseMutation = useMutation({
    mutationFn: (data: InsertSurveyResponse) => {
      return submitSurveyResponse(data);
    },
    onSuccess: () => {
      setSubmissionStatus("submitted");
      toast({
        title: "Success",
        description: "Your survey response has been submitted. Thank you!",
      });
    },
    onError: (error) => {
      setSubmissionStatus("idle");
      toast({
        title: "Error",
        description: `Failed to submit survey: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const id = parseInt(templateId);
    const template = templatesQuery.data?.find(t => t.id === id) || null;
    setSelectedTemplate(template);
    setFormResponses({});
  };

  // Handle form field change
  const handleResponseChange = (questionId: number, value: any) => {
    setFormResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!selectedTemplate) return;
    
    // Validate required fields
    const missingRequired = sortedQuestions
      .filter(q => q.required)
      .some(q => {
        const response = formResponses[q.id];
        return response === undefined || response === null || response === "" || 
          (Array.isArray(response) && response.length === 0);
      });
    
    if (missingRequired) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmissionStatus("submitting");
    
    // Format response data
    const responseData: InsertSurveyResponse = {
      // Map response properties from formResponses based on question types
      // Actual structure will depend on your schema definition
      templateId: selectedTemplate.id,
      responses: Object.entries(formResponses).map(([questionId, value]) => {
        const question = sortedQuestions.find(q => q.id === parseInt(questionId));
        return {
          questionId: parseInt(questionId),
          questionText: question?.questionText || "",
          questionType: question?.questionType || "",
          response: Array.isArray(value) ? value : String(value)
        };
      })
    };
    
    submitResponseMutation.mutate(responseData);
  };

  // Render question based on its type
  const renderQuestion = (question: SurveyQuestion) => {
    const isRequired = question.required;
    const response = formResponses[question.id];
    
    return (
      <div key={question.id} className="mb-6 p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-medium">{question.questionText}</h3>
          {isRequired && <Badge className="bg-red-500">Required</Badge>}
        </div>
        
        {question.questionType === "text" && (
          <Input
            value={response || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Your answer"
            className="mt-2"
          />
        )}
        
        {question.questionType === "textarea" && (
          <Textarea
            value={response || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Your answer"
            rows={3}
            className="mt-2"
          />
        )}
        
        {question.questionType === "radio" && (
          <RadioGroup
            value={response || ""}
            onValueChange={(value) => handleResponseChange(question.id, value)}
            className="mt-2 space-y-2"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-option-${index}`} />
                <Label htmlFor={`${question.id}-option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
        
        {question.questionType === "checkbox" && (
          <div className="mt-2 space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  checked={(response || []).includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const newValue = [...(response || []), option];
                      handleResponseChange(question.id, newValue);
                    } else {
                      const newValue = (response || []).filter((item: string) => item !== option);
                      handleResponseChange(question.id, newValue);
                    }
                  }}
                  id={`${question.id}-option-${index}`}
                />
                <Label htmlFor={`${question.id}-option-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        )}
        
        {question.questionType === "select" && (
          <Select
            value={response || ""}
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Available Surveys</h2>
      <p className="text-muted-foreground">
        Complete the available surveys to provide your feedback.
      </p>

      {/* Survey selection */}
      <div className="mb-6">
        <Label htmlFor="templateSelect">Select a survey to complete:</Label>
        <Select
          value={selectedTemplate?.id.toString() || ""}
          onValueChange={handleTemplateSelect}
          disabled={submissionStatus === "submitting" || submissionStatus === "submitted"}
        >
          <SelectTrigger className="w-full max-w-md mt-2">
            <SelectValue placeholder="Select a survey" />
          </SelectTrigger>
          <SelectContent>
            {publishedTemplates.map(template => (
              <SelectItem key={template.id} value={template.id.toString()}>
                {template.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading and empty states */}
      {!selectedTemplate && publishedTemplates.length > 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">Please select a survey from the dropdown above to begin.</p>
          </CardContent>
        </Card>
      )}

      {publishedTemplates.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">No published surveys available at this time.</p>
          </CardContent>
        </Card>
      )}

      {selectedTemplate && questionsQuery.isLoading && (
        <div className="text-center py-6">Loading survey questions...</div>
      )}

      {/* Survey form */}
      {selectedTemplate && !questionsQuery.isLoading && submissionStatus === "idle" && (
        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>{selectedTemplate.title}</CardTitle>
              {selectedTemplate.description && (
                <CardDescription>{selectedTemplate.description}</CardDescription>
              )}
            </CardHeader>
          </Card>

          {sortedQuestions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-slate-600">This survey doesn't have any questions yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              <div className="space-y-4 mb-6">
                {sortedQuestions.map(renderQuestion)}
              </div>
              
              <Button 
                onClick={handleSubmit}
                className="w-full md:w-auto"
                disabled={submissionStatus === "submitting"}
              >
                {submissionStatus === "submitting" ? "Submitting..." : "Submit Survey"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Submission success state */}
      {submissionStatus === "submitted" && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center space-y-4 py-6">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <h3 className="text-xl font-semibold">Thank You!</h3>
              <p className="text-slate-600">Your response has been submitted successfully.</p>
              <Button 
                onClick={() => {
                  setSelectedTemplate(null);
                  setFormResponses({});
                  setSubmissionStatus("idle");
                }}
              >
                Complete Another Survey
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}