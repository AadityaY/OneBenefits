import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/ui/page-header";
import CalendarTab from "@/components/CalendarTab";

export default function CalendarPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 pt-1">
      <div className="space-y-8">
        <PageHeader 
          title="Benefits Calendar" 
          description="View upcoming benefits events and important dates."
        />
        <CalendarTab />
      </div>
    </div>
  );
}