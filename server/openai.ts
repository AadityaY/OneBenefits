// Document chat system with context awareness (simulated without OpenAI)

interface ChatResponse {
  role: string;
  content: string;
}

interface DocumentIndex {
  docId: number;
  content: string;
  keywords: Map<string, number[]>; // keyword -> positions in document
  sentences: string[];
}

// In-memory storage for document indices and conversation history
const documentIndices: DocumentIndex[] = [];
const conversationHistory: { role: string; content: string }[] = [];

/**
 * Process and index document content for more efficient retrieval
 */
export async function processDocumentContent(content: string, docId?: number): Promise<string> {
  try {
    // Extract sentences (basic splitting by periods, question marks, and exclamation points)
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Create a keyword index
    const keywords = new Map<string, number[]>();
    const words = content.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    
    words.forEach((word, index) => {
      if (!keywords.has(word)) {
        keywords.set(word, []);
      }
      keywords.get(word)?.push(index);
    });
    
    // Add to our document indices
    const docIndex: DocumentIndex = {
      docId: docId || documentIndices.length + 1,
      content,
      keywords,
      sentences
    };
    
    // Check if we're updating an existing index or adding a new one
    const existingIndex = documentIndices.findIndex(d => d.docId === docIndex.docId);
    if (existingIndex >= 0) {
      documentIndices[existingIndex] = docIndex;
    } else {
      documentIndices.push(docIndex);
    }
    
    // Generate a summary for the document (simulated)
    const summary = `
# Document Summary
${sentences.length > 0 ? `## Introduction\n${sentences[0]}` : ''}

## Key Points
${sentences.slice(1, Math.min(5, sentences.length)).map(s => `• ${s}`).join('\n')}

## Content Overview
This document contains information about employee benefits${keywordSummary(keywords)}.
It has ${sentences.length} sections and covers approximately ${Math.round(content.length / 100)} topics.
    `;
    
    return summary;
  } catch (error) {
    console.error("Error processing document content:", error);
    return `Error processing document: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

/**
 * Generate a small summary of important keywords in the document
 */
function keywordSummary(keywords: Map<string, number[]>): string {
  const commonBenefitsTerms = [
    'health', 'dental', 'vision', 'insurance', 'medical', 'retirement', '401k',
    'pto', 'vacation', 'leave', 'sick', 'disability', 'fsa', 'hsa',
    'wellness', 'life', 'reimbursement', 'tuition', 'bonus', 'pension'
  ];
  
  const foundTerms = commonBenefitsTerms.filter(term => 
    keywords.has(term) && keywords.get(term)!.length > 0
  ).slice(0, 5);
  
  if (foundTerms.length > 0) {
    return `, including ${foundTerms.join(', ')}`;
  }
  return '';
}

/**
 * Chat with documents with context awareness
 */
export async function chatWithDocuments(documents: { content: string }[], userMessage: string): Promise<ChatResponse> {
  try {
    // Add user message to conversation history
    conversationHistory.push({ role: 'user', content: userMessage });
    
    // Process documents if not already indexed
    if (documentIndices.length === 0 && documents.length > 0) {
      for (let i = 0; i < documents.length; i++) {
        await processDocumentContent(documents[i].content || '', i + 1);
      }
    }
    
    // Find relevant context from documents based on query
    const relevantContext = findRelevantContext(userMessage, conversationHistory);
    
    // Generate response
    const response = generateResponse(userMessage, relevantContext, conversationHistory);
    
    // Add assistant response to conversation history
    conversationHistory.push({ role: 'assistant', content: response });
    
    // Keep conversation history to a reasonable size (last 10 messages)
    if (conversationHistory.length > 10) {
      conversationHistory.splice(0, conversationHistory.length - 10);
    }
    
    return {
      role: "assistant",
      content: response
    };
  } catch (error) {
    console.error("Error in chat with documents:", error);
    return {
      role: "assistant",
      content: `I'm sorry, I encountered an error while processing your question: ${error instanceof Error ? error.message : "Unknown error"}. Please try again or contact support if the issue persists.`
    };
  }
}

/**
 * Find the most relevant context from documents based on user query and conversation history
 */
function findRelevantContext(query: string, history: { role: string; content: string }[]): string[] {
  // No documents indexed
  if (documentIndices.length === 0) {
    return ["No documents have been uploaded or indexed yet."];
  }
  
  // Extract keywords from query
  const queryWords = query.toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 2)
    .filter(w => !['what', 'when', 'where', 'which', 'who', 'how', 'does', 'is', 'are', 'the', 'and', 'for', 'that'].includes(w));
    
  // For context awareness, also consider keywords from the last assistant and user message
  const recentMessages = history.slice(-4);
  const historyKeywords = recentMessages
    .flatMap(msg => msg.content.toLowerCase().split(/\W+/))
    .filter(w => w.length > 2)
    .filter(w => !['what', 'when', 'where', 'which', 'who', 'how', 'does', 'is', 'are', 'the', 'and', 'for', 'that'].includes(w));
  
  const allKeywords = Array.from(new Set([...queryWords, ...historyKeywords]));
  
  // Collect relevant sentences from all documents
  const relevantSentences: string[] = [];
  
  documentIndices.forEach(docIndex => {
    // Find sentences containing query keywords
    docIndex.sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase();
      // Check if this sentence contains any of our keywords
      if (allKeywords.some(keyword => sentenceLower.includes(keyword))) {
        relevantSentences.push(sentence);
      }
    });
  });
  
  // If no relevant sentences found, return first few sentences from documents as context
  if (relevantSentences.length === 0) {
    return documentIndices.flatMap(doc => doc.sentences.slice(0, 3));
  }
  
  // Return most relevant sentences (limit to reasonable number)
  return relevantSentences.slice(0, 10);
}

/**
 * Generate a response based on user query, relevant context, and conversation history
 */
function generateResponse(query: string, relevantContext: string[], history: { role: string; content: string }[]): string {
  // If no relevant context was found
  if (relevantContext.length === 0 || relevantContext[0].includes("No documents")) {
    return `I don't have enough information to answer your question about "${query}". Please upload benefits documents so I can provide more helpful responses.`;
  }
  
  // Check for common benefits-related terms
  const queryLower = query.toLowerCase();
  
  // Extract the last user and assistant message for context
  const lastUserMsg = history.filter(m => m.role === 'user').slice(-2)[0]?.content || '';
  const lastAssistantMsg = history.filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';
  
  // Handle follow-up questions
  if (queryLower.includes('what about') || queryLower.includes('how about') || 
      queryLower.includes('and what') || queryLower.includes('what else') || 
      queryLower.startsWith('and') || queryLower.startsWith('how') || queryLower.startsWith('why')) {
    
    // This is likely a follow-up question, let's acknowledge that
    return `Regarding your follow-up about ${query.replace(/^(and|what about|how about)/i, '')}, here's what I found:\n\n${relevantContext.join(' ')}`;
  }
  
  // Health insurance related
  if (queryLower.includes('health') || queryLower.includes('medical') || queryLower.includes('insurance')) {
    return `Based on the benefits information I have, here's what I found about health insurance:\n\n${relevantContext.join('\n\n')}\n\nIs there anything specific about health benefits you'd like to know more about?`;
  }
  
  // Dental coverage
  if (queryLower.includes('dental')) {
    return `Here's what the benefits documents say about dental coverage:\n\n${relevantContext.join('\n\n')}\n\nLet me know if you have questions about specific dental procedures or coverage limits.`;
  }
  
  // Vision coverage
  if (queryLower.includes('vision') || queryLower.includes('eye') || queryLower.includes('glasses')) {
    return `Regarding vision benefits, here's what I found:\n\n${relevantContext.join('\n\n')}\n\nThis should help you understand what's covered for eye exams, glasses, and contacts.`;
  }
  
  // Retirement/401k
  if (queryLower.includes('401k') || queryLower.includes('401') || queryLower.includes('retirement') || queryLower.includes('pension')) {
    return `Here's what I found about retirement plans and 401(k):\n\n${relevantContext.join('\n\n')}\n\nWould you like me to explain more about contribution limits or matching?`;
  }
  
  // PTO/vacation
  if (queryLower.includes('pto') || queryLower.includes('vacation') || queryLower.includes('time off') || queryLower.includes('leave')) {
    return `Regarding paid time off (PTO) and vacation benefits:\n\n${relevantContext.join('\n\n')}\n\nLet me know if you have questions about accrual rates or requesting time off.`;
  }
  
  // Default response with relevant information
  return `Based on our benefits documentation, here's what I found related to your question about "${query}":\n\n${relevantContext.join('\n\n')}\n\nIs there anything specific you'd like me to clarify?`;
}
