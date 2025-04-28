import { apiRequest } from './queryClient';

export interface WebsitePlan {
  name: string;
  description: string;
  highlights: string[];
}

export interface WebsiteSection {
  id: string;
  title: string;
  description: string;
  plans: WebsitePlan[];
}

export interface WebsiteContent {
  overview: {
    title: string;
    description: string;
  };
  sections: WebsiteSection[];
}

export async function getWebsiteContent(): Promise<WebsiteContent> {
  const response = await apiRequest('GET', '/api/website-content');
  return response.json();
}