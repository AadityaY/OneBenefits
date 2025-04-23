import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SurveyTakingTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Surveys</CardTitle>
          <CardDescription>Complete surveys assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No surveys are currently available for you to complete. Check back later.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Completed Surveys</CardTitle>
          <CardDescription>View your survey history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You haven't completed any surveys yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}