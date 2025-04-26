import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/ui/page-header";
import ChatTab from "@/components/ChatTab";

export default function ChatPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 pt-1">
      <div className="space-y-8">
        <PageHeader 
          title="Benefits Chat" 
          description="Have questions about your benefits? Ask our AI assistant."
        />
        <ChatTab />
      </div>
    </div>
  );
}