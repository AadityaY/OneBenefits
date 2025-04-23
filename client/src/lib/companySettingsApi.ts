import { CompanySettings } from "@shared/schema";
import { apiRequest, queryClient } from "./queryClient";

// Get company settings
export async function getCompanySettings(): Promise<CompanySettings> {
  const response = await apiRequest("GET", "/api/company-settings");
  return await response.json();
}

// Update company settings
export async function updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
  const response = await apiRequest("PATCH", "/api/company-settings", settings);
  
  // Invalidate the cache
  queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
  
  return await response.json();
}

// Extract colors from a website - mock implementation
// In a real app, this would call a backend service that fetches the website and analyzes it
export async function extractColorsFromWebsite(url: string): Promise<{
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}> {
  try {
    // This would be an API call to a server-side function that can
    // make HTTP requests and analyze the page's CSS
    
    // For now, return a mock response based on the domain name
    // to demonstrate the functionality
    const domain = new URL(url).hostname.toLowerCase();
    
    if (domain.includes('google')) {
      return {
        primaryColor: '#4285F4',
        secondaryColor: '#34A853',
        accentColor: '#EA4335'
      };
    } else if (domain.includes('microsoft')) {
      return {
        primaryColor: '#00a4ef',
        secondaryColor: '#7fba00',
        accentColor: '#f25022'
      };
    } else if (domain.includes('apple')) {
      return {
        primaryColor: '#000000',
        secondaryColor: '#888888',
        accentColor: '#0066CC'
      };
    } else if (domain.includes('amazon')) {
      return {
        primaryColor: '#232F3E',
        secondaryColor: '#FF9900',
        accentColor: '#146EB4'
      };
    } else if (domain.includes('facebook')) {
      return {
        primaryColor: '#1877F2',
        secondaryColor: '#4267B2',
        accentColor: '#42B72A'
      };
    } else {
      // Default color scheme
      return {
        primaryColor: '#0f766e',
        secondaryColor: '#0369a1',
        accentColor: '#7c3aed'
      };
    }
  } catch (error) {
    console.error('Error extracting colors from website:', error);
    // Return default colors if there's an error
    return {
      primaryColor: '#0f766e',
      secondaryColor: '#0369a1',
      accentColor: '#7c3aed'
    };
  }
}