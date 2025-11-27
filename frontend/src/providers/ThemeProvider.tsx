'use client';

// Theme provider using next-themes for light/dark mode support
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';
import { themeConfig } from '@/lib/config/theme-config';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={themeConfig.defaultTheme}
      enableSystem={themeConfig.enableSystem}
      disableTransitionOnChange={themeConfig.disableTransitionOnChange}
      storageKey={themeConfig.storageKey}
      themes={themeConfig.themes as unknown as string[]}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

