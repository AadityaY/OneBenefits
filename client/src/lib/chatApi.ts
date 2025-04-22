import { apiRequest } from "@/lib/queryClient";
import { InsertChatMessage, ChatMessage } from "@shared/schema";

export async function getChatMessages(): Promise<ChatMessage[]> {
  const response = await fetch('/api/chat', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

export async function sendChatMessage(content: string): Promise<ChatMessage[]> {
  const message: InsertChatMessage = {
    role: 'user',
    content,
  };
  
  const response = await apiRequest('POST', '/api/chat', message);
  return response.json();
}
