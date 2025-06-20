import { io, type Socket } from 'socket.io-client';
import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export interface GameState {
	roomId: string;
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
	defenderTerritory: string; // The territory being attacked
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
}

export interface TurnResult {
	round: number;
	turn: number;
	playerId: string;
	duel: Duel;
	result: DuelResult;
	completed: boolean;
}

export interface GameRoom {
	id: string;
	players: Player[];
	maxPlayers: number;
	status: 'waiting' | 'playing' | 'finished';
	createdAt: Date;
}

// Create reactive stores
export const gameState = writable<GameState | null>(null);
export const isConnected = writable<boolean>(false);

// Debug logging function - will be set by DebugPanel component
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

class SocketService {
	private socket: Socket | null = null;
	public playerId: string | null = null;

	connect() {
		if (!browser || this.socket) return;

		this.socket = io('http://localhost:3001', {
			transports: ['websocket']
		});

		this.socket.on('connect', () => {
			isConnected.set(true);
			this.playerId = this.socket?.id || null;
			log('info', 'Connected to game server', { socketId: this.playerId });
		});

		this.socket.on('disconnect', () => {
			isConnected.set(false);
			log('warn', 'Disconnected from game server');
		});

		this.socket.on('gameState', (state: GameState) => {
			const previousState = gameState;
			gameState.set(state);
			log('debug', 'Game state received', {
				phase: state.phase,
				round: state.round,
				turn: state.turn,
				players: state.players.length,
				territories: Object.keys(state.territories || {}).length,
				territoryList: Object.keys(state.territories || {})
			});
		});

		this.socket.on('playerId', (id: string) => {
			this.playerId = id;
			log('debug', 'Player ID received', { playerId: id });
		});

		this.socket.on('error', (error: string) => {
			log('error', 'Socket error', { error });
		});
	}

	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
			isConnected.set(false);
		}
	}

	joinRoom(roomId: string, playerName: string) {
		if (!this.socket) return;
		this.socket.emit('joinRoom', { roomId, playerName });
	}

	createRoom(playerName: string, aiPlayerCount: number = 2) {
		if (!this.socket) return;
		log('info', 'Creating room', { playerName, aiPlayerCount });
		this.socket.emit('createRoom', { playerName, aiPlayerCount });
	}

	submitAnswer(answer: number | string) {
		if (!this.socket) return;
		this.socket.emit('submitAnswer', { answer, timestamp: Date.now() });
	}

	readyUp() {
		if (!this.socket) return;
		this.socket.emit('playerReady');
	}

	addAIPlayer() {
		if (!this.socket) return;
		this.socket.emit('addAIPlayer');
	}

	selectTerritory(targetTerritoryId: string) {
		if (!this.socket) return;
		log('info', 'Territory selected for attack', { targetTerritoryId });
		this.socket.emit('selectTerritory', { targetTerritoryId });
	}

	submitDuelAnswer(answer: number | string) {
		if (!this.socket) return;
		log('info', 'Duel answer submitted', { answer });
		this.socket.emit('submitDuelAnswer', { answer, timestamp: Date.now() });
	}
}

export const socketService = new SocketService();