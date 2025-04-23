import { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { CompanySettings } from "@shared/schema";

interface CompanyThemeContextType {
  settings: CompanySettings | null;
  isLoading: boolean;
  error: Error | null;
}

const CompanyThemeContext = createContext<CompanyThemeContextType | null>(null);

export function CompanyThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const companyId = user?.companyId; // Can be null for superadmin
  
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery<CompanySettings | null, Error>({
    queryKey: ["/api/company-settings", companyId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user, // Only fetch if user is logged in
  });

  // Apply theme to root element when settings change
  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      
      // Apply primary color
      if (settings.primaryColor) {
        root.style.setProperty('--primary', settings.primaryColor);
        root.style.setProperty('--primary-foreground', '#ffffff');
      }
      
      // Apply secondary color
      if (settings.secondaryColor) {
        root.style.setProperty('--secondary', settings.secondaryColor);
        root.style.setProperty('--secondary-foreground', '#ffffff');
      }
      
      // Apply accent color
      if (settings.accentColor) {
        root.style.setProperty('--accent', settings.accentColor);
        root.style.setProperty('--accent-foreground', '#ffffff');
      }
    }
  }, [settings]);
  
  return (
    <CompanyThemeContext.Provider value={{ settings, isLoading, error }}>
      {children}
    </CompanyThemeContext.Provider>
  );
}

export function useCompanyTheme() {
  const context = useContext(CompanyThemeContext);
  if (!context) {
    throw new Error("useCompanyTheme must be used within a CompanyThemeProvider");
  }
  return context;
}