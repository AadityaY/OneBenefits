import { 
  users, type User, type InsertUser,
  documents, type Document, type InsertDocument,
  surveyResponses, type SurveyResponse, type InsertSurveyResponse,
  chatMessages, type ChatMessage, type InsertChatMessage,
  calendarEvents, type CalendarEvent, type InsertCalendarEvent,
  surveyTemplates, type SurveyTemplate, type InsertSurveyTemplate,
  surveyQuestions, type SurveyQuestion, type InsertSurveyQuestion,
  companies, type Company, type InsertCompany,
  companySettings, type CompanySettings, type InsertCompanySettings
} from "@shared/schema";

import { db } from "./db";
import { eq, and, isNull } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByCompany(companyId: number): Promise<User[]>;
  
  // Document methods
  createDocument(document: InsertDocument): Promise<Document>;
  getDocuments(companyId: number): Promise<Document[]>;
  getDocument(id: number, companyId: number): Promise<Document | undefined>;
  deleteDocument(id: number, companyId: number): Promise<boolean>;
  
  // Survey methods
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  getSurveyResponses(companyId: number): Promise<SurveyResponse[]>;
  getSurveyResponsesByTemplateId(templateId: number, companyId: number): Promise<SurveyResponse[]>;
  
  // Survey Template methods
  createSurveyTemplate(template: InsertSurveyTemplate): Promise<SurveyTemplate>;
  getSurveyTemplates(companyId: number): Promise<SurveyTemplate[]>;
  getSurveyTemplate(id: number, companyId: number): Promise<SurveyTemplate | undefined>;
  updateSurveyTemplate(id: number, template: Partial<InsertSurveyTemplate>, companyId: number): Promise<SurveyTemplate | undefined>;
  deleteSurveyTemplate(id: number, companyId: number): Promise<boolean>;
  publishSurveyTemplate(id: number, companyId: number): Promise<SurveyTemplate | undefined>;
  
  // Survey Question methods
  createSurveyQuestion(question: InsertSurveyQuestion): Promise<SurveyQuestion>;
  getSurveyQuestions(): Promise<SurveyQuestion[]>;
  getSurveyQuestionsByTemplateId(templateId: number): Promise<SurveyQuestion[]>;
  getSurveyQuestion(id: number): Promise<SurveyQuestion | undefined>;
  updateSurveyQuestion(id: number, question: Partial<InsertSurveyQuestion>): Promise<SurveyQuestion | undefined>;
  deleteSurveyQuestion(id: number): Promise<boolean>;
  
  // Chat methods
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(companyId: number, userId: number): Promise<ChatMessage[]>;
  
  // Calendar events methods
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  getCalendarEvents(companyId: number): Promise<CalendarEvent[]>;
  updateCalendarEvent(id: number, event: Partial<InsertCalendarEvent>, companyId: number): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: number, companyId: number): Promise<boolean>;
  
  // Company methods
  createCompany(company: InsertCompany): Promise<Company>;
  getCompanies(): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyBySlug(slug: string): Promise<Company | undefined>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;
  
  // Company settings methods
  getCompanySettings(companyId: number): Promise<CompanySettings | undefined>;
  updateCompanySettings(settings: Partial<InsertCompanySettings>, companyId: number): Promise<CompanySettings>;

  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'user_sessions'
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsersByCompany(companyId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.companyId, companyId));
  }

  // Document methods
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async getDocuments(companyId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.companyId, companyId));
  }

  async getDocument(id: number, companyId: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents)
      .where(and(eq(documents.id, id), eq(documents.companyId, companyId)));
    return document;
  }

  async deleteDocument(id: number, companyId: number): Promise<boolean> {
    const result = await db.delete(documents)
      .where(and(eq(documents.id, id), eq(documents.companyId, companyId)));
    return result.rowCount > 0;
  }

  // Survey methods
  async createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
    const [newResponse] = await db.insert(surveyResponses).values(response).returning();
    return newResponse;
  }

  async getSurveyResponses(companyId: number): Promise<SurveyResponse[]> {
    return await db.select().from(surveyResponses)
      .where(eq(surveyResponses.companyId, companyId));
  }

  async getSurveyResponsesByTemplateId(templateId: number, companyId: number): Promise<SurveyResponse[]> {
    return await db.select().from(surveyResponses)
      .where(and(
        eq(surveyResponses.templateId, templateId),
        eq(surveyResponses.companyId, companyId)
      ));
  }

  // Chat methods
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  async getChatMessages(companyId: number, userId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(and(
        eq(chatMessages.companyId, companyId),
        eq(chatMessages.userId, userId)
      ));
  }

  // Calendar events methods
  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [newEvent] = await db.insert(calendarEvents).values(event).returning();
    return newEvent;
  }

  async getCalendarEvents(companyId: number): Promise<CalendarEvent[]> {
    return await db.select().from(calendarEvents)
      .where(eq(calendarEvents.companyId, companyId));
  }

  async updateCalendarEvent(id: number, event: Partial<InsertCalendarEvent>, companyId: number): Promise<CalendarEvent | undefined> {
    const [updatedEvent] = await db.update(calendarEvents)
      .set(event)
      .where(and(
        eq(calendarEvents.id, id),
        eq(calendarEvents.companyId, companyId)
      ))
      .returning();
    return updatedEvent;
  }

  async deleteCalendarEvent(id: number, companyId: number): Promise<boolean> {
    const result = await db.delete(calendarEvents)
      .where(and(
        eq(calendarEvents.id, id),
        eq(calendarEvents.companyId, companyId)
      ));
    return result.rowCount > 0;
  }

  // Survey Template methods
  async createSurveyTemplate(template: InsertSurveyTemplate): Promise<SurveyTemplate> {
    const [newTemplate] = await db.insert(surveyTemplates).values(template).returning();
    return newTemplate;
  }

  async getSurveyTemplates(companyId: number): Promise<SurveyTemplate[]> {
    return await db.select().from(surveyTemplates)
      .where(eq(surveyTemplates.companyId, companyId));
  }

  async getSurveyTemplate(id: number, companyId: number): Promise<SurveyTemplate | undefined> {
    const [template] = await db.select().from(surveyTemplates)
      .where(and(
        eq(surveyTemplates.id, id),
        eq(surveyTemplates.companyId, companyId)
      ));
    return template;
  }

  async updateSurveyTemplate(id: number, template: Partial<InsertSurveyTemplate>, companyId: number): Promise<SurveyTemplate | undefined> {
    const [updatedTemplate] = await db.update(surveyTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(and(
        eq(surveyTemplates.id, id),
        eq(surveyTemplates.companyId, companyId)
      ))
      .returning();
    return updatedTemplate;
  }

  async deleteSurveyTemplate(id: number, companyId: number): Promise<boolean> {
    const result = await db.delete(surveyTemplates)
      .where(and(
        eq(surveyTemplates.id, id),
        eq(surveyTemplates.companyId, companyId)
      ));
    return result.rowCount > 0;
  }

  async publishSurveyTemplate(id: number, companyId: number): Promise<SurveyTemplate | undefined> {
    const [updatedTemplate] = await db.update(surveyTemplates)
      .set({ 
        status: "published", 
        publishedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(and(
        eq(surveyTemplates.id, id),
        eq(surveyTemplates.companyId, companyId)
      ))
      .returning();
    return updatedTemplate;
  }

  // Survey Question methods
  async createSurveyQuestion(question: InsertSurveyQuestion): Promise<SurveyQuestion> {
    const [newQuestion] = await db.insert(surveyQuestions).values(question).returning();
    return newQuestion;
  }

  async getSurveyQuestions(): Promise<SurveyQuestion[]> {
    return await db.select().from(surveyQuestions);
  }

  async getSurveyQuestionsByTemplateId(templateId: number): Promise<SurveyQuestion[]> {
    return await db.select().from(surveyQuestions)
      .where(eq(surveyQuestions.templateId, templateId));
  }

  async getSurveyQuestion(id: number): Promise<SurveyQuestion | undefined> {
    const [question] = await db.select().from(surveyQuestions)
      .where(eq(surveyQuestions.id, id));
    return question;
  }

  async updateSurveyQuestion(id: number, question: Partial<InsertSurveyQuestion>): Promise<SurveyQuestion | undefined> {
    const [updatedQuestion] = await db.update(surveyQuestions)
      .set({ ...question, updatedAt: new Date() })
      .where(eq(surveyQuestions.id, id))
      .returning();
    return updatedQuestion;
  }

  async deleteSurveyQuestion(id: number): Promise<boolean> {
    const result = await db.delete(surveyQuestions)
      .where(eq(surveyQuestions.id, id));
    return result.rowCount > 0;
  }

  // Company methods
  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies)
      .where(eq(companies.id, id));
    return company;
  }

  async getCompanyBySlug(slug: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies)
      .where(eq(companies.slug, slug));
    return company;
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const [updatedCompany] = await db.update(companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  // Company settings methods
  async getCompanySettings(companyId: number): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings)
      .where(eq(companySettings.companyId, companyId));
    return settings;
  }

  async updateCompanySettings(settings: Partial<InsertCompanySettings>, companyId: number): Promise<CompanySettings> {
    // Check if settings exist for this company
    const existingSettings = await this.getCompanySettings(companyId);

    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db.update(companySettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(companySettings.companyId, companyId))
        .returning();
      return updatedSettings;
    } else {
      // Create new settings
      const [newSettings] = await db.insert(companySettings)
        .values({ ...settings, companyId } as InsertCompanySettings)
        .returning();
      return newSettings;
    }
  }
}

export const storage = new DatabaseStorage();