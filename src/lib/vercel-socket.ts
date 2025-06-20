// Vercel-compatible socket service using HTTP polling and Server-Sent Events
import { writable } from 'svelte/store';

// Re-export all interfaces from the original socket for compatibility
export interface GameState {
	id?: string;
	roomId?: string;
	players: Player[];
	currentQuestion?: Question;
	phase: 'waiting' | 'territory_selection' | 'duel' | 'results' | 'finished';
	timeRemaining: number;
	round: number;
	turn: number;
	currentPlayerIndex: number;
	scores: Record<string, number>;
	playerAnswers?: Record<string, PlayerAnswer>;
	territories: Record<string, string>; // territoryId -> playerId
	gameSettings: GameSettings;
	turnHistory: TurnResult[];
	currentDuel?: Duel;
}

export interface Player {
	id: string;
	name: string;
	isReady: boolean;
	territories: string[];
	rank: number;
	color: 'blue' | 'red' | 'gold';
	capitalCity: string;
}

export interface PlayerAnswer {
	playerId: string;
	answer: number;
	isCorrect: boolean;
	timestamp: number;
}

export interface Question {
	id: string;
	text: string;
	options: string[];
	correctAnswer: number;
	category: string;
	difficulty: 'easy' | 'medium' | 'hard';
	numericalAnswer?: number;
	type: 'multiple_choice' | 'numerical';
}

export interface GameSettings {
	maxRounds: number;
	turnsPerPlayerPerRound: number;
	baseScore: number;
	attackWinPoints: number;
	defenseWinPoints: number;
}

export interface Duel {
	attackerId: string;
	defenderId: string;
	attackerTerritory?: string;
	defenderTerritory: string;
	question: Question;
	tiebreaker?: Question;
	result?: DuelResult;
}

export interface DuelResult {
	winner: string;
	attackerAnswer?: PlayerAnswer;
	defenderAnswer?: PlayerAnswer;
	territoryConquered?: string;
	pointsAwarded: Record<string, number>;
	resolutionDetails?: any;
}

export interface TurnResult {
	round: number;
	turn: number;
	playerId: string;
	duel: Duel;
	result: DuelResult;
	completed: boolean;
}

export const gameState = writable<GameState | null>(null);
export const isConnected = writable<boolean>(false);

const API_BASE = typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
  ? `${window.location.origin}/api`
  : '/api';

// Debug logging function
let debugLogger: ((level: string, message: string, data?: any) => void) | null = null;
export function setDebugLogger(logger: (level: string, message: string, data?: any) => void) {
  debugLogger = logger;
}

function log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any) {
  console.log(`[${level.toUpperCase()}] ${message}`, data || '');
  if (debugLogger) {
    debugLogger(level, message, data);
  }
}

class VercelSocketService {
  private playerId: string | null = null;
  private roomId: string | null = null;
  private pollInterval: number | null = null;
  private eventSource: EventSource | null = null;

  async connect() {
    isConnected.set(true);
    log('info', 'Connected to Vercel API');
  }

  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    isConnected.set(false);
    log('warn', 'Disconnected from Vercel API');
  }

  async createRoom(playerName: string, aiPlayerCount: number = 2) {
    try {
      const response = await fetch(`${API_BASE}/game?action=createRoom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, aiPlayerCount })
      });

      const data = await response.json();
      this.playerId = data.playerId;
      this.roomId = data.room.id;
      
      gameState.set(data.room);
      this.startPolling();
      
      log('info', 'Room created', { roomId: this.roomId, playerId: this.playerId });
    } catch (error) {
      log('error', 'Failed to create room', error);
    }
  }

  async joinRoom(roomId: string, playerName: string) {
    try {
      const response = await fetch(`${API_BASE}/game?action=joinRoom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerName, playerId: this.playerId })
      });

      const data = await response.json();
      this.playerId = data.playerId;
      this.roomId = roomId;
      
      gameState.set(data.room);
      this.startPolling();
      
      log('info', 'Joined room', { roomId, playerId: this.playerId });
    } catch (error) {
      log('error', 'Failed to join room', error);
    }
  }

  async readyUp() {
    if (!this.roomId || !this.playerId) return;

    try {
      const response = await fetch(`${API_BASE}/game?action=playerReady`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: this.roomId, playerId: this.playerId })
      });

      const room = await response.json();
      gameState.set(room);
      log('info', 'Player ready');
    } catch (error) {
      log('error', 'Failed to ready up', error);
    }
  }

  async selectTerritory(targetTerritoryId: string) {
    if (!this.roomId || !this.playerId) return;

    try {
      const response = await fetch(`${API_BASE}/game?action=selectTerritory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId: this.roomId, 
          playerId: this.playerId, 
          targetTerritoryId 
        })
      });

      const room = await response.json();
      gameState.set(room);
      log('info', 'Territory selected', { targetTerritoryId });
    } catch (error) {
      log('error', 'Failed to select territory', error);
    }
  }

  async submitDuelAnswer(answer: number | string) {
    if (!this.roomId || !this.playerId) return;

    try {
      const response = await fetch(`${API_BASE}/game?action=submitAnswer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId: this.roomId, 
          playerId: this.playerId, 
          answer,
          timestamp: Date.now()
        })
      });

      const room = await response.json();
      gameState.set(room);
      log('info', 'Answer submitted', { answer });
    } catch (error) {
      log('error', 'Failed to submit answer', error);
    }
  }

  async addAIPlayer() {
    // AI players are added during room creation in this version
    log('info', 'AI players added during room creation');
  }

  submitAnswer(answer: number | string) {
    // For compatibility with existing code
    this.submitDuelAnswer(answer);
  }

  private startPolling() {
    if (!this.roomId) return;

    // Poll for game state updates every 1 second
    this.pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/game?action=gameState&roomId=${this.roomId}`);
        const room = await response.json();
        
        if (room) {
          gameState.set(room);
        }
      } catch (error) {
        log('error', 'Polling failed', error);
      }
    }, 1000) as any;
  }

  // Optional: Use Server-Sent Events for real-time updates (more efficient than polling)
  private startSSE() {
    if (!this.roomId) return;

    this.eventSource = new EventSource(`${API_BASE}/sse?roomId=${this.roomId}`);
    
    this.eventSource.onmessage = (event) => {
      const room = JSON.parse(event.data);
      gameState.set(room);
      log('debug', 'SSE update received');
    };

    this.eventSource.onerror = () => {
      log('error', 'SSE connection failed, falling back to polling');
      this.startPolling();
    };
  }
}

export const socketService = new VercelSocketService();