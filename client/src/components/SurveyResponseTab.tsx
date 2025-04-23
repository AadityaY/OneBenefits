import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { getSurveyTemplates } from "@/lib/surveyAdminApi";
import { getSurveyQuestionsByTemplateId } from "@/lib/surveyAdminApi";
import { apiRequest } from "@/lib/queryClient";
import { 
  SurveyTemplate, 
  SurveyQuestion, 
  InsertSurveyResponse,
  SurveyResponseItem,
} from "@shared/schema";
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

import { submitSurveyResponse as apiSubmitSurveyResponse } from "@/lib/surveyApi";

export default function SurveyResponseTab() {
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyTemplate | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get all published survey templates
  const templatesQuery = useQuery<SurveyTemplate[]>({
    queryKey: ['/api/survey-templates'],
    queryFn: getSurveyTemplates,
    retry: false,
  });
  
  // Get questions for the selected template
  const questionsQuery = useQuery<SurveyQuestion[]>({
    queryKey: ['/api/survey-questions', selectedTemplate?.id],
    queryFn: () => selectedTemplate?.id 
      ? getSurveyQuestionsByTemplateId(selectedTemplate.id)
      : Promise.resolve([]),
    enabled: !!selectedTemplate?.id,
    retry: false,
  });
  
  // Mutation for submitting responses
  const submitMutation = useMutation({
    mutationFn: apiSubmitSurveyResponse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey'] });
      setSubmitted(true);
      toast({
        title: "Survey submitted",
        description: "Thank you for your feedback!",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to submit survey. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Filter out only published templates
  const publishedTemplates = templatesQuery.data?.filter(t => t.publishedAt) || [];
  
  // Sort questions by order
  const sortedQuestions = questionsQuery.data?.sort((a, b) => a.order - b.order) || [];
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const id = parseInt(templateId);
    const template = templatesQuery.data?.find(t => t.id === id) || null;
    setSelectedTemplate(template);
    setSubmitted(false);
  };
  
  // Initialize form with dynamic schema based on questions
  const formSchema = z.object({
    responses: z.array(
      z.object({
        questionId: z.number(),
        questionText: z.string(),
        questionType: z.string(),
        response: z.union([z.string(), z.array(z.string())]).optional(),
      })
    ),
  });
  
  type FormValues = z.infer<typeof formSchema>;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      responses: sortedQuestions.map(q => ({
        questionId: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        response: q.questionType === "checkbox" ? [] : "",
      })),
    },
  });
  
  // When questions change, update the form default values
  const resetFormWithQuestions = () => {
    if (sortedQuestions.length > 0) {
      form.reset({
        responses: sortedQuestions.map(q => ({
          questionId: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          response: q.questionType === "checkbox" ? [] : "",
        })),
      });
    }
  };
  
  // Reset the form when questions change
  useEffect(() => {
    resetFormWithQuestions();
  }, [sortedQuestions.length]);
  
  // Handle form submission
  const onSubmit = (data: FormValues) => {
    if (!selectedTemplate) return;
    
    // Validate required fields
    const requiredQuestions = sortedQuestions.filter(q => q.required);
    
    const missingResponses = requiredQuestions.filter(q => {
      const response = data.responses.find(r => r.questionId === q.id)?.response;
      return !response || (Array.isArray(response) && response.length === 0);
    });
    
    if (missingResponses.length > 0) {
      missingResponses.forEach(q => {
        form.setError(`responses.${sortedQuestions.findIndex(sq => sq.id === q.id)}.response`, {
          type: "required",
          message: "This question is required",
        });
      });
      
      toast({
        title: "Missing responses",
        description: "Please answer all required questions",
        variant: "destructive",
      });
      
      return;
    }
    
    // Prepare data for submission
    const responseData: InsertSurveyResponse = {
      templateId: selectedTemplate.id,
      responses: data.responses.map(r => ({
        questionId: r.questionId,
        questionText: r.questionText,
        questionType: r.questionType,
        response: r.response || "", // Handle optional responses
      })) as SurveyResponseItem[],
    };
    
    // Submit the survey
    submitMutation.mutate(responseData);
  };
  
  // Render a question based on its type
  const renderQuestion = (question: SurveyQuestion) => {
    const questionIndex = sortedQuestions.findIndex(q => q.id === question.id);
    const fieldName = `responses.${questionIndex}.response`;
    
    switch (question.questionType) {
      case "text":
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={fieldName as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{question.questionText} {question.required && <span className="text-red-500">*</span>}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value as string || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case "textarea":
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={fieldName as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{question.questionText} {question.required && <span className="text-red-500">*</span>}</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value as string || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case "radio":
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={fieldName as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{question.questionText} {question.required && <span className="text-red-500">*</span>}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value as string || ""}
                    className="flex flex-col space-y-1"
                  >
                    {question.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${question.id}-option-${index}`} />
                        <label htmlFor={`${question.id}-option-${index}`} className="text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case "checkbox":
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={fieldName as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{question.questionText} {question.required && <span className="text-red-500">*</span>}</FormLabel>
                <div className="space-y-2">
                  {question.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${question.id}-option-${index}`}
                        checked={(field.value as string[] || []).includes(option)}
                        onCheckedChange={(checked) => {
                          const currentValues = Array.isArray(field.value) ? [...field.value] : [];
                          if (checked) {
                            field.onChange([...currentValues, option]);
                          } else {
                            field.onChange(currentValues.filter(value => value !== option));
                          }
                        }}
                      />
                      <label
                        htmlFor={`${question.id}-option-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case "select":
        return (
          <FormField
            key={question.id}
            control={form.control}
            name={fieldName as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{question.questionText} {question.required && <span className="text-red-500">*</span>}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value as string || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {question.options?.map((option, index) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      default:
        return null;
    }
  };
  
  // Define states for rendering
  const isLoading = templatesQuery.isLoading || questionsQuery.isLoading;
  const isSubmitting = submitMutation.isPending;
  const noTemplates = (!templatesQuery.isLoading && publishedTemplates.length === 0);
  const noQuestions = (selectedTemplate && !questionsQuery.isLoading && sortedQuestions.length === 0);
  
  // Form submission state for proper button handling
  const formState = form.formState;
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Survey Response</h2>
      <p className="text-muted-foreground">
        Complete surveys to provide feedback on employee benefits and programs.
      </p>
      
      {/* Survey selection */}
      <div className="mb-6">
        <label htmlFor="template-select" className="block text-sm font-medium mb-2">
          Select a survey to complete:
        </label>
        <Select
          value={selectedTemplate?.id.toString() || ""}
          onValueChange={handleTemplateSelect}
          disabled={isLoading || noTemplates}
        >
          <SelectTrigger className="w-full md:w-[300px]">
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
      
      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading surveys...</p>
          </CardContent>
        </Card>
      )}
      
      {/* No templates state */}
      {noTemplates && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AlertCircleIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No surveys available</h3>
              <p className="text-muted-foreground mt-2">
                There are no published surveys available to complete at the moment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* No questions state */}
      {noQuestions && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AlertCircleIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No questions in this survey</h3>
              <p className="text-muted-foreground mt-2">
                This survey doesn't have any questions yet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Success state */}
      {submitted && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2Icon className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Survey Submitted</AlertTitle>
          <AlertDescription className="text-green-700">
            Thank you for completing the survey! Your feedback has been recorded.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Survey form */}
      {selectedTemplate && sortedQuestions.length > 0 && !submitted && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTemplate.title}</CardTitle>
            <CardDescription>{selectedTemplate.description}</CardDescription>
            {selectedTemplate.publishedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Published on {formatDate(selectedTemplate.publishedAt)}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {sortedQuestions.map(question => (
                  <div key={question.id} className="mb-6 pb-6 border-b last:border-b-0">
                    {renderQuestion(question)}
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Survey"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
      
      {/* Survey information */}
      {!isLoading && !noTemplates && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Survey Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>Why complete these surveys?</AccordionTrigger>
                <AccordionContent>
                  <p>
                    Your feedback helps us improve our employee benefits and programs.
                    The information you provide will be used to make data-driven decisions
                    that benefit all employees.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Are my responses anonymous?</AccordionTrigger>
                <AccordionContent>
                  <p>
                    Yes, all survey responses are anonymous and will be aggregated for
                    reporting purposes. Individual responses cannot be identified.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>How often should I complete surveys?</AccordionTrigger>
                <AccordionContent>
                  <p>
                    We recommend completing all published surveys when they become available.
                    Surveys are typically published quarterly to track changes in employee
                    satisfaction and preferences over time.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}