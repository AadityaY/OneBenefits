import { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn } from "@/lib/queryClient";
import { CompanySettings } from "@shared/schema";

type CompanyThemeContextType = {
  companySettings: CompanySettings | null;
  isLoading: boolean;
};

export const CompanyThemeContext = createContext<CompanyThemeContextType | null>(null);

export function CompanyThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Only fetch company settings if user is logged in
  const enabled = !!user;
  const companyId = user?.companyId;
  
  const {
    data: companySettings,
    isLoading,
  } = useQuery<CompanySettings | null>({
    queryKey: ["/api/company-settings", companyId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled,
  });

  // Apply theme colors when settings change
  useEffect(() => {
    if (companySettings) {
      // Apply primary color
      if (companySettings.primaryColor) {
        document.documentElement.style.setProperty('--primary', companySettings.primaryColor);
        document.documentElement.style.setProperty('--primary-foreground', '#ffffff'); // Assuming white text on primary color
      }
      
      // Apply secondary color
      if (companySettings.secondaryColor) {
        document.documentElement.style.setProperty('--secondary', companySettings.secondaryColor);
        document.documentElement.style.setProperty('--secondary-foreground', '#ffffff');
      }
      
      // Apply accent color
      if (companySettings.accentColor) {
        document.documentElement.style.setProperty('--accent', companySettings.accentColor);
        document.documentElement.style.setProperty('--accent-foreground', '#ffffff');
      }
    }
  }, [companySettings]);

  return (
    <CompanyThemeContext.Provider
      value={{
        companySettings: companySettings || null,
        isLoading,
      }}
    >
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