// Smart socket service that chooses WebSocket for local, Vercel for production
import { browser } from '$app/environment';

// Detect environment
const isLocalDevelopment = browser && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' ||
  window.location.port === '5173' ||
  window.location.port === '5174' ||
  window.location.port === '5175'
);

console.log('🔧 Smart Socket Detection:', {
  isLocalDevelopment,
  hostname: browser ? window.location.hostname : 'SSR',
  port: browser ? window.location.port : 'SSR'
});

// Import both modules and conditionally export
import * as socketModule from './socket.js';
import * as vercelModule from './vercel-socket.js';

// Choose the appropriate module
const chosenModule = isLocalDevelopment ? socketModule : vercelModule;

if (isLocalDevelopment) {
  console.log('📡 Using WebSocket service for local development');
} else {
  console.log('☁️ Using Vercel HTTP service for production');
}

// Re-export everything from the chosen module
export const socketService = chosenModule.socketService;
export const gameState = chosenModule.gameState;
export const isConnected = chosenModule.isConnected;
export const setDebugLogger = chosenModule.setDebugLogger;

// Re-export types (use vercel types as they're the same)
export type {
  GameState,
  Player,
  Question,
  GameSettings,
  Duel,
  DuelResult,
  TurnResult,
  PlayerAnswer
} from './vercel-socket.js';