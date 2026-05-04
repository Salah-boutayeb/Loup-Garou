import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';

// Game Types
type Role = 'Werewolf' | 'Seer' | 'Witch' | 'Hunter' | 'Villager';

interface Player {
  id: string; // User ID (from sessionStorage)
  socketId: string;
  name: string;
  role?: Role;
  isAlive: boolean;
}

interface Room {
  id: string;
  moderatorId: string;
  players: Player[];
  status: 'lobby' | 'playing';
}

const rooms: Record<string, Room> = {};

function distributeRoles(playerCount: number): Role[] {
  const roles: Role[] = [];
  
  if (playerCount <= 4) {
    roles.push('Werewolf', 'Seer');
    while (roles.length < playerCount) roles.push('Villager');
  } else if (playerCount <= 6) {
    roles.push('Werewolf', 'Seer', 'Witch');
    while (roles.length < playerCount) roles.push('Villager');
  } else {
    // 7 or more
    roles.push('Werewolf', 'Werewolf', 'Seer', 'Witch', 'Hunter');
    while (roles.length < playerCount) roles.push('Villager');
  }
  
  // Shuffle roles
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
        status: 'lobby'
      };
      socket.join(roomId);
      console.log(`Room created: ${roomId} by Moderator: ${userId}`);
      socket.emit('room-created', rooms[roomId]);
    });

    // Check Room
    socket.on('check-room', ({ roomId }) => {
      const room = rooms[roomId];
      if (room) {
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

    // Start Game / Distribute Roles
    socket.on('start-game', ({ roomId, userId }) => {
      const room = rooms[roomId];
      if (!room) return;
      if (userId !== room.moderatorId) return; // Only moderator

      const roles = distributeRoles(room.players.length);
      room.players.forEach((player, index) => {
        player.role = roles[index];
      });
      room.status = 'playing';
      
      io.to(roomId).emit('game-started', room);
      io.to(roomId).emit('room-update', room);
    });

    // Reset Game
    socket.on('reset-game', ({ roomId, userId }) => {
      const room = rooms[roomId];
      if (!room) return;
      if (userId !== room.moderatorId) return;

      room.status = 'lobby';
      room.players.forEach(player => {
        delete player.role;
        player.isAlive = true;
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
