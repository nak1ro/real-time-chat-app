// Socket.IO configuration
import { env } from '@/config/env';

export const socketConfig = {
  // Server URL
  url: env.socketUrl,

  // Connection options
  options: {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'] as ('websocket' | 'polling')[],
  },

  // Heartbeat interval (ms) - must be LESS than backend's HEARTBEAT_TIMEOUT_MS (30s)
  // Using 20s to give buffer for network latency
  heartbeatInterval: 20000,

  // Reconnect delay after auth change (ms)
  authReconnectDelay: 100,
} as const;

