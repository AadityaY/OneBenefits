import OpenAI from 'openai';

interface ChatResponse {
  role: string;
  content: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Model for fallback completions (used for document processing)
const OPENAI_MODEL = "gpt-4o-mini";

// Store threads by company and user
const threadStore = new Map<string, string>();

// Function to get or create a thread for a user in a company
async function getOrCreateThread(companyId: number, userId: number): Promise<string> {
  const key = `${companyId}-${userId}`;
  
  // Check if we already have a thread ID stored
  if (threadStore.has(key)) {
    return threadStore.get(key)!;
  }
  
  // Create a new thread
  try {
    const thread = await openai.beta.threads.create();
    threadStore.set(key, thread.id);
    console.log(`Created new thread ${thread.id} for company ${companyId}, user ${userId}`);
    return thread.id;
  } catch (error) {
    console.error("Error creating thread:", error);
    throw error;
  }
}

/**
 * Process and index document content using OpenAI
 */
export async function processDocumentContent(content: string, docId?: number): Promise<string> {
  try {
    // Only process if content is not empty
    if (!content || content.trim().length === 0) {
      return `
# Document Summary

## Key Points

## Content Overview
This document contains information about employee benefits.
It has 0 sections and covers approximately 0 topics.
    `;
    }

    const prompt = `
You are an expert benefits document analyzer. Analyze the following document and provide a concise summary of its contents.
Focus on extracting key benefits information that would be relevant to employees.

Document content:
${content.substring(0, 15000)} ${content.length > 15000 ? '... (document truncated due to length)' : ''}

Your summary should include:
1. A document title (if present)
2. Key points (3-5 bullet points)
3. Content overview - what types of benefits are covered in this document
`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
    });

    // Return the summary or a default message if the response was empty
    return response.choices[0].message.content || `
# Document Summary

## Key Points

## Content Overview
This document contains information about employee benefits.
    `;
  } catch (error) {
    console.error("Error processing document with OpenAI:", error);
    return `Error processing document: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Chat with documents using OpenAI Assistant API
 */
export async function chatWithDocuments(
  documents: { content: string }[], 
  userMessage: string,
  companyId: number = 1,
  userId: number = 1,
  companyName: string = "your company",
  assistantName: string = "Benefits Assistant"
): Promise<ChatResponse> {
  try {
    // Check if we have an assistant ID in the environment
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    if (!assistantId) {
      throw new Error("OPENAI_ASSISTANT_ID environment variable is not set");
    }

    // Get or create a thread for this user and company
    const threadId = await getOrCreateThread(companyId, userId);

    // Add the user's message to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: userMessage
    });

    // Create a run with the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId
    });

    // Poll for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    
    // Wait for the assistant to respond (with a timeout)
    const startTime = Date.now();
    const timeout = 30000; // 30 seconds timeout
    
    while (runStatus.status !== "completed" && runStatus.status !== "failed" && Date.now() - startTime < timeout) {
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    if (runStatus.status === "failed") {
      throw new Error(`Assistant run failed: ${runStatus.last_error?.message || "Unknown error"}`);
    }

    if (runStatus.status !== "completed") {
      throw new Error("Assistant response timed out");
    }

    // Get the latest messages from the thread
    const messages = await openai.beta.threads.messages.list(threadId);
    
    // Find the most recent assistant message
    const assistantMessages = messages.data.filter(msg => msg.role === "assistant");
    if (assistantMessages.length === 0) {
      throw new Error("No assistant response found");
    }

    // Get the most recent message
    const latestMessage = assistantMessages[0];
    
    // Extract the text content from the message
    let assistantResponse = "";
    if (latestMessage.content[0].type === "text") {
      assistantResponse = latestMessage.content[0].text.value;
    } else {
      assistantResponse = "I'm sorry, I couldn't generate a response in text format.";
    }
    
    return {
      role: "assistant",
      content: assistantResponse
    };
  } catch (error) {
    console.error("Error in chat with documents:", error);
    return {
      role: "assistant",
      content: `I'm sorry, I encountered an error while processing your question: ${error instanceof Error ? error.message : "Unknown error"}. Please try again or contact support if the issue persists.`
    };
  }
}
