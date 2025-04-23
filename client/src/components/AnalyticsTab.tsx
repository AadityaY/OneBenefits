import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Survey Analytics</CardTitle>
          <CardDescription>Analyze survey responses and track engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No survey data available for analysis. Complete surveys will appear here.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Engagement Metrics</CardTitle>
          <CardDescription>Monitor employee engagement over time</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Engagement metrics will be displayed here once there is sufficient data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}