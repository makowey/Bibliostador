import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { questions, getRandomQuestion, getRandomQuestionByType } from './data.js';

const httpServer = createServer();
const io = new Server(httpServer, {
	cors: {
		origin: "http://localhost:5173",
		methods: ["GET", "POST"]
	}
});

const gameRooms = new Map();
const players = new Map();
const aiPlayers = new Map(); // Track AI players

const aiNames = [
	'David the Shepherd', 'Moses the Lawgiver', 'Joshua the Conqueror',
	'Solomon the Wise', 'Deborah the Judge', 'Samuel the Prophet',
	'Elijah the Prophet', 'Daniel the Interpreter', 'Esther the Queen'
];

// Questions are now imported from data.ts - 100 comprehensive Bible questions

const capitalCities = ['jerusalem', 'samaria', 'gaza'];
const playerColors = ['blue', 'red', 'gold'];

// Game configuration
const gameSettings = {
	maxRounds: 3,
	turnsPerPlayerPerRound: 3,
	baseScore: 1000,
	attackWinPoints: 200,
	defenseWinPoints: 100
};

// Territory groups: each player gets 1 capital + 3 adjacent territories
const territoryGroups = {
	// Player 1 (Blue) - Southern Kingdom with Jerusalem as capital
	blue: {
		capital: 'jerusalem',
		adjacent: ['judah', 'benjamin', 'simeon']
	},
	// Player 2 (Red) - Central Kingdom with Samaria as capital  
	red: {
		capital: 'samaria',
		adjacent: ['ephraim', 'manasseh', 'dan']
	},
	// Player 3 (Gold) - Northern Kingdom with Gaza as capital
	gold: {
		capital: 'gaza', 
		adjacent: ['galilee', 'asher', 'nafali']
	}
};

// Territory adjacency map - defines which territories border each other
const territoryAdjacency = {
	// Blue territories (Southern Kingdom)
	jerusalem: ['samaria', 'judah', 'benjamin'],
	judah: ['jerusalem', 'benjamin', 'simeon', 'gaza'],
	benjamin: ['jerusalem', 'judah', 'ephraim', 'dan'],
	simeon: ['judah', 'gaza', 'dan'],
	
	// Red territories (Central Kingdom)
	samaria: ['jerusalem', 'ephraim', 'manasseh', 'galilee'],
	ephraim: ['samaria', 'benjamin', 'manasseh', 'dan'],
	manasseh: ['samaria', 'ephraim', 'galilee', 'asher'],
	dan: ['benjamin', 'ephraim', 'simeon', 'gaza'],
	
	// Gold territories (Northern Kingdom)
	gaza: ['judah', 'simeon', 'dan', 'galilee'],
	galilee: ['samaria', 'manasseh', 'gaza', 'asher', 'nafali'],
	asher: ['manasseh', 'galilee', 'nafali'],
	nafali: ['galilee', 'asher']
};

// Initialize territories - 4 per player (1 capital + 3 adjacent), no neutrals
const initializeTerritories = (players) => {
	const territories = {};
	
	players.forEach((player, playerIndex) => {
		const playerColor = player.color;
		const territoryGroup = territoryGroups[playerColor];
		
		if (territoryGroup) {
			// Assign capital
			territories[territoryGroup.capital] = player.id;
			
			// Assign adjacent territories
			territoryGroup.adjacent.forEach(territoryId => {
				territories[territoryId] = player.id;
			});
		}
	});
	
	console.log('Initialized territories:', territories);
	return territories;
};

// Get territories that a player can attack (adjacent to their territories)
function getAttackableTerritories(room, playerId) {
	const playerTerritories = Object.keys(room.territories).filter(
		territoryId => room.territories[territoryId] === playerId
	);
	
	const attackableSet = new Set();
	
	// For each territory the player owns, find adjacent territories owned by others
	playerTerritories.forEach(playerTerritory => {
		const adjacentTerritories = territoryAdjacency[playerTerritory] || [];
		adjacentTerritories.forEach(adjacentTerritory => {
			const owner = room.territories[adjacentTerritory];
			// Can attack if territory is owned by someone else
			if (owner && owner !== playerId) {
				attackableSet.add(adjacentTerritory);
			}
		});
	});
	
	return Array.from(attackableSet);
}

// Get the owner of a territory
function getTerritoryOwner(room, territoryId) {
	return room.territories[territoryId] || null;
}

// AI Player Logic
function createAIPlayer(roomId) {
	const aiId = `ai_${uuidv4().substring(0, 8)}`;
	const aiName = aiNames[Math.floor(Math.random() * aiNames.length)];
	
	console.log(`Attempting to create AI player ${aiName} for room ${roomId}`);
	
	const room = joinGameRoom(roomId, aiId, aiName);
	if (!room) {
		console.log(`Failed to join AI player ${aiName} to room ${roomId}`);
		return null;
	}
	
	players.set(aiId, { name: aiName, roomId, isAI: true });
	aiPlayers.set(aiId, {
		id: aiId,
		name: aiName,
		roomId: roomId,
		intelligence: Math.random() * 0.4 + 0.4, // 40-80% chance of correct answer
		responseTime: Math.random() * 8 + 2 // 2-10 seconds response time
	});
	
	console.log(`AI player ${aiName} successfully joined room ${roomId}. Room now has ${room.players.length} players`);
	
	// AI automatically gets ready after 1-3 seconds
	setTimeout(() => {
		console.log(`AI player ${aiName} getting ready...`);
		aiReadyUp(aiId);
	}, Math.random() * 2000 + 1000);
	
	return aiId;
}

function aiReadyUp(aiId) {
	const player = players.get(aiId);
	if (!player) return;
	
	const room = gameRooms.get(player.roomId);
	if (!room) return;
	
	const roomPlayer = room.players.find(p => p.id === aiId);
	if (roomPlayer) {
		roomPlayer.isReady = true;
		io.to(player.roomId).emit('gameState', room);
		
		const allReady = room.players.every(p => p.isReady);
		if (allReady && room.players.length >= 2) {
			startGame(player.roomId);
		}
	}
}


function addAIPlayersToRoom(roomId, aiPlayerCount = 2) {
	const room = gameRooms.get(roomId);
	if (!room) {
		console.log(`Room ${roomId} not found when trying to add AI players`);
		return;
	}
	
	console.log(`Adding ${aiPlayerCount} AI players to room ${roomId}. Current players: ${room.players.length}`);
	
	// Add specified number of AI players (max to fill room)
	const maxAIPlayers = Math.min(aiPlayerCount, 3 - room.players.length);
	
	for (let i = 0; i < maxAIPlayers; i++) {
		const aiId = createAIPlayer(roomId);
		if (aiId) {
			console.log(`Successfully added AI player ${i + 1}/${maxAIPlayers}`);
		}
	}
	
	const updatedRoom = gameRooms.get(roomId);
	console.log(`Room ${roomId} now has ${updatedRoom.players.length} players total`);
	io.to(roomId).emit('gameState', updatedRoom);
}

function createGameRoom(playerId, playerName) {
	const roomId = uuidv4().substring(0, 6).toUpperCase();
	const room = {
		id: roomId,
		players: [{
			id: playerId,
			name: playerName,
			isReady: false,
			territories: [],
			rank: 1,
			color: playerColors[0],
			capitalCity: capitalCities[0]
		}],
		maxPlayers: 3,
		status: 'waiting',
		createdAt: new Date(),
		currentQuestion: null,
		phase: 'waiting',
		timeRemaining: 0,
		round: 1,
		turn: 1,
		currentPlayerIndex: 0,
		scores: { [playerId]: gameSettings.baseScore },
		playerAnswers: {},
		territories: {},
		gameSettings: gameSettings,
		turnHistory: [],
		currentDuel: null
	};

	gameRooms.set(roomId, room);
	return room;
}

function joinGameRoom(roomId, playerId, playerName) {
	const room = gameRooms.get(roomId);
	if (!room || room.players.length >= room.maxPlayers) {
		return null;
	}

	const playerIndex = room.players.length;
	room.players.push({
		id: playerId,
		name: playerName,
		isReady: false,
		territories: [],
		rank: playerIndex + 1,
		color: playerColors[playerIndex],
		capitalCity: capitalCities[playerIndex]
	});

	room.scores[playerId] = gameSettings.baseScore;
	return room;
}

function startGame(roomId) {
	const room = gameRooms.get(roomId);
	if (!room) return;

	// Distribute territories among players
	room.territories = initializeTerritories(room.players);
	
	// Update player territories
	room.players.forEach((player) => {
		player.territories = Object.keys(room.territories).filter(
			territoryId => room.territories[territoryId] === player.id
		);
	});

	room.status = 'playing';
	room.phase = 'territory_selection';
	room.round = 1;
	room.turn = 1;
	room.currentPlayerIndex = 0;
	room.timeRemaining = 30; // Time to select target territory

	console.log(`Game started in room ${roomId}. Player ${room.players[0].name} goes first.`);
	
	// Handle AI player turn if first player is AI
	const firstPlayer = room.players[0];
	if (players.get(firstPlayer.id)?.isAI) {
		setTimeout(() => {
			aiSelectTerritory(firstPlayer.id);
		}, 2000); // AI thinks for 2 seconds
	}

	// Start territory selection timer
	startTerritorySelectionTimer(roomId);
	
	io.to(roomId).emit('gameState', room);
}

// Use the imported question functions from data.ts
function getRandomQuestionForDuel() {
	return getRandomQuestion();
}

function getRandomNumericalQuestion() {
	return getRandomQuestionByType('numerical');
}

function getRandomTextQuestion() {
	return getRandomQuestionByType('text');
}

function startDuel(roomId, attackerId, targetTerritoryId) {
	const room = gameRooms.get(roomId);
	if (!room) return;

	// Determine defender from territory ownership
	const defenderId = getTerritoryOwner(room, targetTerritoryId);
	if (!defenderId) {
		console.log(`No owner found for territory ${targetTerritoryId}`);
		return;
	}

	const question = getRandomQuestionForDuel();
	room.currentDuel = {
		attackerId: attackerId,
		defenderId: defenderId,
		attackerTerritory: null, // Will be set if attacker wins
		defenderTerritory: targetTerritoryId,
		question: question
	};

	room.phase = 'duel';
	room.currentQuestion = question;
	room.timeRemaining = 20; // Increased from 15 to 20 seconds
	room.duelStartTime = Date.now(); // Track when duel started
	room.playerAnswers = {};

	console.log(`Duel started between ${attackerId} and ${defenderId} for territory ${targetTerritoryId} in room ${roomId}`);
	
	// Schedule AI answers if needed
	const humanPlayerInDuel = room.players.some(p => 
		(p.id === attackerId || p.id === defenderId) && !players.get(p.id)?.isAI
	);
	
	[attackerId, defenderId].forEach(playerId => {
		if (players.get(playerId)?.isAI) {
			const aiPlayer = aiPlayers.get(playerId);
			if (aiPlayer) {
				// Give human players more time when they're in a duel
				const responseDelay = humanPlayerInDuel ? 
					Math.max(8000, aiPlayer.responseTime * 1000) : // Minimum 8 seconds with humans
					aiPlayer.responseTime * 1000; // Normal timing for AI vs AI
					
				setTimeout(() => {
					aiAnswerDuel(playerId);
				}, responseDelay);
			}
		}
	});

	io.to(roomId).emit('gameState', room);
	startDuelTimer(roomId);
}

function startDuelTimer(roomId) {
	const room = gameRooms.get(roomId);
	if (!room) return;

	const timer = setInterval(() => {
		room.timeRemaining--;
		io.to(roomId).emit('gameState', room);

		if (room.timeRemaining <= 0) {
			clearInterval(timer);
			processDuelResult(roomId);
		}
	}, 1000);
}

function startTerritorySelectionTimer(roomId) {
	const room = gameRooms.get(roomId);
	if (!room) return;

	const currentPlayer = room.players[room.currentPlayerIndex];
	const isAIPlayer = players.get(currentPlayer.id)?.isAI;

	const timer = setInterval(() => {
		if (room.phase !== 'territory_selection') {
			clearInterval(timer);
			return;
		}

		room.timeRemaining--;
		io.to(roomId).emit('gameState', room);

		if (room.timeRemaining <= 0) {
			clearInterval(timer);
			
			// Only auto-skip for AI players or if no attackable territories
			if (isAIPlayer) {
				console.log(`Territory selection timeout for AI player ${currentPlayer.name}, skipping turn`);
				nextTurn(roomId);
			} else {
				// For human players, give them more time but warn them
				console.log(`Human player ${currentPlayer.name} is taking a long time, extending timer`);
				room.timeRemaining = 15; // Give 15 more seconds
				io.to(roomId).emit('gameState', room);
			}
		}
	}, 1000);
}

function aiAnswerDuel(aiId) {
	const player = players.get(aiId);
	const aiPlayer = aiPlayers.get(aiId);
	if (!player || !aiPlayer) return;

	const room = gameRooms.get(player.roomId);
	if (!room || room.phase !== 'duel' || !room.currentQuestion) return;

	// Check if AI already answered
	if (room.playerAnswers[aiId]) return;

	let answer;
	if (room.currentQuestion.type === 'multiple_choice') {
		if (Math.random() < aiPlayer.intelligence) {
			// AI answers correctly
			answer = room.currentQuestion.correctAnswer;
		} else {
			// AI answers incorrectly (random wrong answer)
			const wrongAnswers = [0, 1, 2, 3].filter(i => i !== room.currentQuestion.correctAnswer);
			answer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
		}
	} else if (room.currentQuestion.type === 'text') {
		if (Math.random() < aiPlayer.intelligence) {
			// AI answers correctly
			answer = room.currentQuestion.textAnswer;
		} else {
			// AI answers incorrectly (common wrong biblical names)
			const wrongAnswers = ['Moses', 'David', 'Abraham', 'Solomon', 'Paul', 'Peter'];
			answer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
		}
	} else if (room.currentQuestion.type === 'numerical') {
		// Handle numerical questions (already handled separately)
		answer = room.currentQuestion.numericalAnswer;
	}

	// Submit AI answer
	let isCorrect = false;
	if (room.currentQuestion.type === 'multiple_choice') {
		isCorrect = room.currentQuestion.correctAnswer === answer;
	} else if (room.currentQuestion.type === 'text') {
		const correctText = room.currentQuestion.textAnswer.toLowerCase().trim();
		const aiText = String(answer).toLowerCase().trim();
		isCorrect = correctText === aiText;
	} else if (room.currentQuestion.type === 'numerical') {
		isCorrect = false; // Will be calculated in tiebreaker logic
	}
	
	room.playerAnswers[aiId] = {
		playerId: aiId,
		answer: answer,
		isCorrect: isCorrect,
		timestamp: Date.now()
	};

	console.log(`AI ${aiPlayer.name} answered duel: ${answer} (${isCorrect ? 'correct' : 'incorrect'})`);

	// Check if both players answered
	if (Object.keys(room.playerAnswers).length === 2) {
		processDuelResult(player.roomId);
	}
}

function processDuelResult(roomId) {
	const room = gameRooms.get(roomId);
	if (!room || !room.currentDuel) return;

	const { attackerId, defenderId } = room.currentDuel;
	const attackerAnswer = room.playerAnswers[attackerId];
	const defenderAnswer = room.playerAnswers[defenderId];

	const attacker = room.players.find(p => p.id === attackerId);
	const defender = room.players.find(p => p.id === defenderId);

	// Determine winner
	let winner = null;
	let territoryConquered = null;
	const pointsAwarded = {};

	// Build detailed resolution info
	let correctAnswerDisplay;
	if (room.currentQuestion.type === 'multiple_choice') {
		correctAnswerDisplay = room.currentQuestion.options[room.currentQuestion.correctAnswer];
	} else if (room.currentQuestion.type === 'text') {
		correctAnswerDisplay = room.currentQuestion.textAnswer;
	} else if (room.currentQuestion.type === 'numerical') {
		correctAnswerDisplay = room.currentQuestion.numericalAnswer;
	}
	
	let resolutionDetails = {
		questionType: room.currentQuestion.type,
		correctAnswer: correctAnswerDisplay,
		attackerAnswer: attackerAnswer ? attackerAnswer.answer : 'No answer',
		defenderAnswer: defenderAnswer ? defenderAnswer.answer : 'No answer',
		attackerCorrect: attackerAnswer ? attackerAnswer.isCorrect : false,
		defenderCorrect: defenderAnswer ? defenderAnswer.isCorrect : false,
		attackerTime: attackerAnswer ? Math.round((attackerAnswer.timestamp - room.duelStartTime) / 10) / 100 : 'No answer',
		defenderTime: defenderAnswer ? Math.round((defenderAnswer.timestamp - room.duelStartTime) / 10) / 100 : 'No answer'
	};

	if (!attackerAnswer && !defenderAnswer) {
		// Both timeout - defender wins
		winner = defenderId;
		pointsAwarded[defenderId] = gameSettings.defenseWinPoints;
		resolutionDetails.winReason = `${defender?.name} wins by default (both players timed out)`;
	} else if (!attackerAnswer) {
		// Attacker timeout - defender wins
		winner = defenderId;
		pointsAwarded[defenderId] = gameSettings.defenseWinPoints;
		resolutionDetails.winReason = `${defender?.name} wins (${attacker?.name} timed out)`;
	} else if (!defenderAnswer) {
		// Defender timeout - attacker wins
		winner = attackerId;
		pointsAwarded[attackerId] = gameSettings.attackWinPoints;
		territoryConquered = room.currentDuel.defenderTerritory; // Conquer the specific territory being attacked
		resolutionDetails.winReason = `${attacker?.name} wins (${defender?.name} timed out)`;
	} else if (attackerAnswer.isCorrect && !defenderAnswer.isCorrect) {
		// Attacker correct, defender wrong
		winner = attackerId;
		pointsAwarded[attackerId] = gameSettings.attackWinPoints;
		territoryConquered = room.currentDuel.defenderTerritory; // Conquer the specific territory being attacked
		resolutionDetails.winReason = `${attacker?.name} answered correctly, ${defender?.name} was wrong`;
	} else if (!attackerAnswer.isCorrect && defenderAnswer.isCorrect) {
		// Attacker wrong, defender correct
		winner = defenderId;
		pointsAwarded[defenderId] = gameSettings.defenseWinPoints;
		resolutionDetails.winReason = `${defender?.name} answered correctly, ${attacker?.name} was wrong`;
	} else if (attackerAnswer.isCorrect && defenderAnswer.isCorrect) {
		// Both correct - need tiebreaker
		startTiebreaker(roomId);
		return;
	} else {
		// Both wrong - defender wins
		winner = defenderId;
		pointsAwarded[defenderId] = gameSettings.defenseWinPoints;
		resolutionDetails.winReason = `${defender?.name} wins (both answered incorrectly)`;
	}

	// Apply results
	if (territoryConquered) {
		room.territories[territoryConquered] = attackerId;
		// Update player territories
		room.players.forEach(player => {
			player.territories = Object.keys(room.territories).filter(
				territoryId => room.territories[territoryId] === player.id
			);
		});
	}

	// Award points
	Object.keys(pointsAwarded).forEach(playerId => {
		room.scores[playerId] = (room.scores[playerId] || gameSettings.baseScore) + pointsAwarded[playerId];
	});

	// Record turn result
	const turnResult = {
		round: room.round,
		turn: room.turn,
		playerId: attackerId,
		duel: room.currentDuel,
		result: {
			winner: winner,
			attackerAnswer: attackerAnswer,
			defenderAnswer: defenderAnswer,
			territoryConquered: territoryConquered,
			pointsAwarded: pointsAwarded,
			resolutionDetails: resolutionDetails
		},
		completed: true
	};

	room.turnHistory.push(turnResult);
	room.currentDuel.result = turnResult.result;

	console.log(`Duel result: ${resolutionDetails.winReason}. Territory: ${territoryConquered || 'none'}`);

	// Show results phase with details before moving to next turn
	room.phase = 'results';
	room.timeRemaining = 4; // Show results for 4 seconds
	io.to(roomId).emit('gameState', room);

	// Move to next turn after showing results
	setTimeout(() => {
		if (checkGameEnd(room)) {
			endGame(roomId);
			return;
		}
		nextTurn(roomId);
	}, 4000);
}

function selectRandomDefenderTerritory(room, defenderId) {
	const defenderTerritories = Object.keys(room.territories).filter(
		territoryId => room.territories[territoryId] === defenderId
	);
	
	if (defenderTerritories.length === 0) return null;
	
	return defenderTerritories[Math.floor(Math.random() * defenderTerritories.length)];
}

function startTiebreaker(roomId) {
	const room = gameRooms.get(roomId);
	if (!room) return;

	const numericalQuestion = getRandomNumericalQuestion();
	room.currentDuel.tiebreaker = numericalQuestion;
	room.currentQuestion = numericalQuestion;
	room.timeRemaining = 15; // Increased from 10 to 15 seconds
	room.duelStartTime = Date.now(); // Track tiebreaker start time
	room.playerAnswers = {};

	console.log(`Tiebreaker started in room ${roomId}`);
	io.to(roomId).emit('gameState', room);
	
	// Schedule AI tiebreaker answers
	const { attackerId, defenderId } = room.currentDuel;
	const humanPlayerInTiebreaker = room.players.some(p => 
		(p.id === attackerId || p.id === defenderId) && !players.get(p.id)?.isAI
	);
	
	[attackerId, defenderId].forEach(playerId => {
		if (players.get(playerId)?.isAI) {
			const aiPlayer = aiPlayers.get(playerId);
			if (aiPlayer) {
				// Give human players more time in tiebreakers too
				const responseDelay = humanPlayerInTiebreaker ? 
					Math.max(6000, aiPlayer.responseTime * 800) : // Minimum 6 seconds with humans
					aiPlayer.responseTime * 800; // Normal timing for AI vs AI
					
				setTimeout(() => {
					aiAnswerTiebreaker(playerId);
				}, responseDelay);
			}
		}
	});

	startDuelTimer(roomId);
}

function aiAnswerTiebreaker(aiId) {
	const player = players.get(aiId);
	const aiPlayer = aiPlayers.get(aiId);
	if (!player || !aiPlayer) return;

	const room = gameRooms.get(player.roomId);
	if (!room || !room.currentQuestion || room.currentQuestion.type !== 'numerical') return;

	// AI gives a number close to the correct answer with some variance
	const correctAnswer = room.currentQuestion.numericalAnswer;
	const variance = Math.max(1, Math.floor(correctAnswer * 0.2)); // 20% variance
	const aiAnswer = correctAnswer + (Math.random() - 0.5) * variance * 2;
	
	room.playerAnswers[aiId] = {
		playerId: aiId,
		answer: Math.round(aiAnswer),
		isCorrect: false, // Will be calculated in tiebreaker logic
		timestamp: Date.now()
	};

	console.log(`AI ${aiPlayer.name} tiebreaker answer: ${Math.round(aiAnswer)} (correct: ${correctAnswer})`);

	// Check if both players answered
	if (Object.keys(room.playerAnswers).length === 2) {
		processTiebreakerResult(player.roomId);
	}
}

function processTiebreakerResult(roomId) {
	const room = gameRooms.get(roomId);
	if (!room || !room.currentDuel || !room.currentDuel.tiebreaker) return;

	const { attackerId, defenderId } = room.currentDuel;
	const correctAnswer = room.currentDuel.tiebreaker.numericalAnswer;
	const attackerAnswer = room.playerAnswers[attackerId];
	const defenderAnswer = room.playerAnswers[defenderId];

	const attacker = room.players.find(p => p.id === attackerId);
	const defender = room.players.find(p => p.id === defenderId);

	let winner = defenderId; // Default to defender if no answers
	let territoryConquered = null;
	const pointsAwarded = {};

	// Build detailed resolution info
	let resolutionDetails = {
		correctAnswer: correctAnswer,
		attackerAnswer: attackerAnswer ? attackerAnswer.answer : 'No answer',
		defenderAnswer: defenderAnswer ? defenderAnswer.answer : 'No answer',
		attackerTime: attackerAnswer ? Math.round((attackerAnswer.timestamp - room.duelStartTime) / 10) / 100 : 'No answer',
		defenderTime: defenderAnswer ? Math.round((defenderAnswer.timestamp - room.duelStartTime) / 10) / 100 : 'No answer'
	};

	if (attackerAnswer && defenderAnswer) {
		const attackerDiff = Math.abs(attackerAnswer.answer - correctAnswer);
		const defenderDiff = Math.abs(defenderAnswer.answer - correctAnswer);

		resolutionDetails.attackerDiff = attackerDiff;
		resolutionDetails.defenderDiff = defenderDiff;

		if (attackerDiff < defenderDiff) {
			winner = attackerId;
			resolutionDetails.winReason = `${attacker?.name} was closer to the correct answer (off by ${attackerDiff} vs ${defenderDiff})`;
		} else if (defenderDiff < attackerDiff) {
			winner = defenderId;
			resolutionDetails.winReason = `${defender?.name} was closer to the correct answer (off by ${defenderDiff} vs ${attackerDiff})`;
		} else {
			// Same difference - fastest wins
			winner = attackerAnswer.timestamp < defenderAnswer.timestamp ? attackerId : defenderId;
			const winnerName = winner === attackerId ? attacker?.name : defender?.name;
			resolutionDetails.winReason = `Both answers were equally close (off by ${attackerDiff}), ${winnerName} answered faster`;
		}
	} else if (attackerAnswer) {
		winner = attackerId;
		resolutionDetails.attackerDiff = Math.abs(attackerAnswer.answer - correctAnswer);
		resolutionDetails.winReason = `${attacker?.name} was the only one to answer`;
	} else {
		resolutionDetails.winReason = `${defender?.name} wins by default (neither player answered)`;
	}

	// Award points and territory
	if (winner === attackerId) {
		pointsAwarded[attackerId] = gameSettings.attackWinPoints;
		territoryConquered = room.currentDuel.defenderTerritory; // Attack the specific territory
	} else {
		pointsAwarded[defenderId] = gameSettings.defenseWinPoints;
	}

	// Apply results (same logic as regular duel)
	if (territoryConquered) {
		room.territories[territoryConquered] = attackerId;
		room.players.forEach(player => {
			player.territories = Object.keys(room.territories).filter(
				territoryId => room.territories[territoryId] === player.id
			);
		});
	}

	Object.keys(pointsAwarded).forEach(playerId => {
		room.scores[playerId] = (room.scores[playerId] || gameSettings.baseScore) + pointsAwarded[playerId];
	});

	// Complete the turn with detailed resolution
	const turnResult = room.turnHistory[room.turnHistory.length - 1];
	if (turnResult && turnResult.result) {
		turnResult.result.winner = winner;
		turnResult.result.territoryConquered = territoryConquered;
		turnResult.result.pointsAwarded = pointsAwarded;
		turnResult.result.resolutionDetails = resolutionDetails;
		room.currentDuel.result = turnResult.result;
	} else {
		// Create the result directly on currentDuel if turnResult doesn't exist
		room.currentDuel.result = {
			winner: winner,
			territoryConquered: territoryConquered,
			pointsAwarded: pointsAwarded,
			resolutionDetails: resolutionDetails
		};
	}

	console.log(`Tiebreaker result: ${resolutionDetails.winReason}. Territory: ${territoryConquered || 'none'}`);
	console.log(`Details: Correct=${correctAnswer}, ${attacker?.name}=${attackerAnswer?.answer || 'N/A'}, ${defender?.name}=${defenderAnswer?.answer || 'N/A'}`);

	// Show results phase with details before moving to next turn
	room.phase = 'results';
	room.timeRemaining = 5; // Show results for 5 seconds
	io.to(roomId).emit('gameState', room);

	// Move to next turn after showing results
	setTimeout(() => {
		if (checkGameEnd(room)) {
			endGame(roomId);
			return;
		}
		nextTurn(roomId);
	}, 5000);
}

function nextTurn(roomId) {
	const room = gameRooms.get(roomId);
	if (!room) return;
	
	// Prevent multiple simultaneous calls to nextTurn
	if (room.transitioning) return;
	room.transitioning = true;

	// Clear current duel
	room.currentDuel = null;
	room.currentQuestion = null;
	room.playerAnswers = {};

	// Advance to next player
	room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
	
	// Check if we need to advance turn/round
	if (room.currentPlayerIndex === 0) {
		room.turn++;
		if (room.turn > gameSettings.turnsPerPlayerPerRound) {
			room.round++;
			room.turn = 1;
		}
	}

	// Check if game should end
	if (room.round > gameSettings.maxRounds) {
		endGame(roomId);
		return;
	}

	// Start next turn
	room.phase = 'territory_selection';
	room.timeRemaining = 30;

	const currentPlayer = room.players[room.currentPlayerIndex];
	console.log(`Next turn: Round ${room.round}, Turn ${room.turn}, Player: ${currentPlayer.name}`);

	// Handle AI player turn
	if (players.get(currentPlayer.id)?.isAI) {
		setTimeout(() => {
			aiSelectTerritory(currentPlayer.id);
		}, 2000); // AI thinks for 2 seconds
	}

	// Start territory selection timer
	startTerritorySelectionTimer(roomId);

	// Clear transitioning flag
	room.transitioning = false;

	io.to(roomId).emit('gameState', room);
}

function aiSelectTerritory(aiId) {
	const player = players.get(aiId);
	if (!player) return;

	const room = gameRooms.get(player.roomId);
	if (!room || room.phase !== 'territory_selection') return;

	// Get territories that AI can attack
	const attackableTerritories = getAttackableTerritories(room, aiId);
	
	if (attackableTerritories.length === 0) {
		console.log(`AI ${player.name} has no territories to attack`);
		// Skip turn if no attackable territories
		nextTurn(player.roomId);
		return;
	}

	// AI selects a random attackable territory
	const targetTerritory = attackableTerritories[Math.floor(Math.random() * attackableTerritories.length)];
	const defenderId = getTerritoryOwner(room, targetTerritory);
	const defender = room.players.find(p => p.id === defenderId);

	// Safety check: make sure AI isn't attacking its own territory
	if (defenderId === aiId) {
		console.error(`ERROR: AI ${player.name} tried to attack own territory ${targetTerritory}! Skipping turn.`);
		nextTurn(player.roomId);
		return;
	}

	console.log(`AI ${player.name} selected territory: ${targetTerritory} (owned by ${defender?.name})`);
	console.log(`Attackable territories for ${player.name}:`, attackableTerritories);
	startDuel(player.roomId, aiId, targetTerritory);
}

function checkGameEnd(room) {
	// Check if one player owns all territories
	const territoryOwners = new Set(Object.values(room.territories));
	if (territoryOwners.size === 1) {
		return true;
	}

	// Check if max rounds reached
	if (room.round > gameSettings.maxRounds) {
		return true;
	}

	return false;
}

function endGame(roomId) {
	const room = gameRooms.get(roomId);
	if (!room) return;

	room.phase = 'finished';
	room.status = 'finished';

	// Calculate final rankings
	const sortedPlayers = room.players.sort((a, b) => {
		const aScore = room.scores[a.id] || 0;
		const bScore = room.scores[b.id] || 0;
		const aTerritories = a.territories.length;
		const bTerritories = b.territories.length;
		
		// First by territories, then by score
		if (aTerritories !== bTerritories) {
			return bTerritories - aTerritories;
		}
		return bScore - aScore;
	});

	sortedPlayers.forEach((player, index) => {
		player.rank = index + 1;
	});

	console.log(`Game ended in room ${roomId}. Winner: ${sortedPlayers[0].name}`);
	io.to(roomId).emit('gameState', room);
}

io.on('connection', (socket) => {
	console.log('Player connected:', socket.id);

	socket.on('createRoom', ({ playerName, aiPlayerCount = 2 }) => {
		try {
			const room = createGameRoom(socket.id, playerName);
			players.set(socket.id, { name: playerName, roomId: room.id, isAI: false });
			socket.join(room.id);
			
			// Add AI players based on user preference
			addAIPlayersToRoom(room.id, aiPlayerCount);
			
			// Get updated room state after AI players join
			const updatedRoom = gameRooms.get(room.id);
			socket.emit('gameState', updatedRoom);
			console.log(`Room ${room.id} created by ${playerName} with ${aiPlayerCount} AI players`);
		} catch (error) {
			socket.emit('error', 'Failed to create room');
		}
	});

	socket.on('joinRoom', ({ roomId, playerName }) => {
		try {
			const room = joinGameRoom(roomId, socket.id, playerName);
			if (room) {
				players.set(socket.id, { name: playerName, roomId, isAI: false });
				socket.join(roomId);
				
				// Don't automatically add AI players when joining existing rooms
				io.to(roomId).emit('gameState', room);
				console.log(`${playerName} joined room ${roomId}`);
			} else {
				socket.emit('error', 'Room not found or full');
			}
		} catch (error) {
			socket.emit('error', 'Failed to join room');
		}
	});

	socket.on('playerReady', () => {
		const player = players.get(socket.id);
		if (!player) return;

		const room = gameRooms.get(player.roomId);
		if (!room) return;

		const roomPlayer = room.players.find(p => p.id === socket.id);
		if (roomPlayer) {
			roomPlayer.isReady = true;
			io.to(player.roomId).emit('gameState', room);

			const allReady = room.players.every(p => p.isReady);
			if (allReady && room.players.length >= 2) {
				startGame(player.roomId);
			}
		}
	});

	socket.on('addAIPlayer', () => {
		const player = players.get(socket.id);
		if (!player) {
			console.log(`Player ${socket.id} not found when trying to add AI`);
			return;
		}

		const room = gameRooms.get(player.roomId);
		if (!room) {
			console.log(`Room ${player.roomId} not found when trying to add AI`);
			return;
		}
		
		if (room.players.length >= 3) {
			console.log(`Room ${player.roomId} is full, cannot add AI player`);
			return;
		}

		console.log(`${player.name} requested to add AI player to room ${player.roomId}`);
		const aiId = createAIPlayer(player.roomId);
		
		if (aiId) {
			const updatedRoom = gameRooms.get(player.roomId);
			io.to(player.roomId).emit('gameState', updatedRoom);
			console.log(`AI player added successfully to room ${player.roomId}`);
		} else {
			console.log(`Failed to add AI player to room ${player.roomId}`);
		}
	});

	socket.on('selectTerritory', ({ targetTerritoryId }) => {
		const player = players.get(socket.id);
		if (!player) return;

		const room = gameRooms.get(player.roomId);
		if (!room || room.phase !== 'territory_selection') return;

		// Check if it's this player's turn
		const currentPlayer = room.players[room.currentPlayerIndex];
		if (currentPlayer.id !== socket.id) return;

		// Check if territory is attackable (adjacent and owned by opponent)
		const attackableTerritories = getAttackableTerritories(room, socket.id);
		if (!attackableTerritories.includes(targetTerritoryId)) {
			console.log(`${player.name} tried to attack non-adjacent territory: ${targetTerritoryId}`);
			return;
		}

		const defenderId = getTerritoryOwner(room, targetTerritoryId);
		const defender = room.players.find(p => p.id === defenderId);

		// Safety check: make sure player isn't attacking their own territory
		if (defenderId === socket.id) {
			console.error(`ERROR: Player ${player.name} tried to attack own territory ${targetTerritoryId}!`);
			return;
		}

		console.log(`${player.name} selected territory: ${targetTerritoryId} (owned by ${defender?.name})`);
		console.log(`Attackable territories for ${player.name}:`, attackableTerritories);
		startDuel(player.roomId, socket.id, targetTerritoryId);
	});

	socket.on('submitDuelAnswer', ({ answer, timestamp }) => {
		const player = players.get(socket.id);
		if (!player) return;

		const room = gameRooms.get(player.roomId);
		if (!room || room.phase !== 'duel') return;

		// Check if player is part of current duel
		const { attackerId, defenderId } = room.currentDuel;
		if (socket.id !== attackerId && socket.id !== defenderId) return;

		// Check if player already answered
		if (room.playerAnswers[socket.id]) return;

		let isCorrect = false;
		if (room.currentQuestion.type === 'multiple_choice') {
			isCorrect = room.currentQuestion.correctAnswer === answer;
		} else if (room.currentQuestion.type === 'numerical') {
			// For numerical questions, just store the answer
			isCorrect = false; // Will be calculated in tiebreaker logic
		} else if (room.currentQuestion.type === 'text') {
			// For text questions, compare case-insensitive
			const correctText = room.currentQuestion.textAnswer.toLowerCase().trim();
			const userText = String(answer).toLowerCase().trim();
			isCorrect = correctText === userText;
		}
		
		// Store player answer
		room.playerAnswers[socket.id] = {
			playerId: socket.id,
			answer: answer,
			isCorrect: isCorrect,
			timestamp: timestamp
		};

		console.log(`${player.name} answered duel: ${answer} (${isCorrect ? 'correct' : 'incorrect'})`);
		
		// Check if both players have answered
		const answeredPlayers = Object.keys(room.playerAnswers).length;
		if (answeredPlayers === 2) {
			if (room.currentDuel.tiebreaker) {
				processTiebreakerResult(player.roomId);
			} else {
				processDuelResult(player.roomId);
			}
		}
	});

	socket.on('disconnect', () => {
		const player = players.get(socket.id);
		if (player) {
			const room = gameRooms.get(player.roomId);
			if (room) {
				// Remove the disconnected player
				room.players = room.players.filter(p => p.id !== socket.id);
				delete room.scores[socket.id];
				delete room.playerAnswers[socket.id];
				
				// Clean up remaining players to remove AI players
				const remainingHumanPlayers = room.players.filter(p => !players.get(p.id)?.isAI);
				
				if (remainingHumanPlayers.length === 0) {
					// No human players left, clean up AI players and delete room
					room.players.forEach(p => {
						if (players.get(p.id)?.isAI) {
							players.delete(p.id);
							aiPlayers.delete(p.id);
						}
					});
					gameRooms.delete(player.roomId);
				} else {
					io.to(player.roomId).emit('gameState', room);
				}
			}
			players.delete(socket.id);
		}
		console.log('Player disconnected:', socket.id);
	});
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
	console.log(`Game server running on port ${PORT}`);
});