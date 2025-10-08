import { useMemo } from 'react';
import { getColorScheme } from '../utils/colorUtils';

/**
 * Hook to get color scheme based on current store background color
 */
export function useColorScheme(backgroundColor?: string) {
  // Default background color if none provided
  const defaultBackgroundColor = '#ffffff';
  
  const currentBackgroundColor = backgroundColor || defaultBackgroundColor;
  
  const colorScheme = useMemo(() => {
    return getColorScheme(currentBackgroundColor);
  }, [currentBackgroundColor]);
  
  return colorScheme;
}