# Theme Components

Light/Dark theme support using `next-themes`.

## Components

### ThemeToggle

A simple button to toggle between light and dark themes.

```tsx
import { ThemeToggle } from '@/components/theme';

export function Header() {
  return (
    <header>
      <h1>My App</h1>
      <ThemeToggle />
    </header>
  );
}
```

### ThemeSelector

A more advanced selector with light/dark/system options.

```tsx
import { ThemeSelector } from '@/components/theme';

export function Settings() {
  return (
    <div>
      <h2>Theme Settings</h2>
      <ThemeSelector />
    </div>
  );
}
```

## Hook Usage

Use the `useTheme` hook to access and control theme state:

```tsx
'use client';

import { useTheme } from '@/hooks/useTheme';

export function MyComponent() {
  const { theme, setTheme, systemTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>System theme: {systemTheme}</p>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  );
}
```

## Configuration

Theme configuration is in `src/lib/config/theme-config.ts`:

```ts
export const themeConfig = {
  defaultTheme: 'system',
  enableSystem: true,
  disableTransitionOnChange: false,
  storageKey: 'chat-app-theme',
  themes: ['light', 'dark', 'system'],
};
```

## CSS Variables

The app uses CSS variables for theming. All theme colors are defined in `src/app/globals.css`:

- Light theme: `:root { ... }`
- Dark theme: `.dark { ... }`

Key variables:
- `--background` / `--foreground` - Main bg/text colors
- `--primary` / `--primary-foreground` - Primary brand colors
- `--muted` / `--muted-foreground` - Muted/subdued colors
- `--accent` / `--accent-foreground` - Accent colors
- `--destructive` - Error/danger color
- `--border` / `--input` / `--ring` - UI element colors

## Tailwind Classes

Use Tailwind's theme-aware classes:

```tsx
<div className="bg-background text-foreground">
  <h1 className="text-primary">Heading</h1>
  <p className="text-muted-foreground">Subtitle</p>
</div>
```

Classes automatically switch between light/dark values based on the active theme.

