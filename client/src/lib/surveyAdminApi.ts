import { apiRequest } from "@/lib/queryClient";
import {
  InsertSurveyTemplate,
  SurveyTemplate,
  InsertSurveyQuestion,
  SurveyQuestion
} from "@shared/schema";

// Survey Template API
export async function getSurveyTemplates(companyId?: number): Promise<SurveyTemplate[]> {
  const url = companyId 
    ? `/api/survey-templates?companyId=${companyId}`
    : '/api/survey-templates';
    
  const response = await fetch(url, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

export async function getSurveyTemplate(id: number, companyId?: number): Promise<SurveyTemplate> {
  const url = companyId 
    ? `/api/survey-templates/${id}?companyId=${companyId}`
    : `/api/survey-templates/${id}`;
    
  const response = await fetch(url, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

export async function createSurveyTemplate(data: InsertSurveyTemplate): Promise<SurveyTemplate> {
  const response = await apiRequest('POST', `/api/survey-templates?companyId=${data.companyId}`, data);
  return response.json();
}

export async function updateSurveyTemplate(id: number, data: Partial<InsertSurveyTemplate>): Promise<SurveyTemplate> {
  const companyId = data.companyId || 0;
  const response = await apiRequest('PATCH', `/api/survey-templates/${id}?companyId=${companyId}`, data);
  return response.json();
}

export async function deleteSurveyTemplate(id: number, companyId: number): Promise<void> {
  await apiRequest('DELETE', `/api/survey-templates/${id}?companyId=${companyId}`);
}

export async function publishSurveyTemplate(id: number, companyId: number): Promise<SurveyTemplate> {
  const response = await apiRequest('POST', `/api/survey-templates/${id}/publish?companyId=${companyId}`);
  return response.json();
}

// Survey Question API
export async function getSurveyQuestions(companyId?: number): Promise<SurveyQuestion[]> {
  const url = companyId 
    ? `/api/survey-questions?companyId=${companyId}`
    : '/api/survey-questions';
    
  const response = await fetch(url, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

export async function getSurveyQuestionsByTemplateId(templateId: number, companyId?: number): Promise<SurveyQuestion[]> {
  const url = companyId 
    ? `/api/survey-templates/${templateId}/questions?companyId=${companyId}`
    : `/api/survey-templates/${templateId}/questions`;
    
  const response = await fetch(url, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

export async function getSurveyQuestion(id: number, companyId?: number): Promise<SurveyQuestion> {
  const url = companyId 
    ? `/api/survey-questions/${id}?companyId=${companyId}`
    : `/api/survey-questions/${id}`;
    
  const response = await fetch(url, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

export async function createSurveyQuestion(data: InsertSurveyQuestion): Promise<SurveyQuestion> {
  const companyId = data.companyId || 0;
  const response = await apiRequest('POST', `/api/survey-questions?companyId=${companyId}`, data);
  return response.json();
}

export async function updateSurveyQuestion(id: number, data: Partial<InsertSurveyQuestion>): Promise<SurveyQuestion> {
  const companyId = data.companyId || 0;
  const response = await apiRequest('PATCH', `/api/survey-questions/${id}?companyId=${companyId}`, data);
  return response.json();
}

export async function deleteSurveyQuestion(id: number, companyId: number): Promise<void> {
  await apiRequest('DELETE', `/api/survey-questions/${id}?companyId=${companyId}`);
}

// AI Quick Setup
export interface QuickSetupOptions {
  documentId: number;
  createQuarterly: boolean;
  createAnnual: boolean;
  prompt?: string;
  companyId: number;
}

export interface QuickSetupResult {
  success: boolean;
  templatesCreated: number;
  questionsCreated: number;
  message: string;
}

export async function generateSurveysFromDocument(options: QuickSetupOptions): Promise<QuickSetupResult> {
  const response = await apiRequest(
    'POST',
    `/api/survey-templates/generate?companyId=${options.companyId}`,
    options
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to generate surveys');
  }
  
  return response.json();
}