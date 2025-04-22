import { apiRequest } from "@/lib/queryClient";
import { InsertSurveyResponse, SurveyResponse } from "@shared/schema";

export async function submitSurveyResponse(data: InsertSurveyResponse): Promise<SurveyResponse> {
  const response = await apiRequest('POST', '/api/survey', data);
  return response.json();
}

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
