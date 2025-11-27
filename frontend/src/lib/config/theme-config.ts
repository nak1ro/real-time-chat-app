// Theme configuration

export const themeConfig = {
  // Default theme (light, dark, or system)
  defaultTheme: 'system' as const,
  
  // Enable system theme detection
  enableSystem: true,
  
  // Disable transition on theme change (prevents flash)
  disableTransitionOnChange: false,
  
  // Storage key for theme preference
  storageKey: 'chat-app-theme',
  
  // Available themes
  themes: ['light', 'dark', 'system'] as const,
} as const;

export type Theme = (typeof themeConfig.themes)[number];

