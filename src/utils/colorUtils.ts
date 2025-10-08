/**
 * Color utility functions for dynamic text visibility
 */

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate the luminance of a color (0 = black, 1 = white)
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Check if a color is dark (returns true if dark, false if light)
 */
export function isDarkColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance < 0.5; // Threshold for dark vs light
}

/**
 * Get text color classes based on background color
 */
export function getTextColorClasses(backgroundColor: string) {
  const isDark = isDarkColor(backgroundColor);
  
  return {
    primary: isDark ? 'text-white' : 'text-gray-900',
    secondary: isDark ? 'text-gray-200' : 'text-gray-600',
    tertiary: isDark ? 'text-gray-300' : 'text-gray-500',
    muted: isDark ? 'text-gray-400' : 'text-gray-400',
    success: isDark ? 'text-green-300' : 'text-green-600',
    error: isDark ? 'text-red-300' : 'text-red-600',
    warning: isDark ? 'text-yellow-300' : 'text-yellow-600',
    info: isDark ? 'text-blue-300' : 'text-blue-600',
  };
}

/**
 * Get hover text color classes based on background color
 */
export function getHoverTextColorClasses(backgroundColor: string) {
  const isDark = isDarkColor(backgroundColor);
  
  return {
    primary: isDark ? 'hover:text-gray-100' : 'hover:text-gray-800',
    secondary: isDark ? 'hover:text-gray-100' : 'hover:text-gray-700',
    tertiary: isDark ? 'hover:text-gray-200' : 'hover:text-gray-600',
  };
}

/**
 * Get border color classes based on background color
 */
export function getBorderColorClasses(backgroundColor: string) {
  const isDark = isDarkColor(backgroundColor);
  
  return {
    default: isDark ? 'border-gray-600' : 'border-gray-300',
    light: isDark ? 'border-gray-700' : 'border-gray-200',
    lighter: isDark ? 'border-gray-800' : 'border-gray-100',
  };
}

/**
 * Get background color classes for cards/components based on main background
 */
export function getCardBackgroundClasses(backgroundColor: string) {
  const isDark = isDarkColor(backgroundColor);
  
  return {
    card: isDark ? 'bg-gray-800' : 'bg-gray-50',
    cardHover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
    input: isDark ? 'bg-gray-700' : 'bg-white',
    inputFocus: isDark ? 'focus:bg-gray-600' : 'focus:bg-white',
  };
}

/**
 * Get icon color classes based on background color
 */
export function getIconColorClasses(backgroundColor: string) {
  const isDark = isDarkColor(backgroundColor);
  
  return {
    default: isDark ? 'text-gray-300' : 'text-gray-400',
    active: isDark ? 'text-white' : 'text-gray-600',
    muted: isDark ? 'text-gray-500' : 'text-gray-400',
  };
}

/**
 * Get a comprehensive color scheme for a background color
 */
export function getColorScheme(backgroundColor: string) {
  return {
    text: getTextColorClasses(backgroundColor),
    hover: getHoverTextColorClasses(backgroundColor),
    border: getBorderColorClasses(backgroundColor),
    background: getCardBackgroundClasses(backgroundColor),
    icon: getIconColorClasses(backgroundColor),
    isDark: isDarkColor(backgroundColor),
  };
}