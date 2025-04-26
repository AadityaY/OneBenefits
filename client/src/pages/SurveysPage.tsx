import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, BarChart, CheckSquare, Clock } from "lucide-react";
import { useCompanyTheme } from "@/hooks/use-company-theme";

export default function SurveysPage() {
  const { user } = useAuth();
  const { companySettings } = useCompanyTheme();

  // Dummy survey data for demonstration
  const activeSurveys = [
    {
      id: 1,
      title: "2025 Benefits Satisfaction Survey",
      description: "Help us understand how satisfied you are with your current benefits package.",
      deadline: "May 15, 2025",
      completed: false,
      questions: 12,
      estimatedTime: "5-10 minutes"
    },
    {
      id: 2,
      title: "Work-Life Balance Assessment",
      description: "Share your feedback on our current work-life balance initiatives.",
      deadline: "May 20, 2025",
      completed: false,
      questions: 8,
      estimatedTime: "3-5 minutes"
    }
  ];

  const completedSurveys = [
    {
      id: 3,
      title: "New Wellness Program Feedback",
      description: "Tell us what you think about our new wellness program offerings.",
      completedDate: "Apr 12, 2025",
      questions: 10,
      score: "Positive"
    }
  ];

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
              {activeSurveys.length} available survey{activeSurveys.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeSurveys.map((survey) => (
              <Card key={survey.id} className="hover-lift border-gradient">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gradient-primary">{survey.title}</CardTitle>
                  <CardDescription>{survey.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center text-sm text-muted-foreground space-x-4">
                    <div className="flex items-center">
                      <CheckSquare className="mr-1 h-4 w-4" />
                      <span>{survey.questions} questions</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      <span>{survey.estimatedTime}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <div className="text-sm">
                    Deadline: <span className="font-medium">{survey.deadline}</span>
                  </div>
                  <Button className="hover-lift" size="sm">
                    <Pencil className="mr-2 h-4 w-4" />
                    Start Survey
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Completed Surveys */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Completed Surveys</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {completedSurveys.map((survey) => (
              <Card key={survey.id} className="border-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{survey.title}</CardTitle>
                  <CardDescription>{survey.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center text-sm text-muted-foreground space-x-4">
                    <div className="flex items-center">
                      <CheckSquare className="mr-1 h-4 w-4" />
                      <span>{survey.questions} questions</span>
                    </div>
                    <div className="flex items-center">
                      <BarChart className="mr-1 h-4 w-4" />
                      <span>Overall response: {survey.score}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <div className="text-sm text-muted-foreground">
                    Completed: <span>{survey.completedDate}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    View Results
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}