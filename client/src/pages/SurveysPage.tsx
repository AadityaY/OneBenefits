import SurveyTakingTab from "@/components/SurveyTakingTab";
import { ConsumerLayout } from "@/components/ConsumerLayout";

export default function SurveysPage() {
  return (
    <ConsumerLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 gradient-heading">Surveys</h1>
        <SurveyTakingTab />
      </div>
    </ConsumerLayout>
  );
}