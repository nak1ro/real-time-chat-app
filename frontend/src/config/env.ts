// Environment configuration - reads and validates environment variables

export const env = {
  // Backend API base URL
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',

  // Socket.IO server URL
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',

  // App environment
  nodeEnv: process.env.NODE_ENV || 'development',

  // Is production environment
  isProd: process.env.NODE_ENV === 'production',

  // Is development environment
  isDev: process.env.NODE_ENV === 'development',
} as const;
