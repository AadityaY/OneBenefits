import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, BarChart, CheckSquare, Clock, Loader2 } from "lucide-react";
import { useCompanyTheme } from "@/hooks/use-company-theme";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";

// Import the API functions
import { getSurveyTemplates } from "@/lib/surveyAdminApi";
import { getSurveyResponses } from "@/lib/surveyApi";
import { SurveyQuestion, SurveyResponse, SurveyTemplate } from "@shared/schema";

export default function SurveysPage() {
  const { user } = useAuth();
  const { companySettings } = useCompanyTheme();

  // Fetch survey templates (active templates that can be taken)
  const { 
    data: surveyTemplates, 
    isLoading: isLoadingTemplates, 
    error: templatesError 
  } = useQuery({
    queryKey: ["/api/survey-templates"],
    queryFn: getSurveyTemplates
  });

  // Fetch survey responses (completed by this user)
  const {
    data: surveyResponses,
    isLoading: isLoadingResponses,
    error: responsesError
  } = useQuery({
    queryKey: ["/api/survey"],
    queryFn: getSurveyResponses
  });

  // Filter for active published templates
  const activeSurveys = surveyTemplates?.filter(template => 
    template.status === "published"
  ) || [];

  // Map of template IDs that the user has already completed
  const completedTemplateIds = new Set((surveyResponses || [])
    .filter(response => response.userId === user?.id)
    .map(response => response.templateId)
  );

  // Filter for surveys that haven't been completed by this user
  const availableSurveys = activeSurveys.filter(
    template => !completedTemplateIds.has(template.id)
  );

  // Format the completion date
  const formatDate = (dateString: string | Date) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Estimated time based on number of questions (approx)
  const getEstimatedTime = (numQuestions: number = 5) => {
    const minTime = Math.max(1, Math.round(numQuestions * 0.5));
    const maxTime = Math.max(2, Math.round(numQuestions * 1.5));
    return `${minTime}-${maxTime} minutes`;
  };

  // Calculate a deadline date (for demonstration, 14 days from published date)
  const getDeadlineDate = (publishedAt: string | Date) => {
    const published = new Date(publishedAt);
    const deadline = new Date(published);
    deadline.setDate(published.getDate() + 14);
    return format(deadline, "MMM d, yyyy");
  };

  // Loading state
  if (isLoadingTemplates || isLoadingResponses) {
    return (
      <div className="p-6 pt-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (templatesError || responsesError) {
    return (
      <div className="p-6 pt-1">
        <div className="text-destructive">
          Error loading surveys. Please try again later.
        </div>
      </div>
    );
  }

  // Find completed surveys
  const completedSurveys = surveyTemplates?.filter(template => 
    completedTemplateIds.has(template.id)
  ) || [];

  return (
    <div className="p-6 pt-1">
      <div className="space-y-8">
        <PageHeader 
          title="Surveys & Feedback" 
          description="Complete surveys to help us improve your benefits experience."
        />

        {/* Active Surveys */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Active Surveys</h2>
            <div className="text-sm text-muted-foreground">
              {availableSurveys.length} available survey{availableSurveys.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          {availableSurveys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableSurveys.map((survey) => (
                <Card key={survey.id} className="hover-lift border-gradient">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-gradient-primary">{survey.title}</CardTitle>
                    <CardDescription>{survey.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center text-sm text-muted-foreground space-x-4">
                      <div className="flex items-center">
                        <CheckSquare className="mr-1 h-4 w-4" />
                        <span>Survey questions</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        <span>{getEstimatedTime()} (estimated)</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <div className="text-sm">
                      Available until: <span className="font-medium">
                        {survey.publishedAt 
                          ? getDeadlineDate(String(survey.publishedAt)) 
                          : "Available now"}
                      </span>
                    </div>
                    <Link href={`/survey/${survey.id}`}>
                      <Button className="hover-lift" size="sm">
                        <Pencil className="mr-2 h-4 w-4" />
                        Start Survey
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="flex items-center justify-center p-8">
                <p className="text-muted-foreground text-center">
                  No active surveys available at this time. Check back later!
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Completed Surveys */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Completed Surveys</h2>
            <div className="text-sm text-muted-foreground">
              {completedSurveys.length} completed
            </div>
          </div>
          
          {completedSurveys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedSurveys.map((survey) => {
                const userResponse = surveyResponses?.find(r => 
                  r.userId === user?.id && r.templateId === survey.id
                );
                
                return (
                  <Card key={survey.id} className="border-muted">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{survey.title}</CardTitle>
                      <CardDescription>{survey.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center text-sm text-muted-foreground space-x-4">
                        <div className="flex items-center">
                          <CheckSquare className="mr-1 h-4 w-4" />
                          <span>Completed</span>
                        </div>
                        <div className="flex items-center">
                          <BarChart className="mr-1 h-4 w-4" />
                          <span>Thank you for your feedback</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <div className="text-sm text-muted-foreground">
                        Completed: <span>
                          {userResponse?.submittedAt 
                            ? formatDate(String(userResponse.submittedAt)) 
                            : "Recently"}
                        </span>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        Submitted
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="flex items-center justify-center p-8">
                <p className="text-muted-foreground text-center">
                  You haven't completed any surveys yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}