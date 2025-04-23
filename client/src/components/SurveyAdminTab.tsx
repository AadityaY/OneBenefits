import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SurveyAdminTab() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Survey Administration</CardTitle>
          <CardDescription>Create, edit, and manage survey templates for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            As an administrator, you can create and manage survey templates that will be available for employees to complete.
          </p>
          <div className="mt-4">
            <Button>Create New Survey Template</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Survey Templates</CardTitle>
          <CardDescription>View and manage current survey templates</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No active survey templates found. Create a new template to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}