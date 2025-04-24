import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Question types for survey template
export const questionTypeEnum = z.enum([
  "text",
  "radio",
  "checkbox",
  "select",
  "textarea",
  "scale"
]);

export type QuestionType = z.infer<typeof questionTypeEnum>;

// Define roles enum
export const userRoleEnum = z.enum(["user", "admin", "superadmin"]);
export type UserRole = z.infer<typeof userRoleEnum>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  companyId: integer("company_id").references(() => companies.id),
  role: text("role").notNull().default("user"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    email: true,
    firstName: true,
    lastName: true,
    companyId: true,
    role: true,
    active: true,
  })
  .extend({
    role: userRoleEnum.default("user"),
    active: z.boolean().default(true),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  content: text("content"),
  title: text("title"),
  description: text("description"),
  isPublic: boolean("is_public").default(false).notNull(),
  category: text("category").default("general"),
  uploadedBy: integer("uploaded_by").references(() => users.id),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
}).extend({
  isPublic: z.boolean().default(false),
  category: z.string().default("general"),
  title: z.string().optional(),
  description: z.string().optional(),
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Define a response item schema to store individual question responses
export const surveyResponseItem = z.object({
  questionId: z.number(),
  questionText: z.string(),
  questionType: z.string(),
  response: z.union([z.string(), z.array(z.string())])
});

export type SurveyResponseItem = z.infer<typeof surveyResponseItem>;

export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  templateId: integer("template_id").notNull(),
  responses: jsonb("responses").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// Create a schema that allows a more flexible response structure
export const insertSurveyResponseSchema = z.object({
  templateId: z.number(),
  responses: z.array(surveyResponseItem)
});

export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;
export type SurveyResponse = typeof surveyResponses.$inferSelect;

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date").notNull(),
  eventType: text("event_type").notNull(),
  color: text("color").notNull(),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
});

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

// Survey question template schema
export const surveyQuestions = pgTable("survey_questions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(),
  required: boolean("required").default(false).notNull(),
  order: integer("order").notNull(),
  options: text("options").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
});

export const insertSurveyQuestionSchema = createInsertSchema(surveyQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSurveyQuestion = z.infer<typeof insertSurveyQuestionSchema>;
export type SurveyQuestion = typeof surveyQuestions.$inferSelect;

// Junction table for many-to-many relationship between templates and questions
export const templateQuestions = pgTable("template_questions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => surveyTemplates.id),
  questionId: integer("question_id").notNull().references(() => surveyQuestions.id),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTemplateQuestionSchema = createInsertSchema(templateQuestions).omit({
  id: true,
  createdAt: true,
});

export type InsertTemplateQuestion = z.infer<typeof insertTemplateQuestionSchema>;
export type TemplateQuestion = typeof templateQuestions.$inferSelect;

// Survey template schema
export const surveyTemplates = pgTable("survey_templates", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
});

export const insertSurveyTemplateSchema = createInsertSchema(surveyTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export type InsertSurveyTemplate = z.infer<typeof insertSurveyTemplateSchema>;
export type SurveyTemplate = typeof surveyTemplates.$inferSelect;

// Companies table to track all tenant companies
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// Company settings schema
export const companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  logo: text("logo"),
  primaryColor: text("primary_color").default("#0f766e"),
  secondaryColor: text("secondary_color").default("#0369a1"),
  accentColor: text("accent_color").default("#7c3aed"),
  website: text("website"),
  contactEmail: text("contact_email"),
  address: text("address"),
  aiAssistantName: text("ai_assistant_name").default("Benefits Assistant"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  updatedAt: true,
});
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof companySettings.$inferSelect;

// Notification schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "event", "survey", "announcement", etc.
  linkType: text("link_type"), // "event", "survey", etc.
  linkId: integer("link_id"), // ID of the related item (event, survey, etc.)
  isRead: boolean("is_read").default(false).notNull(),
  isGlobal: boolean("is_global").default(false).notNull(), // If true, sent to all users in company
  createdAt: timestamp("created_at").defaultNow().notNull(),
  scheduledFor: timestamp("scheduled_for"), // For scheduled notifications
  expiresAt: timestamp("expires_at"), // Optional expiry time
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
