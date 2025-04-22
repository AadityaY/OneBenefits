import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-mock-api-key" });

interface ChatResponse {
  role: string;
  content: string;
}

export async function processDocumentContent(content: string): Promise<string> {
  try {
    // If no API key is available, return a simulated processed content
    if (!process.env.OPENAI_API_KEY) {
      return `Processed document content:\n${content.substring(0, 100)}...\n(Document processing simulated due to missing API key)`;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a document processor that extracts and summarizes the key information from employee benefits documents."
        },
        {
          role: "user",
          content: `Extract and summarize the key benefit information from this document: ${content}`
        }
      ],
      max_tokens: 2000,
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error processing document content:", error);
    return `Error processing document: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

export async function chatWithDocuments(documents: { content: string }[], userMessage: string): Promise<ChatResponse> {
  try {
    // If no API key is available, return a simulated response
    if (!process.env.OPENAI_API_KEY) {
      return {
        role: "assistant",
        content: `I'm reviewing your benefits documents to answer: "${userMessage}"\n\nBased on the documents you've uploaded, here's what I found:\n\n(This is a simulated response as no API key is available for OpenAI integration)`
      };
    }
    
    // Combine document contents with a limit to stay within token constraints
    const combinedContent = documents
      .map(doc => doc.content || "")
      .join("\n\n")
      .substring(0, 10000); // Limit to avoid token limits
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful benefits assistant. Answer questions about employee benefits based on the provided document content. If the answer cannot be found in the documents, politely state that the information is not available and suggest what the user might do next."
        },
        {
          role: "user",
          content: `Documents content: ${combinedContent}\n\nQuestion: ${userMessage}`
        }
      ],
      max_tokens: 1000,
    });
    
    return {
      role: "assistant",
      content: response.choices[0].message.content
    };
  } catch (error) {
    console.error("Error in chat with documents:", error);
    return {
      role: "assistant",
      content: `I'm sorry, I encountered an error while processing your question: ${error instanceof Error ? error.message : "Unknown error"}. Please try again or contact support if the issue persists.`
    };
  }
}
