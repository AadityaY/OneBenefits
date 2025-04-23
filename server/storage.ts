import { 
  users, type User, type InsertUser,
  documents, type Document, type InsertDocument,
  surveyResponses, type SurveyResponse, type InsertSurveyResponse,
  chatMessages, type ChatMessage, type InsertChatMessage,
  calendarEvents, type CalendarEvent, type InsertCalendarEvent,
  surveyTemplates, type SurveyTemplate, type InsertSurveyTemplate,
  surveyQuestions, type SurveyQuestion, type InsertSurveyQuestion,
  templateQuestions, type TemplateQuestion, type InsertTemplateQuestion,
  companies, type Company, type InsertCompany,
  companySettings, type CompanySettings, type InsertCompanySettings
} from "@shared/schema";

import { db } from "./db";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";
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
  getSurveyQuestions(companyId: number): Promise<SurveyQuestion[]>;
  getSurveyQuestion(id: number, companyId: number): Promise<SurveyQuestion | undefined>;
  updateSurveyQuestion(id: number, question: Partial<InsertSurveyQuestion>, companyId: number): Promise<SurveyQuestion | undefined>;
  deleteSurveyQuestion(id: number, companyId: number): Promise<boolean>;
  
  // Template Question relationship methods
  addQuestionToTemplate(templateId: number, questionId: number, order: number): Promise<TemplateQuestion>;
  removeQuestionFromTemplate(templateId: number, questionId: number): Promise<boolean>;
  getQuestionsForTemplate(templateId: number): Promise<SurveyQuestion[]>;
  
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
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number, companyId: number): Promise<Notification[]>;
  getCompanyNotifications(companyId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number, userId: number): Promise<boolean>;
  markAllUserNotificationsAsRead(userId: number, companyId: number): Promise<boolean>;
  deleteNotification(id: number, companyId: number): Promise<boolean>;
  getUnreadNotificationCount(userId: number, companyId: number): Promise<number>;

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

  async getSurveyQuestions(companyId: number): Promise<SurveyQuestion[]> {
    return await db.select().from(surveyQuestions)
      .where(eq(surveyQuestions.companyId, companyId));
  }

  async getSurveyQuestion(id: number, companyId: number): Promise<SurveyQuestion | undefined> {
    const [question] = await db.select().from(surveyQuestions)
      .where(and(
        eq(surveyQuestions.id, id),
        eq(surveyQuestions.companyId, companyId)
      ));
    return question;
  }

  async updateSurveyQuestion(id: number, question: Partial<InsertSurveyQuestion>, companyId: number): Promise<SurveyQuestion | undefined> {
    const [updatedQuestion] = await db.update(surveyQuestions)
      .set({ ...question, updatedAt: new Date() })
      .where(and(
        eq(surveyQuestions.id, id),
        eq(surveyQuestions.companyId, companyId)
      ))
      .returning();
    return updatedQuestion;
  }

  async deleteSurveyQuestion(id: number, companyId: number): Promise<boolean> {
    const result = await db.delete(surveyQuestions)
      .where(and(
        eq(surveyQuestions.id, id),
        eq(surveyQuestions.companyId, companyId)
      ));
    return result.rowCount > 0;
  }
  
  // Template-Question relationship methods
  async addQuestionToTemplate(templateId: number, questionId: number, order: number): Promise<TemplateQuestion> {
    const [templateQuestion] = await db.insert(templateQuestions)
      .values({
        templateId,
        questionId,
        order
      })
      .returning();
    return templateQuestion;
  }
  
  async removeQuestionFromTemplate(templateId: number, questionId: number): Promise<boolean> {
    const result = await db.delete(templateQuestions)
      .where(and(
        eq(templateQuestions.templateId, templateId),
        eq(templateQuestions.questionId, questionId)
      ));
    return result.rowCount > 0;
  }
  
  async getQuestionsForTemplate(templateId: number): Promise<SurveyQuestion[]> {
    // First, get all template-question associations for this template
    const templateQuestionsResult = await db
      .select()
      .from(templateQuestions)
      .where(eq(templateQuestions.templateId, templateId))
      .orderBy(templateQuestions.order);
    
    if (templateQuestionsResult.length === 0) {
      return [];
    }

    // Now get the questions one by one in order
    const questions: SurveyQuestion[] = [];
    
    for (const tq of templateQuestionsResult) {
      const [question] = await db
        .select()
        .from(surveyQuestions)
        .where(eq(surveyQuestions.id, tq.questionId));
      
      if (question) {
        questions.push(question);
      }
    }
    
    return questions;
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
  
  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }
  
  async getUserNotifications(userId: number, companyId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(and(
        eq(notifications.companyId, companyId),
        or(
          // User-specific notifications
          eq(notifications.userId, userId),
          // Global company notifications
          and(
            eq(notifications.isGlobal, true),
            isNull(notifications.userId)
          )
        )
      ))
      .orderBy(desc(notifications.createdAt));
  }
  
  async getCompanyNotifications(companyId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(and(
        eq(notifications.companyId, companyId),
        eq(notifications.isGlobal, true)
      ))
      .orderBy(desc(notifications.createdAt));
  }
  
  async markNotificationAsRead(id: number, userId: number): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, id),
        or(
          eq(notifications.userId, userId),
          eq(notifications.isGlobal, true)
        )
      ));
    return result.rowCount > 0;
  }
  
  async markAllUserNotificationsAsRead(userId: number, companyId: number): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.companyId, companyId),
        or(
          eq(notifications.userId, userId),
          eq(notifications.isGlobal, true)
        ),
        eq(notifications.isRead, false)
      ));
    return result.rowCount > 0;
  }
  
  async deleteNotification(id: number, companyId: number): Promise<boolean> {
    const result = await db.delete(notifications)
      .where(and(
        eq(notifications.id, id),
        eq(notifications.companyId, companyId)
      ));
    return result.rowCount > 0;
  }
  
  async getUnreadNotificationCount(userId: number, companyId: number): Promise<number> {
    const result = await db.select({ count: count() }).from(notifications)
      .where(and(
        eq(notifications.companyId, companyId),
        or(
          eq(notifications.userId, userId),
          and(
            eq(notifications.isGlobal, true),
            isNull(notifications.userId)
          )
        ),
        eq(notifications.isRead, false)
      ));
    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();