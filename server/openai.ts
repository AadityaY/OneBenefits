import OpenAI from 'openai';

interface ChatResponse {
  role: string;
  content: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

// Company-specific conversation histories
interface ConversationState {
  companyId: number;
  userId: number;
  history: { role: string; content: string }[];
}

// Store conversation history by company and user
const conversationStates = new Map<string, ConversationState>();

// Get or create conversation state
function getConversationState(companyId: number, userId: number): ConversationState {
  const key = `${companyId}-${userId}`;
  if (!conversationStates.has(key)) {
    conversationStates.set(key, {
      companyId,
      userId,
      history: []
    });
  }
  return conversationStates.get(key)!;
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
 * Chat with documents using OpenAI and document context
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
    // Get the conversation state for this company and user
    const conversationState = getConversationState(companyId, userId);
    
    // Add user message to conversation history
    conversationState.history.push({ role: 'user', content: userMessage });
    
    // Extract relevant content from documents to use as context
    let documentContext = "";
    if (documents.length > 0) {
      // Combine document contents, limiting the total size
      documentContext = documents
        .map(doc => doc.content)
        .filter(content => content) // Filter out null or undefined
        .join("\n\n")
        .substring(0, 15000); // Limit context size
    }

    // Prepare system message with the document context
    const systemMessage = `
You are ${assistantName}, a helpful benefits assistant for ${companyName}. Your goal is to help employees understand their benefits.
Be clear, conversational, and empathetic. If you don't know the answer to a question, don't make up information.
Use only the following document context to answer questions:

${documentContext || "No benefits documents are currently available."}

If the information needed to answer the question is not in the context, politely explain that you don't have that specific information.
Keep your answers concise but thorough. Focus on facts from the documents rather than general advice.
`;

    // Prepare messages for OpenAI API
    const messages = [
      { role: 'system', content: systemMessage },
      // Include last few messages for context (limit to avoid token issues)
      ...conversationState.history.slice(-5)
    ];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: messages as any, // Type assertion to satisfy TypeScript
      max_tokens: 1000,
      temperature: 0.7,
    });

    const assistantResponse = response.choices[0].message.content || 
      "I'm sorry, I couldn't generate a response. Please try asking in a different way.";
    
    // Add assistant response to conversation history
    conversationState.history.push({ role: 'assistant', content: assistantResponse });
    
    // Keep conversation history to a reasonable size (last 10 messages)
    if (conversationState.history.length > 10) {
      conversationState.history = conversationState.history.slice(-10);
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
