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

export interface FAQ {
  question: string;
  answer: string;
}

export interface KeyContact {
  name: string;
  role: string;
  contact: string;
}

export interface AdditionalResource {
  title: string;
  description: string;
  url: string;
}

export interface BenefitDetail {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  overview: string;
  eligibility: string;
  howToEnroll: string;
  faq: FAQ[];
  keyContacts: KeyContact[];
  additionalResources: AdditionalResource[];
  images: string[];
}

export async function getWebsiteContent(): Promise<WebsiteContent> {
  const response = await apiRequest('GET', '/api/website-content');
  return response.json();
}

export async function getBenefitDetail(benefitId: string): Promise<BenefitDetail> {
  const response = await apiRequest('GET', `/api/benefit-details/${benefitId}`);
  return response.json();
}