import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { RoomState } from '../types';
import Lobby from '../components/Lobby';
import ModeratorDashboard from '../components/ModeratorDashboard';
import PlayerDashboard from '../components/PlayerDashboard';
import { v4 as uuidv4 } from 'uuid';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState(sessionStorage.getItem('playerName') || '');
  const [hasJoined, setHasJoined] = useState(false);

  const userId = sessionStorage.getItem('userId') || (() => {
    const id = uuidv4();
    sessionStorage.setItem('userId', id);
    return id;
  })();

  useEffect(() => {
    if (!roomId) return;

    const performCheck = () => {
      socket.emit('check-room', { roomId, userId });
    };

    performCheck();
    socket.on('connect', performCheck);

    const handleRoomUpdate = (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
      // Check if we are already in the room
      if (updatedRoom.moderatorId === userId) {
        setHasJoined(true);
      } else if (updatedRoom.players.find(p => p.id === userId)) {
        setHasJoined(true);
      }
    };

    const handleError = (msg: string) => {
      setError(msg);
    };

    socket.on('room-update', handleRoomUpdate);
    socket.on('error', handleError);

    return () => {
      socket.off('connect', performCheck);
      socket.off('room-update', handleRoomUpdate);
      socket.off('error', handleError);
    };
  }, [roomId, userId]);

  const handleJoin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    sessionStorage.setItem('playerName', playerName);
    socket.emit('join-room', { roomId, userId, playerName });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-[#ff4d4d] space-y-4 px-4 text-center bg-forest-night">
        <h1 className="text-4xl">Oops!</h1>
        <p className="text-xl">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="btn-secondary"
        >
          Return Home
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-forest-night">
        <div className="text-white/50 animate-pulse text-xl tracking-widest uppercase">Finding room...</div>
      </div>
    );
  }

  const isModerator = room.moderatorId === userId;
  const isDay = room.status === 'day' || room.status === 'voting';
  const bgClass = isDay ? 'bg-village-day' : 'bg-forest-night';
  const bgImage = isDay 
    ? 'https://images.unsplash.com/photo-1533154868016-1de63162fb16?q=80&w=2000&auto=format&fit=crop'
    : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop';

  if (!hasJoined) {
    return (
      <div className={`flex items-center justify-center min-h-screen px-4 ${bgClass} relative z-0`}>
        <form onSubmit={handleJoin} className="glass p-8 max-w-sm w-full space-y-6 relative z-10">
          <h2 className="text-2xl font-bold tracking-widest uppercase text-white text-center">Join <span className="text-[#ff4d4d]">Village</span></h2>
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">Display Name</label>
            <input 
              type="text" 
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              className="w-full bg-[#1a1a24] border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-[#ff4d4d] transition-colors"
              placeholder="e.g. John Doe"
              autoFocus
            />
          </div>
          <button 
            type="submit"
            disabled={!playerName.trim()}
            className="btn-primary w-full py-3"
          >
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} relative z-0`}>
      <div className="relative z-10 w-full h-full">
        {room.status === 'lobby' ? (
          <Lobby room={room} isModerator={isModerator} userId={userId} />
        ) : (
          isModerator ? (
            <ModeratorDashboard room={room} userId={userId} />
          ) : (
            <PlayerDashboard room={room} userId={userId} />
          )
        )}
      </div>
    </div>
  );
}
