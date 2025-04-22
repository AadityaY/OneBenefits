import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { submitSurveyResponse } from "@/lib/surveyApi";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const surveyFormSchema = z.object({
  healthSatisfaction: z.enum(["very_satisfied", "satisfied", "neutral", "dissatisfied", "very_dissatisfied"]),
  importantBenefits: z.array(z.enum(["health", "dental", "vision", "retirement", "pto", "parental_leave", "wellness"]))
    .min(1, "Please select at least one benefit")
    .max(3, "Please select no more than 3 benefits"),
  benefitsUnderstanding: z.enum(["very_well", "somewhat", "neutral", "not_much", "not_at_all"]),
  benefitsSuggestions: z.string().optional(),
  infoSession: z.enum(["yes", "no", "maybe"]),
});

type SurveyFormValues = z.infer<typeof surveyFormSchema>;

const defaultValues: SurveyFormValues = {
  healthSatisfaction: "neutral",
  importantBenefits: [],
  benefitsUnderstanding: "neutral",
  benefitsSuggestions: "",
  infoSession: "maybe",
};

export default function SurveyTab() {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues,
  });
  
  const submitMutation = useMutation({
    mutationFn: submitSurveyResponse,
    onSuccess: () => {
      toast({
        title: "Survey submitted",
        description: "Thank you for completing the employee benefits survey.",
      });
      setSubmitted(true);
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "There was an error submitting the survey.",
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(values: SurveyFormValues) {
    submitMutation.mutate(values);
  }
  
  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-green-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <h3 className="text-xl font-semibold mb-2">Survey Submitted Successfully</h3>
          <p className="text-slate-600 mb-4">
            Thank you for taking the time to complete our employee benefits survey. Your feedback is valuable to us!
          </p>
          <Button onClick={() => setSubmitted(false)}>Submit Another Response</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Employee Benefits Survey</h2>
        <p className="text-slate-600">Help us understand your preferences and needs regarding the employee benefits program.</p>
      </header>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <FormField
              control={form.control}
              name="healthSatisfaction"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="font-medium">1. How satisfied are you with the current health insurance options?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="very_satisfied" id="very_satisfied" />
                        <FormLabel htmlFor="very_satisfied" className="font-normal">Very satisfied</FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="satisfied" id="satisfied" />
                        <FormLabel htmlFor="satisfied" className="font-normal">Satisfied</FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="neutral" id="neutral" />
                        <FormLabel htmlFor="neutral" className="font-normal">Neutral</FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dissatisfied" id="dissatisfied" />
                        <FormLabel htmlFor="dissatisfied" className="font-normal">Dissatisfied</FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="very_dissatisfied" id="very_dissatisfied" />
                        <FormLabel htmlFor="very_dissatisfied" className="font-normal">Very dissatisfied</FormLabel>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg">
            <FormField
              control={form.control}
              name="importantBenefits"
              render={() => (
                <FormItem>
                  <FormLabel className="font-medium">2. Which of the following benefits are most important to you? (Select up to 3)</FormLabel>
                  <div className="space-y-2 mt-2">
                    <Controller
                      control={form.control}
                      name="importantBenefits"
                      render={({ field }) => {
                        return [
                          { id: "health", label: "Health insurance" },
                          { id: "dental", label: "Dental insurance" },
                          { id: "vision", label: "Vision insurance" },
                          { id: "retirement", label: "Retirement plan (401k/403b)" },
                          { id: "pto", label: "Paid time off" },
                          { id: "parental_leave", label: "Parental leave" },
                          { id: "wellness", label: "Wellness programs" },
                        ].map((item) => (
                          <div className="flex items-center space-x-2" key={item.id}>
                            <Checkbox
                              id={item.id}
                              checked={field.value?.includes(item.id as any)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  if (field.value.length >= 3) {
                                    toast({
                                      title: "Selection limit reached",
                                      description: "Please select no more than 3 benefits",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  field.onChange([...field.value, item.id]);
                                } else {
                                  field.onChange(
                                    field.value?.filter((value) => value !== item.id)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={item.id}
                              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {item.label}
                            </label>
                          </div>
                        ));
                      }}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg">
            <FormField
              control={form.control}
              name="benefitsUnderstanding"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">3. How well do you understand your current benefits package?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="very_well">Very well - I understand all aspects</SelectItem>
                      <SelectItem value="somewhat">Somewhat - I understand the basics</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="not_much">Not much - I'm confused about many aspects</SelectItem>
                      <SelectItem value="not_at_all">Not at all - I don't understand my benefits</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg">
            <FormField
              control={form.control}
              name="benefitsSuggestions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">4. Do you have any suggestions for improving our benefits program?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your ideas here..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg">
            <FormField
              control={form.control}
              name="infoSession"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="font-medium">5. Would you be interested in attending a benefits information session?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="info-yes" />
                        <FormLabel htmlFor="info-yes" className="font-normal">Yes</FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="info-no" />
                        <FormLabel htmlFor="info-no" className="font-normal">No</FormLabel>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="maybe" id="info-maybe" />
                        <FormLabel htmlFor="info-maybe" className="font-normal">Maybe</FormLabel>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button variant="outline" className="mr-3" type="button"
              onClick={() => form.reset(defaultValues)}
            >
              Reset Form
            </Button>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Submitting..." : "Submit Survey"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
