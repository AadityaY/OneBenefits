import { apiRequest } from "@/lib/queryClient";
import { InsertSurveyResponse, SurveyResponse } from "@shared/schema";

/**
 * Get all survey responses
 */
export async function getSurveyResponses(): Promise<SurveyResponse[]> {
  return apiRequest({
    method: "GET",
    url: "/api/survey",
  });
}

/**
 * Get survey responses for a specific template
 */
export async function getSurveyResponsesByTemplateId(templateId: number): Promise<SurveyResponse[]> {
  return apiRequest({
    method: "GET",
    url: `/api/survey?templateId=${templateId}`,
  });
}

/**
 * Submit a new survey response
 */
export async function submitSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
  return apiRequest({
    method: "POST",
    url: "/api/survey",
    data: response,
  });
}