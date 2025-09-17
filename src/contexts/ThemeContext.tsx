import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  updateTheme: (colors: { primaryColor?: string; secondaryColor?: string; accentColor?: string }) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Function to generate lighter and darker shades from a hex color
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (0 <= h && h < 1/6) {
    r = c; g = x; b = 0;
  } else if (1/6 <= h && h < 2/6) {
    r = x; g = c; b = 0;
  } else if (2/6 <= h && h < 3/6) {
    r = 0; g = c; b = x;
  } else if (3/6 <= h && h < 4/6) {
    r = 0; g = x; b = c;
  } else if (4/6 <= h && h < 5/6) {
    r = x; g = 0; b = c;
  } else if (5/6 <= h && h < 1) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function generateColorShades(baseColor: string) {
  const hsl = hexToHsl(baseColor);
  return {
    base: baseColor,
    hover: hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 10, 0)),
    light: hslToHex(hsl.h, Math.max(hsl.s - 30, 0), Math.min(hsl.l + 40, 95)),
    dark: hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 20, 5))
  };
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { business } = useAuth();
  
  const primaryColor = business?.settings?.primaryColor || '#3B82F6';
  const secondaryColor = business?.settings?.secondaryColor || '#1E40AF';
  const accentColor = business?.settings?.accentColor || '#F59E0B';

  const updateTheme = (colors: { primaryColor?: string; secondaryColor?: string; accentColor?: string }) => {
    console.log('🎨 Updating theme with colors:', colors);
    
    if (colors.primaryColor) {
      const primaryShades = generateColorShades(colors.primaryColor);
      document.documentElement.style.setProperty('--color-primary', primaryShades.base);
      document.documentElement.style.setProperty('--color-primary-hover', primaryShades.hover);
      document.documentElement.style.setProperty('--color-primary-light', primaryShades.light);
      document.documentElement.style.setProperty('--color-primary-dark', primaryShades.dark);
    }
    
    if (colors.secondaryColor) {
      const secondaryShades = generateColorShades(colors.secondaryColor);
      document.documentElement.style.setProperty('--color-secondary', secondaryShades.base);
      document.documentElement.style.setProperty('--color-secondary-hover', secondaryShades.hover);
    }
    
    if (colors.accentColor) {
      const accentShades = generateColorShades(colors.accentColor);
      document.documentElement.style.setProperty('--color-accent', accentShades.base);
      document.documentElement.style.setProperty('--color-accent-hover', accentShades.hover);
    }
  };

  // Update theme when business settings change
  useEffect(() => {
    if (business?.settings) {
      console.log('🎨 Business loaded, updating theme colors:', {
        primary: business.settings.primaryColor,
        secondary: business.settings.secondaryColor,
        accent: business.settings.accentColor
      });
      
      updateTheme({
        primaryColor: business.settings.primaryColor,
        secondaryColor: business.settings.secondaryColor,
        accentColor: business.settings.accentColor
      });
    }
  }, [business?.settings?.primaryColor, business?.settings?.secondaryColor, business?.settings?.accentColor]);

  return (
    <ThemeContext.Provider value={{
      primaryColor,
      secondaryColor,
      accentColor,
      updateTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};