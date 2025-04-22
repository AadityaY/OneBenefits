import { 
  Document, InsertDocument, 
  SurveyResponse, InsertSurveyResponse,
  ChatMessage, InsertChatMessage,
  CalendarEvent, InsertCalendarEvent,
  User, InsertUser 
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  createDocument(document: InsertDocument): Promise<Document>;
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Survey methods
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  getSurveyResponses(): Promise<SurveyResponse[]>;
  
  // Chat methods
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(): Promise<ChatMessage[]>;
  
  // Calendar events methods
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  getCalendarEvents(): Promise<CalendarEvent[]>;
  updateCalendarEvent(id: number, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private surveyResponses: Map<number, SurveyResponse>;
  private chatMessages: Map<number, ChatMessage>;
  private calendarEvents: Map<number, CalendarEvent>;
  
  private userId: number;
  private documentId: number;
  private surveyResponseId: number;
  private chatMessageId: number;
  private calendarEventId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.surveyResponses = new Map();
    this.chatMessages = new Map();
    this.calendarEvents = new Map();
    
    this.userId = 1;
    this.documentId = 1;
    this.surveyResponseId = 1;
    this.chatMessageId = 1;
    this.calendarEventId = 1;
    
    // Add some sample calendar events
    this.initializeCalendarEvents();
  }
  
  private initializeCalendarEvents() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const events: InsertCalendarEvent[] = [
      {
        title: "Benefits Intro Email",
        description: "Introduction to employee benefits program",
        eventDate: new Date(currentYear, currentMonth, 2),
        eventType: "email",
        color: "blue",
      },
      {
        title: "Health Plan Survey",
        description: "Survey about health insurance plans",
        eventDate: new Date(currentYear, currentMonth, 5),
        eventType: "survey",
        color: "green",
      },
      {
        title: "Benefits Webinar",
        description: "Live webinar about employee benefits",
        eventDate: new Date(currentYear, currentMonth, 10),
        eventType: "meeting",
        color: "purple",
      },
      {
        title: "401k Info Email",
        description: "Information about retirement plans",
        eventDate: new Date(currentYear, currentMonth, 12),
        eventType: "email",
        color: "blue",
      },
      {
        title: "Open Enrollment Begins",
        description: "Start of open enrollment period",
        eventDate: new Date(currentYear, currentMonth, 15),
        eventType: "deadline",
        color: "amber",
      },
      {
        title: "Enrollment Reminder",
        description: "Reminder about open enrollment deadline",
        eventDate: new Date(currentYear, currentMonth, 16),
        eventType: "email",
        color: "blue",
      },
      {
        title: "Benefits Feedback Survey",
        description: "Survey about benefits experience",
        eventDate: new Date(currentYear, currentMonth, 18),
        eventType: "survey",
        color: "green",
      },
      {
        title: "Plan Comparison Email",
        description: "Comparison of different benefit plans",
        eventDate: new Date(currentYear, currentMonth, 20),
        eventType: "email",
        color: "blue",
      },
      {
        title: "Q&A Session",
        description: "Live Q&A about benefits",
        eventDate: new Date(currentYear, currentMonth, 23),
        eventType: "meeting",
        color: "purple",
      },
      {
        title: "Deadline Reminder",
        description: "Final reminder about enrollment deadline",
        eventDate: new Date(currentYear, currentMonth, 25),
        eventType: "email",
        color: "blue",
      },
      {
        title: "Open Enrollment Ends",
        description: "End of open enrollment period",
        eventDate: new Date(currentYear, currentMonth, 30),
        eventType: "deadline",
        color: "amber",
      },
      {
        title: "Confirmation Email",
        description: "Confirmation of benefit selections",
        eventDate: new Date(currentYear, currentMonth, 31),
        eventType: "email",
        color: "blue",
      }
    ];
    
    events.forEach(event => this.createCalendarEvent(event));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Document methods
  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.documentId++;
    const uploadedAt = new Date();
    const newDocument: Document = { ...document, id, uploadedAt };
    this.documents.set(id, newDocument);
    return newDocument;
  }
  
  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }
  
  // Survey methods
  async createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
    const id = this.surveyResponseId++;
    const submittedAt = new Date();
    const newResponse: SurveyResponse = { ...response, id, submittedAt };
    this.surveyResponses.set(id, newResponse);
    return newResponse;
  }
  
  async getSurveyResponses(): Promise<SurveyResponse[]> {
    return Array.from(this.surveyResponses.values());
  }
  
  // Chat methods
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageId++;
    const timestamp = new Date();
    const newMessage: ChatMessage = { ...message, id, timestamp };
    this.chatMessages.set(id, newMessage);
    return newMessage;
  }
  
  async getChatMessages(): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .sort((a, b) => a.id - b.id);  // Sort by id to maintain chronological order
  }
  
  // Calendar events methods
  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = this.calendarEventId++;
    const newEvent: CalendarEvent = { ...event, id };
    this.calendarEvents.set(id, newEvent);
    return newEvent;
  }
  
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values());
  }
  
  async updateCalendarEvent(id: number, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const existingEvent = this.calendarEvents.get(id);
    if (!existingEvent) return undefined;
    
    const updatedEvent = { ...existingEvent, ...event };
    this.calendarEvents.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteCalendarEvent(id: number): Promise<boolean> {
    return this.calendarEvents.delete(id);
  }
}

export const storage = new MemStorage();
