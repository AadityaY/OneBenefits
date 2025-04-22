import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChatMessages, sendChatMessage } from "@/lib/chatApi";
import { ChatMessage } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const SUGGESTED_QUESTIONS = [
  "What is the dental coverage?",
  "How much is the 401k match?",
  "When is open enrollment?",
  "What wellness programs are offered?"
];

export default function ChatbotTab() {
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/chat'],
    queryFn: getChatMessages
  });
  
  const sendMutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/chat'], data);
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    sendMessage(message);
  };
  
  const sendMessage = (text: string) => {
    sendMutation.mutate(text);
    setMessage("");
  };
  
  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };
  
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Document Chat</h2>
        <p className="text-slate-600">Ask questions about your employee benefits documents.</p>
      </header>
      
      <div className="bg-slate-50 rounded-lg border border-slate-200 h-[500px] flex flex-col">
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {isLoading ? (
            <>
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-primary text-white rounded-full p-2">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="ml-3 bg-white p-3 rounded-lg shadow-sm max-w-[80%]">
                  <Skeleton className="h-4 w-[250px] mb-2" />
                  <Skeleton className="h-4 w-[180px]" />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Welcome message if no messages yet */}
              {(!messages || messages.length === 0) && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary text-white rounded-full p-2">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="ml-3 bg-white p-3 rounded-lg shadow-sm max-w-[80%]">
                    <p className="text-sm">
                      Hello! I'm your benefits assistant. I can answer questions about your uploaded employee benefits documents. How can I help you today?
                    </p>
                  </div>
                </div>
              )}
              
              {/* Chat messages */}
              {messages && messages.map((msg: ChatMessage, index: number) => (
                <div key={index} className={`flex items-start ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role !== 'user' && (
                    <div className="flex-shrink-0 bg-primary text-white rounded-full p-2">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div 
                    className={`${
                      msg.role === 'user' 
                        ? 'mr-3 bg-blue-50' 
                        : 'ml-3 bg-white'
                    } p-3 rounded-lg shadow-sm max-w-[80%]`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 bg-slate-200 rounded-full p-2">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Loading indicator for in-flight message */}
              {sendMutation.isPending && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary text-white rounded-full p-2">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="ml-3 bg-white p-3 rounded-lg shadow-sm max-w-[80%]">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                      <div className="h-2 w-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="border-t border-slate-200 p-3 bg-white flex items-center">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Type your question about benefits..."
            disabled={sendMutation.isPending}
          />
          <Button 
            type="submit" 
            size="icon" 
            variant="ghost" 
            className="text-primary hover:text-blue-700"
            disabled={sendMutation.isPending || !message.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
      
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Suggested questions:</h3>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full"
              onClick={() => handleSuggestedQuestion(question)}
              disabled={sendMutation.isPending}
            >
              {question}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
