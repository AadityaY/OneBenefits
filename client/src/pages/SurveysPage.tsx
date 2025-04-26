import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/ui/page-header";
import SurveyTakingTab from "@/components/SurveyTakingTab";

export default function SurveysPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 pt-1">
      <div className="space-y-8">
        <PageHeader 
          title="Take Survey" 
          description="Complete your benefits surveys to help us improve your experience."
        />
        <SurveyTakingTab />
      </div>
    </div>
  );
}