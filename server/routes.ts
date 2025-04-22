import type { Express, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import multer from "multer";
import { createServer, type Server } from "http";

// Define a custom interface that extends Express.Request with multer's fields
interface MulterRequest extends Request {
  files?: Express.Multer.File[];
}
import { storage } from "./storage";
import { upload, getFilePath } from "./multer";
import { processDocumentContent, chatWithDocuments } from "./openai";
import fs from "fs/promises";
import path from "path";
import { insertDocumentSchema, insertSurveyResponseSchema, insertChatMessageSchema, insertCalendarEventSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Document endpoints
  app.post("/api/documents", upload.array("documents"), async (req: MulterRequest, res: Response) => {
    try {
      const files = req.files || [];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      const documents = await Promise.all(
        files.map(async (file) => {
          // Read file content
          let content = "";
          
          try {
            // Read the first 50KB of the file for simplicity
            const buffer = await fs.readFile(getFilePath(file.filename), { encoding: "utf-8", flag: "r" });
            content = buffer.toString().substring(0, 50000);
            
            // Process the content with OpenAI if available
            content = await processDocumentContent(content);
          } catch (error) {
            console.error(`Error reading file ${file.filename}:`, error);
            content = "Error reading document content";
          }
          
          const documentData = {
            fileName: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            content,
          };
          
          const validatedData = insertDocumentSchema.parse(documentData);
          return await storage.createDocument(validatedData);
        })
      );
      
      res.status(201).json(documents);
    } catch (error) {
      console.error("Error uploading documents:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid document data", errors: fromZodError(error).message });
      }
      
      res.status(500).json({ message: "Failed to upload documents" });
    }
  });
  
  app.get("/api/documents", async (req: Request, res: Response) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });
  
  app.delete("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Delete file from filesystem if it exists
      try {
        await fs.unlink(getFilePath(document.fileName));
      } catch (error) {
        console.error(`Error deleting file ${document.fileName}:`, error);
      }
      
      const success = await storage.deleteDocument(id);
      
      if (success) {
        res.status(200).json({ message: "Document deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete document" });
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });
  
  // Survey endpoints
  app.post("/api/survey", async (req: Request, res: Response) => {
    try {
      const surveyData = req.body;
      const validatedData = insertSurveyResponseSchema.parse(surveyData);
      const surveyResponse = await storage.createSurveyResponse(validatedData);
      res.status(201).json(surveyResponse);
    } catch (error) {
      console.error("Error creating survey response:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid survey data", errors: fromZodError(error).message });
      }
      
      res.status(500).json({ message: "Failed to create survey response" });
    }
  });
  
  app.get("/api/survey", async (req: Request, res: Response) => {
    try {
      const surveyResponses = await storage.getSurveyResponses();
      res.json(surveyResponses);
    } catch (error) {
      console.error("Error fetching survey responses:", error);
      res.status(500).json({ message: "Failed to fetch survey responses" });
    }
  });
  
  // Chat endpoints
  app.get("/api/chat", async (req: Request, res: Response) => {
    try {
      const messages = await storage.getChatMessages();
      
      // If no messages exist, don't return anything (the frontend will show a welcome message)
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });
  
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const messageData = req.body;
      const validatedData = insertChatMessageSchema.parse(messageData);
      
      // Store user message
      await storage.createChatMessage(validatedData);
      
      // Get documents for the chatbot to reference
      const documents = await storage.getDocuments();
      
      // Filter out documents with null content and prepare for OpenAI
      const docsWithContent = documents
        .filter(doc => doc.content !== null)
        .map(doc => ({ content: doc.content as string }));
      
      // Get response from OpenAI
      const botResponse = await chatWithDocuments(docsWithContent, validatedData.content);
      
      // Store bot response
      await storage.createChatMessage({
        role: botResponse.role,
        content: botResponse.content
      });
      
      // Return all messages
      const allMessages = await storage.getChatMessages();
      res.json(allMessages);
    } catch (error) {
      console.error("Error in chat:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: fromZodError(error).message });
      }
      
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });
  
  // Calendar events endpoints
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const events = await storage.getCalendarEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });
  
  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      const eventData = req.body;
      const validatedData = insertCalendarEventSchema.parse(eventData);
      const event = await storage.createCalendarEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: fromZodError(error).message });
      }
      
      res.status(500).json({ message: "Failed to create calendar event" });
    }
  });
  
  app.patch("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const eventData = req.body;
      const event = await storage.updateCalendarEvent(id, eventData);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error updating calendar event:", error);
      res.status(500).json({ message: "Failed to update calendar event" });
    }
  });
  
  app.delete("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const success = await storage.deleteCalendarEvent(id);
      
      if (success) {
        res.status(200).json({ message: "Event deleted successfully" });
      } else {
        res.status(404).json({ message: "Event not found" });
      }
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      res.status(500).json({ message: "Failed to delete calendar event" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
