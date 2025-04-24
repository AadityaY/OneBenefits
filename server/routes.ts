import { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { upload, getFilePath } from "./multer";
import { processDocumentContent, chatWithDocuments } from "./openai";
import * as fs from "fs/promises";
import { setupAuth, isAuthenticated, isAdmin, isSuperAdmin, companyAccess } from "./auth";
import { z } from "zod";
import { insertCompanySchema, InsertDocument } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Company management routes - superadmin only
  app.post("/api/companies", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validatedData);
      res.status(201).json(company);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/companies", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/companies/:id", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/companies/:id", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.updateCompany(id, req.body);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Document routes
  app.post("/api/documents", isAuthenticated, companyAccess, upload.array("documents"), async (req: Request, res: Response) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const companyId = req.user.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User has no associated company" });
      }
      
      // Get document metadata from the request body
      const { title, description, isPublic = false, category = "general" } = req.body;

      const results = await Promise.all(
        req.files.map(async (file, index) => {
          try {
            // Read file content
            const filePath = getFilePath(file.filename);
            let content = "";
            
            // Process content for text files and PDFs
            if (file.mimetype === "text/plain" || file.mimetype === "application/pdf") {
              content = await processDocumentContent("");
            }

            // For multiple files, append index to title if provided
            const fileTitle = title ? (req.files.length > 1 ? `${title} (${index + 1})` : title) : file.originalname;
            
            // Store in database
            const document = await storage.createDocument({
              companyId,
              fileName: file.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              content,
              title: fileTitle,
              description,
              isPublic: Boolean(isPublic),
              category,
              uploadedBy: req.user.id
            });

            return document;
          } catch (error) {
            console.error("Error processing document:", error);
            return {
              fileName: file.filename,
              originalName: file.originalname,
              error: error.message
            };
          }
        })
      );

      res.status(201).json(results);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get all documents for a company (admins can see all, users only see public ones)
  app.get("/api/documents", isAuthenticated, companyAccess, async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string) || req.user.companyId;
      const onlyPublic = req.user.role === "user"; // Regular users only see public documents
      
      console.log(`Fetching documents for companyId: ${companyId}, onlyPublic: ${onlyPublic}, userRole: ${req.user.role}`);
      
      const documents = await storage.getDocuments(companyId, onlyPublic);
      
      console.log(`Found ${documents.length} documents`);
      if (documents.length > 0) {
        console.log(`First document isPublic: ${documents[0].isPublic}`);
      }
      
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get a single document
  app.get("/api/documents/:id", isAuthenticated, companyAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string) || req.user.companyId;
      
      const document = await storage.getDocument(id, companyId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user has access to this document (admins or public docs)
      if (req.user.role === "user" && !document.isPublic) {
        return res.status(403).json({ message: "Access denied to this document" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a document (admin only)
  app.delete("/api/documents/:id", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string) || req.user.companyId;
      
      // Get the document to check if it exists and get the filename
      const document = await storage.getDocument(id, companyId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Delete from database
      const success = await storage.deleteDocument(id, companyId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete document" });
      }

      // Try to delete the file from disk (if it exists)
      try {
        await fs.unlink(getFilePath(document.fileName));
      } catch (error) {
        console.warn(`File ${document.fileName} could not be deleted`, error);
        // We continue since the database record is deleted
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update document metadata (admin only) - used to toggle availability and update document details
  app.patch("/api/documents/:id", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string) || req.user.companyId;
      
      // Get the document to check if it exists
      const document = await storage.getDocument(id, companyId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Update document metadata
      const { title, description, isPublic, category } = req.body;
      const updates: Partial<InsertDocument> = {};
      
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (isPublic !== undefined) updates.isPublic = Boolean(isPublic);
      if (category !== undefined) updates.category = category;
      
      const updatedDocument = await storage.updateDocument(id, updates, companyId);
      
      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Survey response routes
  app.post("/api/survey", isAuthenticated, companyAccess, async (req: Request, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.id;
      
      if (!companyId) {
        return res.status(400).json({ message: "User has no associated company" });
      }
      
      const surveyResponse = await storage.createSurveyResponse({
        ...req.body,
        companyId,
        userId
      });
      
      res.status(201).json(surveyResponse);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/survey", isAuthenticated, companyAccess, async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      const responses = await storage.getSurveyResponses(companyId);
      res.json(responses);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Survey template routes
  app.post("/api/survey-templates", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      let companyId = req.user.companyId;
      
      // For superadmin users, allow creating templates for any company
      if (!companyId && req.user.role === "superadmin") {
        // Use companyId from request if provided, otherwise use company ID 1 (default)
        companyId = req.body.companyId || 1;
      } else if (!companyId) {
        return res.status(400).json({ message: "Admin has no associated company" });
      }
      
      const template = await storage.createSurveyTemplate({
        ...req.body,
        companyId
      });
      
      res.status(201).json(template);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/survey-templates", isAuthenticated, companyAccess, async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      const templates = await storage.getSurveyTemplates(companyId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/survey-templates/:id", isAuthenticated, companyAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string);
      const template = await storage.getSurveyTemplate(id, companyId);
      
      if (!template) {
        return res.status(404).json({ message: "Survey template not found" });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/survey-templates/:id", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string);
      const template = await storage.updateSurveyTemplate(id, req.body, companyId);
      
      if (!template) {
        return res.status(404).json({ message: "Survey template not found" });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/survey-templates/:id", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string);
      const success = await storage.deleteSurveyTemplate(id, companyId);
      
      if (!success) {
        return res.status(404).json({ message: "Survey template not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/survey-templates/:id/publish", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string);
      const template = await storage.publishSurveyTemplate(id, companyId);
      
      if (!template) {
        return res.status(404).json({ message: "Survey template not found" });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Survey question routes
  // Survey question operations - all company-specific
  app.post("/api/survey-questions", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      let companyId = req.user.companyId;
      
      // For superadmin users, allow creating questions for any company
      if (!companyId && req.user.role === "superadmin") {
        // Use companyId from request if provided, otherwise use company ID 1 (default)
        companyId = req.body.companyId || 1;
      } else if (!companyId) {
        return res.status(400).json({ message: "User has no associated company" });
      }
      
      const questionData = {
        ...req.body,
        companyId
      };
      
      const question = await storage.createSurveyQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/survey-questions", isAuthenticated, companyAccess, async (req: Request, res: Response) => {
    try {
      let companyId = req.user.companyId;
      
      // For superadmin users, allow retrieving questions for any company
      if (!companyId && req.user.role === "superadmin") {
        // Use companyId from query if provided, otherwise use company ID 1 (default)
        companyId = req.query.companyId ? parseInt(req.query.companyId as string) : 1;
      } else if (!companyId) {
        return res.status(400).json({ message: "User has no associated company" });
      }
      
      const questions = await storage.getSurveyQuestions(companyId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/survey-questions/:id", isAuthenticated, companyAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.user.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User has no associated company" });
      }
      
      const question = await storage.getSurveyQuestion(id, companyId);
      
      if (!question) {
        return res.status(404).json({ message: "Survey question not found" });
      }
      
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/survey-questions/:id", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.user.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User has no associated company" });
      }
      
      const question = await storage.updateSurveyQuestion(id, req.body, companyId);
      
      if (!question) {
        return res.status(404).json({ message: "Survey question not found" });
      }
      
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/survey-questions/:id", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.user.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User has no associated company" });
      }
      
      const success = await storage.deleteSurveyQuestion(id, companyId);
      
      if (!success) {
        return res.status(404).json({ message: "Survey question not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Template-Question relationship management
  app.get("/api/survey-templates/:templateId/questions", isAuthenticated, companyAccess, async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.templateId);
      const questions = await storage.getQuestionsForTemplate(templateId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/survey-templates/:templateId/questions", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.templateId);
      const questionId = req.body.questionId;
      const order = req.body.order || 0;
      
      if (!questionId) {
        return res.status(400).json({ message: "Question ID is required" });
      }
      
      const templateQuestion = await storage.addQuestionToTemplate(templateId, questionId, order);
      res.status(201).json(templateQuestion);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/survey-templates/:templateId/questions/:questionId", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.templateId);
      const questionId = parseInt(req.params.questionId);
      
      const success = await storage.removeQuestionFromTemplate(templateId, questionId);
      
      if (!success) {
        return res.status(404).json({ message: "Question not found in template" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Chat routes
  app.get("/api/chat", isAuthenticated, companyAccess, async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      const userId = req.user.id;
      const messages = await storage.getChatMessages(companyId, userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/chat", isAuthenticated, companyAccess, async (req: Request, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.id;
      
      if (!companyId) {
        return res.status(400).json({ message: "User has no associated company" });
      }
      
      // Retrieve company documents to provide context
      const documents = await storage.getDocuments(companyId);
      
      // Get existing chat history
      const chatHistory = await storage.getChatMessages(companyId, userId);
      
      // Add user message to database
      const userMessage = await storage.createChatMessage({
        companyId,
        userId,
        role: "user", 
        content: req.body.content
      });
      
      // Generate AI response (pass documents for context)
      const aiResponse = await chatWithDocuments(
        documents,
        req.body.content
      );
      
      // Store AI response
      const assistantMessage = await storage.createChatMessage({
        companyId,
        userId,
        role: "assistant",
        content: aiResponse.content
      });
      
      res.json(assistantMessage);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Calendar events routes
  app.get("/api/events", isAuthenticated, companyAccess, async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      const events = await storage.getCalendarEvents(companyId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/events", isAuthenticated, companyAccess, async (req: Request, res: Response) => {
    try {
      const companyId = req.user.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User has no associated company" });
      }
      
      const event = await storage.createCalendarEvent({
        ...req.body,
        companyId
      });
      
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/events/:id", isAuthenticated, companyAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string);
      const event = await storage.updateCalendarEvent(id, req.body, companyId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/events/:id", isAuthenticated, companyAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.query.companyId as string);
      const success = await storage.deleteCalendarEvent(id, companyId);
      
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Company settings routes
  app.get("/api/company-settings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // For superadmins, allow fetching company settings without a specific companyId
      const isSuperAdmin = req.user && req.user.role === 'superadmin';
      let companyId = req.query.companyId ? parseInt(req.query.companyId as string) : null;
      
      // If no companyId specified, use user's companyId (except for superadmin)
      if (!companyId && req.user && req.user.companyId && !isSuperAdmin) {
        companyId = req.user.companyId;
      }
      
      // Superadmins can get a default company setting without specifying companyId
      // Other users must provide a companyId or have one associated with their account
      if (!companyId && !isSuperAdmin) {
        return res.status(400).json({ message: "Missing company ID" });
      }
      
      // For superadmin without companyId, get the first company's settings
      if (isSuperAdmin && !companyId) {
        // Get the first company in the system
        const companies = await storage.getCompanies();
        if (companies && companies.length > 0) {
          companyId = companies[0].id;
        }
      }
      
      // Now we should have a companyId one way or another
      if (!companyId) {
        return res.status(404).json({ message: "No companies found" });
      }
      
      // Ensure the user has access to the requested company
      if (!isSuperAdmin && req.user && req.user.companyId !== companyId) {
        return res.status(403).json({ message: "Access denied to this company's settings" });
      }
      
      const settings = await storage.getCompanySettings(companyId);
      
      if (!settings) {
        return res.status(404).json({ message: "Company settings not found" });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ message: "Failed to fetch company settings" });
    }
  });

  app.patch("/api/company-settings", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.query.companyId as string);
      
      if (!companyId) {
        return res.status(400).json({ message: "Missing company ID" });
      }
      
      const settings = await storage.updateCompanySettings(req.body, companyId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notification routes
  
  // Get user notifications
  app.get("/api/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "User does not have a company" });
      }
      
      const notifications = await storage.getUserNotifications(userId, companyId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get company-wide notifications (admin only)
  app.get("/api/company-notifications", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "User does not have a company" });
      }
      
      const notifications = await storage.getCompanyNotifications(companyId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get unread notification count
  app.get("/api/notifications/unread-count", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "User does not have a company" });
      }
      
      const count = await storage.getUnreadNotificationCount(userId, companyId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Mark notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      
      const success = await storage.markNotificationAsRead(id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found or you don't have permission" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Mark all notifications as read
  app.patch("/api/notifications/read-all", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "User does not have a company" });
      }
      
      const success = await storage.markAllUserNotificationsAsRead(userId, companyId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create notification (admin only)
  app.post("/api/notifications", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "User does not have a company" });
      }
      
      const notificationData = {
        ...req.body,
        companyId
      };
      
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Delete notification (admin only)
  app.delete("/api/notifications/:id", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "User does not have a company" });
      }
      
      const success = await storage.deleteNotification(id, companyId);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}