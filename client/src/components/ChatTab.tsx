import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SendIcon } from "lucide-react";

export default function ChatTab() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "system",
      content: "Hello! I'm your benefits assistant. How can I help you today?"
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const newChatHistory = [
      ...chatHistory,
      { role: "user", content: message }
    ];
    
    setChatHistory(newChatHistory);
    setMessage("");
    
    // Simulate AI response
    setTimeout(() => {
      setChatHistory([
        ...newChatHistory,
        { 
          role: "system", 
          content: "I'm a placeholder response. In the full implementation, I would answer your benefits questions based on your company's documents."
        }
      ]);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle>Benefits Assistant</CardTitle>
          <CardDescription>Ask questions about your employee benefits</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Chat messages container */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {chatHistory.map((chat, index) => (
              <div 
                key={index} 
                className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex ${chat.role === "user" ? "flex-row-reverse" : "flex-row"} gap-2 max-w-[80%]`}>
                  <Avatar className={`h-8 w-8 ${chat.role === "user" ? "bg-primary" : "bg-secondary"}`}>
                    <AvatarFallback>{chat.role === "user" ? "U" : "AI"}</AvatarFallback>
                  </Avatar>
                  <div 
                    className={`
                      rounded-lg p-3 
                      ${chat.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"}
                    `}
                  >
                    {chat.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Input field */}
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question about your benefits..."
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              onClick={handleSendMessage}
              className="px-3"
              disabled={!message.trim()}
            >
              <SendIcon className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}