import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';

// Game Types
type Role = 'Werewolf' | 'Seer' | 'Witch' | 'Hunter' | 'Villager' | 'Cupid' | 'Little Girl' | 'Thief';

interface Player {
  id: string; // User ID (from sessionStorage)
  socketId: string;
  name: string;
  role?: Role;
  isAlive: boolean;
  voteTarget?: string;
  isLover?: boolean;
}

type GamePhase = 'lobby' | 'night' | 'day' | 'voting';
type Winner = 'wolves' | 'villagers' | 'lovers' | null;

interface NightData {
  wolfVotes: Record<string, string>;
  seerTarget?: string;
  witchHealTarget?: string;
  witchKillTarget?: string;
  witchHealUsed: boolean;
  witchKillUsed: boolean;
  cupidLovers: string[];
}

interface Room {
  id: string;
  moderatorId: string;
  players: Player[];
  status: GamePhase;
  deck: Record<Role, number>;
  votesRevealed: boolean;
  winner: Winner;
  nightData: NightData;
  firstNight: boolean;
  hunterRevengePlayerId?: string | null;
  thiefSwapped?: boolean;
}

const rooms: Record<string, Room> = {};

const defaultDeck: Record<Role, number> = {
  Werewolf: 0, Seer: 0, Witch: 0, Hunter: 0, Villager: 0, Cupid: 0, 'Little Girl': 0, Thief: 0
};

function checkWinConditions(players: Player[]): Winner {
  const alivePlayers = players.filter(p => p.isAlive);
  if (alivePlayers.length === 0) return null;
  
  const lovers = alivePlayers.filter(p => p.isLover);
  if (lovers.length === 2 && alivePlayers.length === 2) {
    return 'lovers';
  }

  const wolves = alivePlayers.filter(p => p.role === 'Werewolf');
  const villagers = alivePlayers.filter(p => p.role !== 'Werewolf');

  if (wolves.length === 0) {
    return 'villagers';
  }
  
  if (wolves.length >= villagers.length) {
    return 'wolves';
  }
  
  return null;
}

function executeKills(room: Room, targetIds: string[]) {
  const queue = [...targetIds];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const p = room.players.find(x => x.id === id);
    if (!p || !p.isAlive) continue;
    
    p.isAlive = false;

    if (p.isLover) {
      const otherLover = room.players.find(o => o.isLover && o.id !== id && o.isAlive);
      if (otherLover) queue.push(otherLover.id);
    }
    
    if (p.role === 'Hunter') {
      room.hunterRevengePlayerId = p.id;
    }
  }
}

function generateRolesFromDeck(deck: Record<Role, number>): Role[] {
  const roles: Role[] = [];
  for (const [role, count] of Object.entries(deck)) {
    for (let i = 0; i < (count as number); i++) {
      roles.push(role as Role);
    }
  }
  return roles.sort(() => Math.random() - 0.5);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  const httpServer = createServer(app);
  
  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Create Room
    socket.on('create-room', ({ roomId, userId }) => {
      rooms[roomId] = {
        id: roomId,
        moderatorId: userId,
        players: [],
        status: 'lobby',
        deck: { ...defaultDeck },
        votesRevealed: false,
        winner: null,
        nightData: {
          wolfVotes: {},
          witchHealUsed: false,
          witchKillUsed: false,
          cupidLovers: []
        }
      };
      socket.join(roomId);
      console.log(`Room created: ${roomId} by Moderator: ${userId}`);
      socket.emit('room-created', rooms[roomId]);
    });

    // Check Room
    socket.on('check-room', ({ roomId, userId }) => {
      const room = rooms[roomId];
      if (room) {
        if (userId) {
          const isPlayer = room.players.some(p => p.id === userId);
          const isMod = room.moderatorId === userId;
          if (isPlayer || isMod) {
            socket.join(roomId);
            if (isPlayer) {
              const p = room.players.find(p => p.id === userId);
              if (p) p.socketId = socket.id;
            }
          }
        }
        socket.emit('room-update', room);
      } else {
        socket.emit('error', 'Room not found');
      }
    });

    // Join Room
    socket.on('join-room', ({ roomId, userId, playerName }) => {
      const room = rooms[roomId];
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }
      
      const existingPlayer = room.players.find(p => p.id === userId);
      if (existingPlayer) {
        existingPlayer.socketId = socket.id;
        existingPlayer.name = playerName;
      } else {
        const newPlayer: Player = {
          id: userId,
          socketId: socket.id,
          name: playerName,
          isAlive: true,
        };
        room.players.push(newPlayer);
      }
      
      socket.join(roomId);
      console.log(`Player ${playerName} joined room ${roomId}`);
      io.to(roomId).emit('room-update', room);
    });

    // Update Deck
    socket.on('update-deck', ({ roomId, userId, deck }) => {
      const room = rooms[roomId];
      if (!room || userId !== room.moderatorId) return;
      
      room.deck = deck;
      io.to(roomId).emit('room-update', room);
    });

    // Start Game
    socket.on('start-game', ({ roomId, userId }) => {
      const room = rooms[roomId];
      if (!room) return;
      if (userId !== room.moderatorId) return; // Only moderator

      const totalCards = Object.values(room.deck).reduce((acc, val) => acc + val, 0);
      if (totalCards !== room.players.length) return; // Deck size must match players

      const roles = generateRolesFromDeck(room.deck);
      room.players.forEach((player, index) => {
        player.role = roles[index];
        player.isAlive = true;
        player.voteTarget = undefined;
        player.isLover = false; // Reset lovers
      });
      room.status = 'night';
      room.firstNight = true;
      room.hunterRevengePlayerId = null;
      room.thiefSwapped = false;
      room.votesRevealed = false;
      room.winner = null;
      room.nightData = {
        wolfVotes: {},
        seerTarget: undefined,
        witchHealTarget: undefined,
        witchKillTarget: undefined,
        witchHealUsed: false,
        witchKillUsed: false,
        cupidLovers: []
      };
      
      io.to(roomId).emit('game-started', room);
      io.to(roomId).emit('room-update', room);
    });

    // Change Phase
    socket.on('change-phase', ({ roomId, userId, phase }) => {
      const room = rooms[roomId];
      if (!room || userId !== room.moderatorId) return;

      if (room.status === 'night' && phase === 'day') {
        room.firstNight = false;
        // Resolve night actions
        // 1. Wolves
        const votes = Object.values(room.nightData.wolfVotes);
        let wolfTargetId: string | null = null;
        if (votes.length > 0) {
          const counts: Record<string, number> = {};
          let max = 0;
          votes.forEach(v => {
            counts[v] = (counts[v] || 0) + 1;
            if (counts[v] > max) { max = counts[v]; wolfTargetId = v; }
          });
        }
        
        const witchHealed = room.nightData.witchHealTarget === wolfTargetId && room.nightData.witchHealTarget != null;
        
        let diedTonight: string[] = [];
        
        if (wolfTargetId && !witchHealed) {
          diedTonight.push(wolfTargetId);
        }
        if (room.nightData.witchKillTarget) {
          diedTonight.push(room.nightData.witchKillTarget);
        }
        
        executeKills(room, diedTonight);

        // Check winner after deaths
        room.winner = checkWinConditions(room.players);
        if (room.winner) {
          io.to(roomId).emit('game-over', { winner: room.winner });
        }
      }

      room.status = phase;
      if (phase !== 'voting') {
        room.votesRevealed = false;
        room.players.forEach(p => p.voteTarget = undefined);
      }
      if (phase === 'night') {
        room.nightData.wolfVotes = {};
        room.nightData.seerTarget = undefined;
        room.nightData.witchHealTarget = undefined;
        room.nightData.witchKillTarget = undefined;
      }
      
      io.to(roomId).emit('room-update', room);
    });

    // Cast Vote
    socket.on('cast-vote', ({ roomId, userId, targetId }) => {
      const room = rooms[roomId];
      if (!room || room.status !== 'voting' || room.votesRevealed) return;
      if (userId === targetId) return; // Prevent voting for self
      
      const voter = room.players.find(p => p.id === userId);
      if (!voter || !voter.isAlive) return;

      voter.voteTarget = targetId;
      io.to(roomId).emit('room-update', room);
    });

    // Reveal Votes
    socket.on('reveal-votes', ({ roomId, userId }) => {
      const room = rooms[roomId];
      if (!room || userId !== room.moderatorId) return;
      
      room.votesRevealed = true;
      
      // Calculate eliminations
      const voteCounts: Record<string, number> = {};
      room.players.forEach(p => {
        if (p.isAlive && p.voteTarget) {
          voteCounts[p.voteTarget] = (voteCounts[p.voteTarget] || 0) + 1;
        }
      });
      
      let maxVotes = 0;
      let eliminatedId: string | null = null;
      let tie = false;

      Object.entries(voteCounts).forEach(([tid, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          eliminatedId = tid;
          tie = false;
        } else if (count === maxVotes) {
          tie = true;
        }
      });

      // Eliminate the highest voted player if there's no tie
      if (!tie && eliminatedId) {
        executeKills(room, [eliminatedId]);
        // Only check win if someone died
        room.winner = checkWinConditions(room.players);
        if (room.winner) {
          io.to(roomId).emit('game-over', { winner: room.winner });
        }
      }

      io.to(roomId).emit('room-update', room);
    });

    // Manual Eliminate/Revive
    socket.on('set-alive-status', ({ roomId, userId, targetId, isAlive }) => {
      const room = rooms[roomId];
      if (!room || userId !== room.moderatorId) return;
      
      const target = room.players.find(p => p.id === targetId);
      if (target) {
        if (!isAlive) {
          executeKills(room, [targetId]);
        } else {
          target.isAlive = true;
        }
        room.winner = checkWinConditions(room.players);
        if (room.winner) {
          io.to(roomId).emit('game-over', { winner: room.winner });
        }
        io.to(roomId).emit('room-update', room);
      }
    });

    socket.on('special-action', ({ roomId, userId, action, targetIds }) => {
      const room = rooms[roomId];
      if (!room) return;
      const player = room.players.find(p => p.id === userId);
      if (!player) return;

      if (action === 'hunter-shoot' && room.hunterRevengePlayerId === userId) {
        executeKills(room, targetIds);
        room.hunterRevengePlayerId = null;
        room.winner = checkWinConditions(room.players);
        if (room.winner) {
          io.to(roomId).emit('game-over', { winner: room.winner });
        }
        io.to(roomId).emit('room-update', room);
      } else if (action === 'cupid-pick' && room.firstNight && player.role === 'Cupid') {
        const [p1, p2] = targetIds;
        room.players.forEach(p => {
          if (p.id === p1 || p.id === p2) p.isLover = true;
        });
        room.nightData.cupidLovers = [p1, p2];
        io.to(roomId).emit('room-update', room);
      } else if (action === 'thief-swap' && room.firstNight && player.role === 'Thief' && !room.thiefSwapped) {
        const [p1, p2] = targetIds;
        const player1 = room.players.find(p => p.id === p1);
        const player2 = room.players.find(p => p.id === p2);
        if (player1 && player2) {
          const temp = player1.role;
          player1.role = player2.role;
          player2.role = temp;
          room.thiefSwapped = true;
          io.to(roomId).emit('room-update', room);
        }
      }
    });

    // Reset Game
    socket.on('reset-game', ({ roomId, userId }) => {
      const room = rooms[roomId];
      if (!room) return;
      if (userId !== room.moderatorId) return;

      room.status = 'lobby';
      room.votesRevealed = false;
      room.winner = null;
      room.nightData = {
        wolfVotes: {},
        witchHealUsed: false,
        witchKillUsed: false,
        cupidLovers: []
      };
      room.players.forEach(player => {
        delete player.role;
        player.isAlive = true;
        player.voteTarget = undefined;
        player.isLover = false;
      });

      io.to(roomId).emit('game-reset', room);
      io.to(roomId).emit('room-update', room);
    });

    // Night Actions
    socket.on('night-action', ({ roomId, userId, action, targetId }) => {
      const room = rooms[roomId];
      if (!room || room.status !== 'night') return;
      
      const player = room.players.find(p => p.id === userId);
      if (!player || !player.isAlive || !player.role) return;

      switch (action) {
        case 'wolf-vote':
          if (player.role === 'Werewolf') {
            room.nightData.wolfVotes[userId] = targetId;
          }
          break;
        case 'seer-investigate':
          if (player.role === 'Seer') {
            room.nightData.seerTarget = targetId;
          }
          break;
        case 'witch-heal':
          if (player.role === 'Witch' && !room.nightData.witchHealUsed) {
            room.nightData.witchHealTarget = targetId;
            room.nightData.witchHealUsed = true;
          }
          break;
        case 'witch-kill':
          if (player.role === 'Witch' && !room.nightData.witchKillUsed) {
            room.nightData.witchKillTarget = targetId;
            room.nightData.witchKillUsed = true;
          }
          break;
      }
      
      io.to(roomId).emit('room-update', room);
    });

    // Handle Disconnect (Optional cleanup if we want, but since we rely on userId, we keep them in memory for now)
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
