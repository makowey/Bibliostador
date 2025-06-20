// Vercel serverless function for game state management
import { kv } from '@vercel/kv';

// Game configuration
const gameSettings = {
  maxRounds: 3,
  turnsPerPlayerPerRound: 3,
  baseScore: 1000,
  attackWinPoints: 200,
  defenseWinPoints: 100
};

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { method, query, body } = req;
  const { action, roomId, playerId } = query;

  try {
    switch (method) {
      case 'GET':
        if (action === 'gameState' && roomId) {
          const gameState = await kv.get(`room:${roomId}`);
          return res.status(200).json(gameState || null);
        }
        break;

      case 'POST':
        switch (action) {
          case 'createRoom':
            const newRoom = await createRoom(body.playerName, body.aiPlayerCount);
            return res.status(200).json(newRoom);

          case 'joinRoom':
            const room = await joinRoom(body.roomId, body.playerId, body.playerName);
            return res.status(200).json(room);

          case 'playerReady':
            const readyRoom = await playerReady(body.roomId, body.playerId);
            return res.status(200).json(readyRoom);

          case 'selectTerritory':
            const duelRoom = await selectTerritory(body.roomId, body.playerId, body.targetTerritoryId);
            return res.status(200).json(duelRoom);

          case 'submitAnswer':
            const resultRoom = await submitDuelAnswer(body.roomId, body.playerId, body.answer, body.timestamp);
            return res.status(200).json(resultRoom);
        }
        break;
    }

    res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Game logic functions (simplified for serverless)
async function createRoom(playerName, aiPlayerCount = 2) {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const playerId = `player_${Date.now()}`;
  
  const room = {
    id: roomId,
    players: [{
      id: playerId,
      name: playerName,
      isReady: false,
      territories: [],
      rank: 1,
      color: 'blue',
      capitalCity: 'jerusalem'
    }],
    maxPlayers: 3,
    status: 'waiting',
    createdAt: new Date().toISOString(),
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

  // Add AI players
  for (let i = 0; i < Math.min(aiPlayerCount, 2); i++) {
    const aiId = `ai_${Date.now()}_${i}`;
    const aiNames = ['David', 'Moses', 'Joshua', 'Solomon', 'Deborah'];
    room.players.push({
      id: aiId,
      name: aiNames[i] || `AI Player ${i + 1}`,
      isReady: true,
      territories: [],
      rank: i + 2,
      color: i === 0 ? 'red' : 'gold',
      capitalCity: i === 0 ? 'samaria' : 'gaza'
    });
    room.scores[aiId] = gameSettings.baseScore;
  }

  await kv.set(`room:${roomId}`, room);
  await kv.set(`player:${playerId}`, { roomId, playerId });
  
  return { room, playerId };
}

async function joinRoom(roomId, playerId, playerName) {
  const room = await kv.get(`room:${roomId}`);
  if (!room || room.players.length >= 3) {
    throw new Error('Room not found or full');
  }

  const newPlayerId = playerId || `player_${Date.now()}`;
  room.players.push({
    id: newPlayerId,
    name: playerName,
    isReady: false,
    territories: [],
    rank: room.players.length + 1,
    color: ['blue', 'red', 'gold'][room.players.length],
    capitalCity: ['jerusalem', 'samaria', 'gaza'][room.players.length]
  });

  room.scores[newPlayerId] = gameSettings.baseScore;
  
  await kv.set(`room:${roomId}`, room);
  await kv.set(`player:${newPlayerId}`, { roomId, playerId: newPlayerId });
  
  return { room, playerId: newPlayerId };
}

async function playerReady(roomId, playerId) {
  const room = await kv.get(`room:${roomId}`);
  if (!room) throw new Error('Room not found');

  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.isReady = true;
  }

  // Check if all players are ready
  const allReady = room.players.every(p => p.isReady);
  if (allReady && room.players.length >= 2) {
    // Start game
    room.status = 'playing';
    room.phase = 'territory_selection';
    room.territories = initializeTerritories(room.players);
    room.timeRemaining = 30;
    
    // Update player territories
    room.players.forEach(player => {
      player.territories = Object.keys(room.territories).filter(
        territoryId => room.territories[territoryId] === player.id
      );
    });
  }

  await kv.set(`room:${roomId}`, room);
  return room;
}

// Helper function to initialize territories
function initializeTerritories(players) {
  const territoryGroups = {
    blue: { capital: 'jerusalem', adjacent: ['judah', 'benjamin', 'simeon'] },
    red: { capital: 'samaria', adjacent: ['ephraim', 'manasseh', 'dan'] },
    gold: { capital: 'gaza', adjacent: ['galilee', 'asher', 'nafali'] }
  };

  const territories = {};
  players.forEach(player => {
    const territoryGroup = territoryGroups[player.color];
    if (territoryGroup) {
      territories[territoryGroup.capital] = player.id;
      territoryGroup.adjacent.forEach(territoryId => {
        territories[territoryId] = player.id;
      });
    }
  });

  return territories;
}

async function selectTerritory(roomId, playerId, targetTerritoryId) {
  const room = await kv.get(`room:${roomId}`);
  if (!room || room.phase !== 'territory_selection') {
    throw new Error('Invalid game state');
  }

  // Start duel logic here
  const defenderId = room.territories[targetTerritoryId];
  if (!defenderId) throw new Error('Territory has no owner');

  // Add question logic
  const sampleQuestions = [
    {
      id: '1',
      text: 'Who led the Israelites out of Egypt?',
      options: ['Moses', 'David', 'Abraham', 'Joshua'],
      correctAnswer: 0,
      type: 'multiple_choice'
    }
  ];

  const question = sampleQuestions[0]; // Random selection in real implementation

  room.currentDuel = {
    attackerId: playerId,
    defenderId: defenderId,
    defenderTerritory: targetTerritoryId,
    question: question
  };

  room.phase = 'duel';
  room.currentQuestion = question;
  room.timeRemaining = 15;
  room.playerAnswers = {};

  await kv.set(`room:${roomId}`, room);
  return room;
}

async function submitDuelAnswer(roomId, playerId, answer, timestamp) {
  const room = await kv.get(`room:${roomId}`);
  if (!room || room.phase !== 'duel') {
    throw new Error('Invalid game state');
  }

  // Store answer
  const isCorrect = room.currentQuestion.correctAnswer === answer;
  room.playerAnswers[playerId] = {
    playerId,
    answer,
    isCorrect,
    timestamp
  };

  // Check if both players answered
  const { attackerId, defenderId } = room.currentDuel;
  if (room.playerAnswers[attackerId] && room.playerAnswers[defenderId]) {
    // Process duel result
    const attackerAnswer = room.playerAnswers[attackerId];
    const defenderAnswer = room.playerAnswers[defenderId];
    
    let winner = defenderId; // Default to defender
    let territoryConquered = null;
    
    if (attackerAnswer.isCorrect && !defenderAnswer.isCorrect) {
      winner = attackerId;
      territoryConquered = room.currentDuel.defenderTerritory;
      room.territories[territoryConquered] = attackerId;
    }

    // Award points
    if (winner === attackerId) {
      room.scores[attackerId] = (room.scores[attackerId] || 0) + gameSettings.attackWinPoints;
    } else {
      room.scores[defenderId] = (room.scores[defenderId] || 0) + gameSettings.defenseWinPoints;
    }

    // Move to next turn
    room.phase = 'territory_selection';
    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
    room.currentDuel = null;
    room.currentQuestion = null;
    room.playerAnswers = {};
    room.timeRemaining = 30;
  }

  await kv.set(`room:${roomId}`, room);
  return room;
}