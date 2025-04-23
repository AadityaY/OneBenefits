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

  // Convert HEX color to HSL string for CSS variables
  function hexToHSL(hex: string): string {
    // Remove the # if present
    hex = hex.replace(/^#/, '');
    
    // Parse the hex values
    let r = parseInt(hex.slice(0, 2), 16) / 255;
    let g = parseInt(hex.slice(2, 4), 16) / 255;
    let b = parseInt(hex.slice(4, 6), 16) / 255;
    
    // Find the max and min values to compute the lightness
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    // Calculate the HSL values
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      
      h = Math.round(h * 60);
    }
    
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
  }
  
  // Apply CSS variables to the document root
  useEffect(() => {
    const root = document.documentElement;
    
    try {
      // Convert HEX colors to HSL format for CSS variables
      const primaryHSL = hexToHSL(theme.primaryColor);
      const secondaryHSL = hexToHSL(theme.secondaryColor);
      const accentHSL = hexToHSL(theme.accentColor);
      
      // Set the primary color theme
      root.style.setProperty("--primary", primaryHSL);
      root.style.setProperty("--primary-foreground", "0 0% 100%");
      
      // Set the secondary color theme
      root.style.setProperty("--secondary", secondaryHSL);
      root.style.setProperty("--secondary-foreground", "0 0% 100%");
      
      // Set the accent color theme
      root.style.setProperty("--accent", accentHSL);
      root.style.setProperty("--accent-foreground", "0 0% 100%");
      
      // Also update button hover states
      document.body.style.setProperty("--primary-color", theme.primaryColor);
      document.body.style.setProperty("--secondary-color", theme.secondaryColor);
      document.body.style.setProperty("--accent-color", theme.accentColor);
    } catch (error) {
      console.error("Failed to apply theme colors:", error);
    }
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