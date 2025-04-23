import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Loader2, 
  ArrowUpFromLine, 
  Bot, 
  Search, 
  AlertCircle,
  RefreshCw,
  MessageCircle,
  User as UserIcon,
  FileText
} from "lucide-react";
import { ChatMessage } from "@shared/schema";

const AI_AVATAR_URL = "https://ui-avatars.com/api/?name=AI&background=6c5ce7&color=fff";
const USER_AVATAR_URL = "https://ui-avatars.com/api/?name=You&background=0984e3&color=fff";

export default function ChatTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Get company ID from user
  const companyId = user?.companyId;
  
  // Fetch chat messages
  const { 
    data: messages, 
    isLoading: loadingMessages, 
    isError: messagesError
  } = useQuery<ChatMessage[]>({ 
    queryKey: ["/api/chat", companyId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!companyId,
  });
  
  // Create new chat message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      setIsTyping(true);
      const res = await apiRequest(
        "POST", 
        "/api/chat", 
        { content }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      setMessageText("");
      setIsTyping(false);
    },
    onError: (error: Error) => {
      setIsTyping(false);
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle sending a new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;
    
    sendMessageMutation.mutate(messageText);
  };
  
  // Scroll to bottom of messages when new ones arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);
  
  // Render loading state
  if (loadingMessages) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading chat history...</span>
      </div>
    );
  }
  
  // Render error state
  if (messagesError) {
    return (
      <div className="py-12 text-center space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
        <h3 className="text-xl font-semibold">Failed to load chat history</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          There was an error loading your chat history. Please try again later.
        </p>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/chat"] })}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList className="bg-background/50 backdrop-blur-sm border-gradient p-1">
            <TabsTrigger value="chat" className="hover-lift">
              <MessageCircle className="h-4 w-4 mr-2" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="documents" className="hover-lift">
              <FileText className="h-4 w-4 mr-2" />
              Document Search
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="chat" className="space-y-4">
          <Card className="w-full max-w-4xl mx-auto overflow-hidden frost-glass shadow-lg">
            <CardHeader className="border-b bg-background/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 animated-gradient-bg">
                  <AvatarFallback>AI</AvatarFallback>
                  <AvatarImage src={AI_AVATAR_URL} />
                </Avatar>
                <div>
                  <CardTitle className="text-base gradient-heading">Benefits Assistant</CardTitle>
                  <CardDescription className="text-xs">
                    Ask me questions about company benefits and policies
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <ScrollArea className="h-[500px] p-4">
              <div className="space-y-4 pb-4">
                {/* Welcome message */}
                {(!messages || messages.length === 0) && (
                  <div className="flex items-start gap-3 text-center w-full pt-8">
                    <div className="mx-auto max-w-sm rounded-lg bg-primary/5 p-6">
                      <Bot className="mx-auto h-12 w-12 text-primary mb-4" />
                      <h3 className="font-semibold text-lg mb-2 gradient-heading">
                        Benefits AI Assistant
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        I can answer questions about your employee benefits, company policies, and more. How can I help you today?
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <Button 
                          variant="outline" 
                          className="justify-start text-left h-auto py-2 px-3"
                          onClick={() => setMessageText("What health insurance plans are available?")}
                        >
                          <span className="truncate">What health insurance plans are available?</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start text-left h-auto py-2 px-3"
                          onClick={() => setMessageText("How many vacation days do I have?")}
                        >
                          <span className="truncate">How many vacation days do I have?</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start text-left h-auto py-2 px-3"
                          onClick={() => setMessageText("What's the parental leave policy?")}
                        >
                          <span className="truncate">What's the parental leave policy?</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start text-left h-auto py-2 px-3"
                          onClick={() => setMessageText("Tell me about our 401(k) matching")}
                        >
                          <span className="truncate">Tell me about our 401(k) matching</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Messages */}
                {messages && messages.map((message, index) => (
                  <div 
                    key={message.id || index} 
                    className={`flex items-start gap-3 ${
                      message.role === "assistant" ? "" : "flex-row-reverse"
                    }`}
                  >
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback>
                        {message.role === "assistant" ? "AI" : "You"}
                      </AvatarFallback>
                      <AvatarImage 
                        src={message.role === "assistant" ? AI_AVATAR_URL : USER_AVATAR_URL} 
                      />
                    </Avatar>
                    <div 
                      className={`rounded-lg px-4 py-3 max-w-[80%] ${
                        message.role === "assistant" 
                          ? "bg-muted/50" 
                          : "bg-primary/10"
                      }`}
                    >
                      <div className="whitespace-pre-line text-sm">
                        {message.content}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* AI is typing indicator */}
                {isTyping && (
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback>AI</AvatarFallback>
                      <AvatarImage src={AI_AVATAR_URL} />
                    </Avatar>
                    <div className="rounded-lg px-4 py-3 bg-muted/50">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-foreground/50 animate-bounce"></div>
                        <div className="h-2 w-2 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="h-2 w-2 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <CardFooter className="border-t p-3">
              <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                <Input
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={isTyping}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!messageText.trim() || isTyping}
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          <Card className="w-full max-w-4xl mx-auto overflow-hidden frost-glass shadow-lg">
            <CardHeader className="border-b bg-background/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full flex items-center justify-center animated-gradient-bg">
                  <Search className="h-4 w-4 text-background" />
                </div>
                <div>
                  <CardTitle className="text-base gradient-heading">Benefits Document Search</CardTitle>
                  <CardDescription className="text-xs">
                    Search through company benefits documents and policies
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    className="pl-9 focus-within:border-gradient"
                  />
                </div>
                
                <div className="pt-4 space-y-4">
                  <h3 className="text-sm font-semibold gradient-heading">Popular Documents</h3>
                  
                  <div className="grid gap-3">
                    {[
                      { 
                        title: "Employee Benefits Overview",
                        description: "Comprehensive guide to all employee benefits",
                        type: "PDF",
                        date: "Updated Jan 2023"
                      },
                      { 
                        title: "Health Insurance Plans",
                        description: "Details on health, dental and vision plans",
                        type: "PDF",
                        date: "Updated Mar 2023"
                      },
                      { 
                        title: "401(k) Retirement Plan",
                        description: "Information about our 401(k) plan and matching",
                        type: "PDF",
                        date: "Updated Feb 2023"
                      },
                      { 
                        title: "Parental Leave Policy",
                        description: "Details on maternal and paternal leave benefits",
                        type: "DOCX",
                        date: "Updated Dec 2022"
                      },
                    ].map((doc, i) => (
                      <div key={i} className="flex items-start border rounded-md p-3 hover-lift frost-glass-light shadow-sm transition-all">
                        <div className="mr-3">
                          <div className="h-10 w-10 rounded animated-gradient-bg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-background" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium">{doc.title}</h4>
                            <Badge variant="secondary" className="ml-2 shrink-0">
                              {doc.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {doc.description}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            {doc.date}
                            <Button variant="outline" size="sm" className="ml-auto h-7 text-xs hover-lift">
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}