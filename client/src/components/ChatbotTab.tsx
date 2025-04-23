import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, RefreshCcw, Info, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChatMessages, sendChatMessage } from "@/lib/chatApi";
import { ChatMessage } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SUGGESTED_QUESTIONS = [
  "What is the dental coverage?",
  "How much is the 401k match?",
  "When is open enrollment?",
  "What wellness programs are offered?",
  "How many vacation days do I get?",
  "Is vision coverage included?",
  "How do I submit a claim?"
];

// Categorize questions for better organization
const QUESTION_CATEGORIES = {
  health: ["What is covered in the health plan?", "Are prescriptions included?", "How do I find in-network doctors?"],
  dental: ["What is the dental coverage?", "Is orthodontia covered?", "What's the annual dental maximum?"],
  retirement: ["How much is the 401k match?", "When am I vested in my 401k?", "Can I take a 401k loan?"],
  timeOff: ["How many vacation days do I get?", "What's the sick leave policy?", "How do I request time off?"]
};

export default function ChatbotTab() {
  const [message, setMessage] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [showContextInfo, setShowContextInfo] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get chat history
  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/chat'],
    queryFn: getChatMessages
  });
  
  // Send message mutation
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
  
  // Track context of the conversation based on messages
  useEffect(() => {
    if (messages && messages.length > 0) {
      // Look at last few messages to determine the current topic
      const recentUserMessages = messages
        .filter(msg => msg.role === 'user')
        .slice(-3)
        .map(msg => msg.content.toLowerCase());
      
      if (recentUserMessages.some(msg => 
        msg.includes('health') || msg.includes('medical') || msg.includes('doctor')
      )) {
        setActiveTopic('health');
      } else if (recentUserMessages.some(msg => 
        msg.includes('dental') || msg.includes('teeth') || msg.includes('dentist')
      )) {
        setActiveTopic('dental');
      } else if (recentUserMessages.some(msg => 
        msg.includes('401k') || msg.includes('retire') || msg.includes('pension')
      )) {
        setActiveTopic('retirement');
      } else if (recentUserMessages.some(msg => 
        msg.includes('vacation') || msg.includes('pto') || msg.includes('time off') || msg.includes('leave')
      )) {
        setActiveTopic('timeOff');
      } else if (messages.length > 3) {
        // Keep topic if we're in a conversation thread
        // If no clear topic is detected, we keep the current one
      } else {
        setActiveTopic(null);
      }
    }
  }, [messages]);
  
  // Format the timestamp for display
  const formatTimestamp = (timestamp: Date | string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <header className="mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-1">Benefits Document Assistant</h2>
                <p className="text-slate-600">Ask questions about your employee benefits documents.</p>
              </div>
              {activeTopic && (
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30 px-3 py-1 text-xs">
                  <span className="mr-1">Current topic:</span> 
                  {activeTopic === 'health' && 'Health Insurance'}
                  {activeTopic === 'dental' && 'Dental Coverage'}
                  {activeTopic === 'retirement' && 'Retirement Plans'}
                  {activeTopic === 'timeOff' && 'Time Off & Leave'}
                </Badge>
              )}
            </div>
          </header>
          
          <Card>
            <CardContent className="p-0">
              <div className="bg-slate-50 rounded-lg h-[500px] flex flex-col">
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
                              Hello! I'm your benefits assistant. I analyze your uploaded benefits documents to answer your questions. I can remember our conversation context to provide more relevant answers. How can I help you today?
                            </p>
                            <div className="flex items-center mt-2 text-xs text-slate-500">
                              <FileText className="h-3 w-3 mr-1" />
                              <span>Context-aware document analysis</span>
                            </div>
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
                            <div className="mt-1 flex justify-end">
                              <span className="text-[10px] text-slate-400">
                                {msg.timestamp && formatTimestamp(msg.timestamp)}
                              </span>
                            </div>
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
                
                <form onSubmit={handleSubmit} className="border-t border-slate-200 p-3 bg-white rounded-b-lg flex items-center">
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
                
                {/* Context awareness indicator */}
                <div className="px-3 py-2 bg-white border-t border-slate-100 rounded-b-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-slate-500">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400"
                              onClick={() => setShowContextInfo(!showContextInfo)}>
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View context information</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span>Context-aware assistance</span>
                    </div>
                    <div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-xs flex items-center text-slate-500 hover:text-primary"
                        onClick={() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/chat'] });
                          setActiveTopic(null);
                          toast({
                            title: "Conversation refreshed",
                            description: "Starting a new conversation context",
                          });
                        }}
                      >
                        <RefreshCcw className="h-3 w-3 mr-1" />
                        New conversation
                      </Button>
                    </div>
                  </div>
                  
                  {/* Context information panel */}
                  {showContextInfo && (
                    <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600 border border-slate-200">
                      <h4 className="font-medium mb-1">Current Context</h4>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {activeTopic ? (
                          <Badge variant="outline" className="text-[10px] py-0">
                            {activeTopic === 'health' && 'Health Insurance'}
                            {activeTopic === 'dental' && 'Dental Coverage'}
                            {activeTopic === 'retirement' && 'Retirement Plans'}
                            {activeTopic === 'timeOff' && 'Time Off & Leave'}
                          </Badge>
                        ) : (
                          <span className="italic">No active topic</span>
                        )}
                      </div>
                      <p className="text-[10px]">The assistant analyzes document content and maintains conversation context to provide more relevant answers based on previous questions.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Suggested questions sidebar */}
        <div className="md:col-span-1">
          <h3 className="text-sm font-medium mb-2">Suggested questions</h3>
          <div className="space-y-2">
            {activeTopic ? (
              // Show topic-specific questions when a topic is active
              <>
                <p className="text-xs text-slate-500 mb-2">Based on your conversation:</p>
                {activeTopic && QUESTION_CATEGORIES[activeTopic as keyof typeof QUESTION_CATEGORIES].map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs w-full justify-start font-normal hover:bg-primary/10 hover:text-primary"
                    onClick={() => handleSuggestedQuestion(question)}
                    disabled={sendMutation.isPending}
                  >
                    {question}
                  </Button>
                ))}
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs w-full justify-start font-normal text-slate-500"
                    onClick={() => setActiveTopic(null)}
                  >
                    Show all topics
                  </Button>
                </div>
              </>
            ) : (
              // Show general questions when no topic is active
              SUGGESTED_QUESTIONS.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs w-full justify-start font-normal hover:bg-primary/10 hover:text-primary"
                  onClick={() => handleSuggestedQuestion(question)}
                  disabled={sendMutation.isPending}
                >
                  {question}
                </Button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
