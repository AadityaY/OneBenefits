import { useAuth } from "@/hooks/use-auth";
import { useCompanyTheme } from "@/hooks/use-company-theme";
import { PageHeader } from "@/components/ui/page-header";
import ChatTab from "@/components/ChatTab";

export default function ChatPage() {
  const { user } = useAuth();
  const { companySettings } = useCompanyTheme();
  
  // Use company-specific assistant name if available
  const assistantName = companySettings?.aiAssistantName || "Benefits Assistant";

  return (
    <div className="p-6 pt-1">
      <div className="space-y-8">
        <PageHeader 
          title={`${companySettings?.name ? `${companySettings.name} ` : ''}Benefits Chat`}
          description={`Have questions about your benefits? Ask ${assistantName} for help.`}
        />
        <ChatTab />
      </div>
    </div>
  );
}