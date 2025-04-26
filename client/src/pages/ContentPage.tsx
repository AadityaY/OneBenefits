import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/ui/page-header";
import DocumentsListComponent from "@/components/DocumentsListComponent";

export default function ContentPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 pt-1">
      <div className="space-y-8">
        <PageHeader 
          title="Benefits Content" 
          description="Access your benefits documentation and resources."
        />
        <DocumentsListComponent />
      </div>
    </div>
  );
}