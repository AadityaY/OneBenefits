import { apiRequest, queryClient } from "@/lib/queryClient";
import { InsertSurveyResponse, SurveyResponse } from "@shared/schema";

/**
 * Get all survey responses
 */
export async function getSurveyResponses(): Promise<SurveyResponse[]> {
  const response = await fetch('/api/survey', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get survey responses for a specific template
 */
export async function getSurveyResponsesByTemplateId(templateId: number): Promise<SurveyResponse[]> {
  const response = await fetch(`/api/survey?templateId=${templateId}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  
  return response.json();
}

/**
 * Submit a new survey response
 */
export async function submitSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
  const apiResponse = await apiRequest('POST', '/api/survey', response);
  
  // Invalidate cache after submission
  queryClient.invalidateQueries({ queryKey: ['/api/survey'] });
  
  return apiResponse.json();
}