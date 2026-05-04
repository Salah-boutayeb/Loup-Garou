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
}

type GamePhase = 'lobby' | 'night' | 'day' | 'voting';

interface Room {
  id: string;
  moderatorId: string;
  players: Player[];
  status: GamePhase;
  deck: Record<Role, number>;
  votesRevealed: boolean;
}

const rooms: Record<string, Room> = {};

const defaultDeck: Record<Role, number> = {
  Werewolf: 0, Seer: 0, Witch: 0, Hunter: 0, Villager: 0, Cupid: 0, 'Little Girl': 0, Thief: 0
};

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
        votesRevealed: false
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
      });
      room.status = 'night';
      room.votesRevealed = false;
      
      io.to(roomId).emit('game-started', room);
      io.to(roomId).emit('room-update', room);
    });

    // Change Phase
    socket.on('change-phase', ({ roomId, userId, phase }) => {
      const room = rooms[roomId];
      if (!room || userId !== room.moderatorId) return;

      room.status = phase;
      if (phase !== 'voting') {
        room.votesRevealed = false;
        room.players.forEach(p => p.voteTarget = undefined);
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
        const target = room.players.find(p => p.id === eliminatedId);
        if (target) target.isAlive = false;
      }

      io.to(roomId).emit('room-update', room);
    });

    // Manual Eliminate/Revive
    socket.on('set-alive-status', ({ roomId, userId, targetId, isAlive }) => {
      const room = rooms[roomId];
      if (!room || userId !== room.moderatorId) return;
      
      const target = room.players.find(p => p.id === targetId);
      if (target) {
        target.isAlive = isAlive;
        io.to(roomId).emit('room-update', room);
      }
    });

    // Reset Game
    socket.on('reset-game', ({ roomId, userId }) => {
      const room = rooms[roomId];
      if (!room) return;
      if (userId !== room.moderatorId) return;

      room.status = 'lobby';
      room.votesRevealed = false;
      room.players.forEach(player => {
        delete player.role;
        player.isAlive = true;
        player.voteTarget = undefined;
      });

      io.to(roomId).emit('game-reset', room);
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
