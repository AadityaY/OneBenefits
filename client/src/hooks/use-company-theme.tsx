import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

// Default colors
const defaultTheme = {
  primaryColor: "#0f766e",
  secondaryColor: "#0369a1",
  accentColor: "#7c3aed",
  name: "Benefits Portal",
  logo: null as string | null,
};

type CompanyTheme = typeof defaultTheme;

// Create context
const CompanyThemeContext = createContext<CompanyTheme>(defaultTheme);

export function CompanyThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<CompanyTheme>(defaultTheme);

  // Fetch company settings
  const { data: settings } = useQuery({
    queryKey: ["/api/company-settings"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/company-settings");
        if (!response.ok) return null;
        return response.json();
      } catch (error) {
        console.error("Failed to fetch company settings:", error);
        return null;
      }
    },
  });

  // Update theme when settings change
  useEffect(() => {
    if (settings) {
      setTheme({
        primaryColor: settings.primaryColor || defaultTheme.primaryColor,
        secondaryColor: settings.secondaryColor || defaultTheme.secondaryColor,
        accentColor: settings.accentColor || defaultTheme.accentColor,
        name: settings.name || defaultTheme.name,
        logo: settings.logo,
      });
    }
  }, [settings]);

  // Apply CSS variables to the document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Set CSS custom properties
    root.style.setProperty("--primary", theme.primaryColor);
    root.style.setProperty("--secondary", theme.secondaryColor);
    root.style.setProperty("--accent", theme.accentColor);

    // Update primary/accent derived colors (using color manipulation)
    // Primary colors with transparency
    root.style.setProperty("--primary-foreground", "#ffffff");
    root.style.setProperty("--primary-hover", adjustColorBrightness(theme.primaryColor, -10));
    
    // Secondary colors with transparency
    root.style.setProperty("--secondary-foreground", "#ffffff");
    root.style.setProperty("--secondary-hover", adjustColorBrightness(theme.secondaryColor, -10));
    
    // Accent colors with transparency
    root.style.setProperty("--accent-foreground", "#ffffff");
    root.style.setProperty("--accent-hover", adjustColorBrightness(theme.accentColor, -10));
    
  }, [theme]);

  return (
    <CompanyThemeContext.Provider value={theme}>
      {children}
    </CompanyThemeContext.Provider>
  );
}

export function useCompanyTheme() {
  return useContext(CompanyThemeContext);
}

// Helper function to adjust color brightness
function adjustColorBrightness(color: string, percent: number): string {
  // Convert hex to RGB
  let r = parseInt(color.substring(1, 3), 16);
  let g = parseInt(color.substring(3, 5), 16);
  let b = parseInt(color.substring(5, 7), 16);

  // Adjust brightness
  r = Math.max(0, Math.min(255, r + (r * percent / 100)));
  g = Math.max(0, Math.min(255, g + (g * percent / 100)));
  b = Math.max(0, Math.min(255, b + (b * percent / 100)));

  // Convert back to hex
  return "#" + 
    Math.round(r).toString(16).padStart(2, '0') +
    Math.round(g).toString(16).padStart(2, '0') +
    Math.round(b).toString(16).padStart(2, '0');
}