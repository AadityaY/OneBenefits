import { apiRequest } from "@/lib/queryClient";
import {
  InsertSurveyTemplate,
  SurveyTemplate,
  InsertSurveyQuestion,
  SurveyQuestion
} from "@shared/schema";

// Survey Template API
export async function getSurveyTemplates(): Promise<SurveyTemplate[]> {
  const response = await fetch('/api/survey-templates', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

export async function getSurveyTemplate(id: number): Promise<SurveyTemplate> {
  const response = await fetch(`/api/survey-templates/${id}`, {
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
export async function getSurveyQuestions(): Promise<SurveyQuestion[]> {
  const response = await fetch('/api/survey-questions', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

export async function getSurveyQuestionsByTemplateId(templateId: number): Promise<SurveyQuestion[]> {
  const response = await fetch(`/api/survey-templates/${templateId}/questions`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

export async function getSurveyQuestion(id: number): Promise<SurveyQuestion> {
  const response = await fetch(`/api/survey-questions/${id}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

export async function createSurveyQuestion(data: InsertSurveyQuestion): Promise<SurveyQuestion> {
  const response = await apiRequest('POST', '/api/survey-questions', data);
  return response.json();
}

export async function updateSurveyQuestion(id: number, data: Partial<InsertSurveyQuestion>): Promise<SurveyQuestion> {
  const response = await apiRequest('PATCH', `/api/survey-questions/${id}`, data);
  return response.json();
}

export async function deleteSurveyQuestion(id: number): Promise<void> {
  await apiRequest('DELETE', `/api/survey-questions/${id}`);
}