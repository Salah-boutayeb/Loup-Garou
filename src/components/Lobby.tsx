import { RoomState } from '../types';
import { socket } from '../socket';
import { Users, Info, Shield, Eye, Droplets, Crosshair, Pickaxe } from 'lucide-react';
import { useState } from 'react';

interface Props {
  room: RoomState;
  isModerator: boolean;
  userId: string;
}

export default function Lobby({ room, isModerator, userId }: Props) {
  const [showRules, setShowRules] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied!');
  };

  const handleStart = () => {
    socket.emit('start-game', { roomId: room.id, userId });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mt-4">
        <div>
          <h1 className="text-xl font-bold tracking-[2px] uppercase">MILLER'S <span className="text-[#ff4d4d]">HOLLOW</span></h1>
          <p className="text-xs opacity-50 mt-1">Room ID: <span className="text-[#a78bfa]">{room.id}</span></p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-xs opacity-80">{room.players.length} Players Connected</p>
            <p className="text-[10px] text-stone-500">● Waiting to Start</p>
          </div>
          <button className="btn-secondary" onClick={copyLink}>
            Copy Invite
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* Players List */}
        <div className="glass p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm uppercase tracking-[2px] opacity-60 mb-6 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Villagers ({room.players.length})
            </h2>
            
            <ul className="space-y-2 mb-8 h-[200px] overflow-y-auto custom-scrollbar">
              {room.players.map(p => (
                <li key={p.id} className="flex items-center px-2 py-2 border-b border-white/5 last:border-0 opacity-90 text-sm">
                  <span className="w-2 h-2 rounded-full bg-stone-500 mr-3"></span>
                  <span className="font-medium text-white">{p.name} {p.id === userId && <span className="opacity-50 text-xs ml-1">(You)</span>}</span>
                </li>
              ))}
              {room.players.length === 0 && (
                <li className="text-center text-white/50 text-xs py-8">Waiting for players to join...</li>
              )}
            </ul>
          </div>

          <div>
            {isModerator && (
              <button 
                onClick={handleStart}
                disabled={room.players.length < 3}
                className="btn-primary w-full py-3"
                style={{ background: '#ff4d4d', borderColor: '#9b1c1c' }}
              >
                Distribute Roles
              </button>
            )}
            {isModerator && room.players.length < 3 && (
              <p className="text-xs text-center mt-3 text-white/50">Need at least 3 players</p>
            )}
            {!isModerator && (
              <div className="text-center py-3 text-white/50 text-xs border-t border-white/10 uppercase tracking-widest">
                Waiting for moderator...
              </div>
            )}
          </div>
        </div>

        {/* How to play */}
        <div className="glass p-6 text-xs">
          <p className="uppercase tracking-[1px] font-bold mb-4 opacity-50">Role Legend</p>
          <ul className="list-none flex flex-col gap-4">
            <li className="flex gap-2">
              <span className="text-[#ff4d4d] w-24 shrink-0 font-bold tracking-widest">● Werewolf</span>
              <span className="opacity-70">Hunts at night. Blend in during the day to avoid being voted out.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#a78bfa] w-24 shrink-0 font-bold tracking-widest">● Seer</span>
              <span className="opacity-70">Sees 1 role per night. Guide the village subtly.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#facc15] w-24 shrink-0 font-bold tracking-widest">● Witch</span>
              <span className="opacity-70">1 Life pot, 1 Death pot. Use them wisely once per game.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#10b981] w-24 shrink-0 font-bold tracking-widest">● Hunter</span>
              <span className="opacity-70">Fires when killed, taking down any player with them.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-white w-24 shrink-0 font-bold tracking-widest">● Villager</span>
              <span className="opacity-70">Survive the night. Vote out the werewolves during the day.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
