import { 
  Document, InsertDocument, 
  SurveyResponse, InsertSurveyResponse,
  ChatMessage, InsertChatMessage,
  CalendarEvent, InsertCalendarEvent,
  User, InsertUser,
  SurveyTemplate, InsertSurveyTemplate,
  SurveyQuestion, InsertSurveyQuestion
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
  
  // Survey Template methods
  createSurveyTemplate(template: InsertSurveyTemplate): Promise<SurveyTemplate>;
  getSurveyTemplates(): Promise<SurveyTemplate[]>;
  getSurveyTemplate(id: number): Promise<SurveyTemplate | undefined>;
  updateSurveyTemplate(id: number, template: Partial<InsertSurveyTemplate>): Promise<SurveyTemplate | undefined>;
  deleteSurveyTemplate(id: number): Promise<boolean>;
  publishSurveyTemplate(id: number): Promise<SurveyTemplate | undefined>;
  
  // Survey Question methods
  createSurveyQuestion(question: InsertSurveyQuestion): Promise<SurveyQuestion>;
  getSurveyQuestions(): Promise<SurveyQuestion[]>;
  getSurveyQuestionsByTemplateId(templateId: number): Promise<SurveyQuestion[]>;
  getSurveyQuestion(id: number): Promise<SurveyQuestion | undefined>;
  updateSurveyQuestion(id: number, question: Partial<InsertSurveyQuestion>): Promise<SurveyQuestion | undefined>;
  deleteSurveyQuestion(id: number): Promise<boolean>;
  
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
  private surveyTemplates: Map<number, SurveyTemplate>;
  private surveyQuestions: Map<number, SurveyQuestion>;
  private chatMessages: Map<number, ChatMessage>;
  private calendarEvents: Map<number, CalendarEvent>;
  
  private userId: number;
  private documentId: number;
  private surveyResponseId: number;
  private surveyTemplateId: number;
  private surveyQuestionId: number;
  private chatMessageId: number;
  private calendarEventId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.surveyResponses = new Map();
    this.surveyTemplates = new Map();
    this.surveyQuestions = new Map();
    this.chatMessages = new Map();
    this.calendarEvents = new Map();
    
    this.userId = 1;
    this.documentId = 1;
    this.surveyResponseId = 1;
    this.surveyTemplateId = 1;
    this.surveyQuestionId = 1;
    this.chatMessageId = 1;
    this.calendarEventId = 1;
    
    // Initialize default users
    this.initializeUsers();
    // Add some sample calendar events
    this.initializeCalendarEvents();
    // Initialize a sample survey template and questions
    this.initializeSurveyTemplate();
  }
  
  private initializeUsers() {
    // Admin user
    this.createUser({
      username: "admin",
      password: "password.salt", // This will be replaced with proper hashed password in auth.ts
      role: "admin"
    });
    
    // Regular user
    this.createUser({
      username: "user",
      password: "password.salt", // This will be replaced with proper hashed password in auth.ts
      role: "user"
    });
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
    
    // Create response object with the flexible responses structure
    const newResponse: SurveyResponse = { 
      id, 
      templateId: response.templateId,
      responses: response.responses,
      submittedAt 
    };
    
    this.surveyResponses.set(id, newResponse);
    return newResponse;
  }
  
  async getSurveyResponses(): Promise<SurveyResponse[]> {
    return Array.from(this.surveyResponses.values());
  }
  
  async getSurveyResponsesByTemplateId(templateId: number): Promise<SurveyResponse[]> {
    return Array.from(this.surveyResponses.values())
      .filter(response => response.templateId === templateId);
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
  
  // Initialize a sample survey template with questions
  private initializeSurveyTemplate() {
    const benefitsSurveyTemplate: InsertSurveyTemplate = {
      title: "Employee Benefits Survey",
      description: "Help us understand your preferences and needs regarding the employee benefits program.",
      status: "draft"
    };
    
    this.createSurveyTemplate(benefitsSurveyTemplate)
      .then(template => {
        // Create questions for the template
        const questions: InsertSurveyQuestion[] = [
          {
            templateId: template.id,
            questionText: "How satisfied are you with the current health insurance options?",
            questionType: "radio",
            required: true,
            order: 1,
            options: ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"],
            active: true
          },
          {
            templateId: template.id,
            questionText: "Which of the following benefits are most important to you? (Select up to 3)",
            questionType: "checkbox",
            required: true,
            order: 2,
            options: ["Health insurance", "Dental insurance", "Vision insurance", "Retirement plan (401k/403b)", "Paid time off", "Parental leave", "Wellness programs"],
            active: true
          },
          {
            templateId: template.id,
            questionText: "How well do you understand your current benefits package?",
            questionType: "select",
            required: true,
            order: 3,
            options: ["Very well - I understand all aspects", "Somewhat - I understand the basics", "Neutral", "Not much - I'm confused about many aspects", "Not at all - I don't understand my benefits"],
            active: true
          },
          {
            templateId: template.id,
            questionText: "Do you have any suggestions for improving our benefits program?",
            questionType: "textarea",
            required: false,
            order: 4,
            options: [],
            active: true
          },
          {
            templateId: template.id,
            questionText: "Would you be interested in attending a benefits information session?",
            questionType: "radio",
            required: true,
            order: 5,
            options: ["Yes", "No", "Maybe"],
            active: true
          }
        ];
        
        // Add each question to the database
        questions.forEach(question => this.createSurveyQuestion(question));
      });
  }
  
  // Survey Template methods
  async createSurveyTemplate(template: InsertSurveyTemplate): Promise<SurveyTemplate> {
    const id = this.surveyTemplateId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const newTemplate: SurveyTemplate = { ...template, id, createdAt, updatedAt, publishedAt: null };
    this.surveyTemplates.set(id, newTemplate);
    return newTemplate;
  }
  
  async getSurveyTemplates(): Promise<SurveyTemplate[]> {
    return Array.from(this.surveyTemplates.values());
  }
  
  async getSurveyTemplate(id: number): Promise<SurveyTemplate | undefined> {
    return this.surveyTemplates.get(id);
  }
  
  async updateSurveyTemplate(id: number, template: Partial<InsertSurveyTemplate>): Promise<SurveyTemplate | undefined> {
    const existingTemplate = this.surveyTemplates.get(id);
    if (!existingTemplate) return undefined;
    
    const updatedAt = new Date();
    const updatedTemplate = { ...existingTemplate, ...template, updatedAt };
    this.surveyTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteSurveyTemplate(id: number): Promise<boolean> {
    return this.surveyTemplates.delete(id);
  }
  
  async publishSurveyTemplate(id: number): Promise<SurveyTemplate | undefined> {
    const existingTemplate = this.surveyTemplates.get(id);
    if (!existingTemplate) return undefined;
    
    const publishedAt = new Date();
    const updatedAt = new Date();
    const publishedTemplate = { ...existingTemplate, status: "published", publishedAt, updatedAt };
    this.surveyTemplates.set(id, publishedTemplate);
    return publishedTemplate;
  }
  
  // Survey Question methods
  async createSurveyQuestion(question: InsertSurveyQuestion): Promise<SurveyQuestion> {
    const id = this.surveyQuestionId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const newQuestion: SurveyQuestion = { ...question, id, createdAt, updatedAt };
    this.surveyQuestions.set(id, newQuestion);
    return newQuestion;
  }
  
  async getSurveyQuestions(): Promise<SurveyQuestion[]> {
    return Array.from(this.surveyQuestions.values())
      .sort((a, b) => a.order - b.order); // Sort by order
  }
  
  async getSurveyQuestionsByTemplateId(templateId: number): Promise<SurveyQuestion[]> {
    return Array.from(this.surveyQuestions.values())
      .filter(question => question.templateId === templateId)
      .sort((a, b) => a.order - b.order); // Sort by order
  }
  
  async getSurveyQuestion(id: number): Promise<SurveyQuestion | undefined> {
    return this.surveyQuestions.get(id);
  }
  
  async updateSurveyQuestion(id: number, question: Partial<InsertSurveyQuestion>): Promise<SurveyQuestion | undefined> {
    const existingQuestion = this.surveyQuestions.get(id);
    if (!existingQuestion) return undefined;
    
    const updatedAt = new Date();
    const updatedQuestion = { ...existingQuestion, ...question, updatedAt };
    this.surveyQuestions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  
  async deleteSurveyQuestion(id: number): Promise<boolean> {
    return this.surveyQuestions.delete(id);
  }
}

export const storage = new MemStorage();
