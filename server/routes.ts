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

  // AI-based survey template generation endpoint
  app.post("/api/survey-templates/generate", isAdmin, companyAccess, async (req: Request, res: Response) => {
    try {
      const { documentId, createQuarterly, createAnnual, prompt } = req.body;
      const companyId = req.user.companyId;
      const userId = req.user.id;
      
      if (!companyId) {
        return res.status(400).json({ message: "User has no associated company" });
      }
      
      if (!documentId) {
        return res.status(400).json({ message: "Document ID is required" });
      }
      
      // Get the document to extract its content
      const document = await storage.getDocument(documentId, companyId, false);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (!document.content) {
        return res.status(400).json({ message: "Document has no processed content" });
      }
      
      // Generate questions using OpenAI based on the document content and prompt
      const openaiSystem = prompt || "As a benefits administrator I would like to create quarterly and annual benefits surveys. Create questions based on the document.";
      
      try {
        // Use the OpenAI API to generate questions
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: openaiSystem
              },
              {
                role: "user",
                content: `Document content: ${document.content}\n\nGenerate 10 survey questions for a benefits satisfaction survey based on the specific details in the document. For each question, provide the question text, question type (choose one of: text, radio, checkbox, select, scale), and options (required for radio, checkbox, select, and scale types). Format the output as a valid JSON with a 'questions' array containing objects with questionText, questionType, and options properties. Include specific details from the document in the questions.`
              }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("OpenAI API error response:", errorData);
          throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const generatedData = await response.json();
        console.log("OpenAI API response:", JSON.stringify(generatedData.choices[0].message.content, null, 2));
        
        let generatedQuestions = [];
        try {
          const parsedContent = JSON.parse(generatedData.choices[0].message.content);
          generatedQuestions = parsedContent.questions || [];
          
          if (!generatedQuestions || !Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
            console.error("Invalid or empty questions array in OpenAI response:", parsedContent);
            throw new Error("Failed to generate valid survey questions. Please try again.");
          }
        } catch (parseError) {
          console.error("Error parsing OpenAI response:", parseError);
          throw new Error("Failed to parse AI-generated questions. Please try again.");
        }
        
        let templatesCreated = 0;
        let questionsCreated = 0;
        
        // Create questions first
        const createdQuestionIds = [];
        for (const q of generatedQuestions) {
          const newQuestion = await storage.createSurveyQuestion({
            companyId,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options || [],
            required: true,
            order: q.order || 1,
            createdByAI: true,
            createdBy: userId
          });
          
          if (newQuestion) {
            createdQuestionIds.push(newQuestion.id);
            questionsCreated++;
          }
        }
        
        // Function to create a template and assign questions
        const createTemplate = async (title, description, templateType) => {
          const newTemplate = await storage.createSurveyTemplate({
            companyId,
            title,
            description,
            status: "draft",
            createdByAI: true,
            createdBy: userId,
            templateType
          });
          
          if (newTemplate) {
            templatesCreated++;
            
            // Assign all questions to the template
            for (let i = 0; i < createdQuestionIds.length; i++) {
              await storage.addQuestionToTemplate(
                newTemplate.id,
                createdQuestionIds[i],
                i + 1
              );
            }
            
            return newTemplate;
          }
          
          return null;
        };
        
        // Create templates based on user selection
        if (createQuarterly) {
          await createTemplate(
            "Quarterly Benefits Survey", 
            "A quarterly check-in on employee satisfaction with benefits programs.",
            "quarterly"
          );
        }
        
        if (createAnnual) {
          await createTemplate(
            "Annual Benefits Survey", 
            "A comprehensive annual survey about all aspects of the employee benefits program.",
            "annual"
          );
        }
        
        res.json({
          success: true,
          templatesCreated,
          questionsCreated,
          message: `Successfully created ${templatesCreated} templates with ${questionsCreated} questions.`
        });
      } catch (openaiError) {
        console.error("OpenAI generation error:", openaiError);
        return res.status(500).json({ 
          message: `Error generating content with AI: ${openaiError.message}`,
          error: openaiError
        });
      }
    } catch (error) {
      console.error("Survey generation error:", error);
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
      
      // Get company settings to personalize the chat
      const companySettings = await storage.getCompanySettings(companyId);
      const companyName = companySettings?.name || "your company";
      const assistantName = companySettings?.aiAssistantName || "Benefits Assistant";
      
      // Filter out any documents with null content and prepare for OpenAI
      const documentsWithContent = documents
        .filter(doc => doc.content !== null)
        .map(doc => ({ content: doc.content || '' }));
      
      // Generate AI response with proper context
      const aiResponse = await chatWithDocuments(
        documentsWithContent, 
        req.body.content,
        companyId,
        userId,
        companyName,
        assistantName
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