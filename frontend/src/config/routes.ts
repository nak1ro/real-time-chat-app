// Centralized route path constants

// Public routes (no authentication required)
export const publicRoutes = {
  home: '/',
  auth: '/auth',
  login: '/login',
  register: '/register',
} as const;

// Protected routes (authentication required)
export const protectedRoutes = {
  dashboard: '/dashboard',
  chat: '/chat',
  settings: '/settings',
  notifications: '/notifications',
} as const;

// Dynamic routes helpers
export const dynamicRoutes = {
  conversation: (id: string) => `/chat/${id}`,
  userProfile: (userId: string) => `/users/${userId}`,
} as const;

// All routes combined
export const routes = {
  ...publicRoutes,
  ...protectedRoutes,
  dynamic: dynamicRoutes,
} as const;

// Default redirects
export const DEFAULT_LOGIN_REDIRECT = protectedRoutes.dashboard;
export const DEFAULT_LOGOUT_REDIRECT = publicRoutes.auth;
