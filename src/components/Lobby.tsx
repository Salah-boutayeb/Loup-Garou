import { RoomState, Role } from '../types';
import { socket } from '../socket';
import { Users, Info, Shield, Eye, Droplets, Crosshair, Pickaxe, Heart, Key, Ghost } from 'lucide-react';
import { useState } from 'react';
import QRCode from 'react-qr-code';

interface Props {
  room: RoomState;
  isModerator: boolean;
  userId: string;
}

const ALL_ROLES: Role[] = ['Werewolf', 'Seer', 'Witch', 'Hunter', 'Villager', 'Cupid', 'Little Girl', 'Thief'];

export default function Lobby({ room, isModerator, userId }: Props) {
  const deck = room.deck || {};
  const totalCards = Object.values(deck).reduce((acc, v) => acc + v, 0);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied!');
  };

  const handleStart = () => {
    socket.emit('start-game', { roomId: room.id, userId });
  };

  const updateCardCount = (role: Role, delta: number) => {
    const current = deck[role] || 0;
    const next = Math.max(0, current + delta);
    socket.emit('update-deck', {
      roomId: room.id,
      userId,
      deck: { ...deck, [role]: next }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-white/5 pb-4 mt-4 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white p-2 rounded-lg shrink-0">
            <QRCode value={window.location.href} size={64} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-[2px] uppercase text-left">MILLER'S <span className="text-[#ff4d4d]">HOLLOW</span></h1>
            <p className="text-xs opacity-50 mt-1 text-left">Room ID: <span className="text-[#a78bfa] text-base font-bold ml-1">{room.id}</span></p>
          </div>
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
        
        {/* Moderator Setup / Player List */}
        <div className="flex flex-col gap-6">
          <div className="glass p-6">
            <h2 className="text-sm uppercase tracking-[2px] opacity-60 mb-4 flex items-center gap-2 font-bold">
              <Users className="w-4 h-4" />
              Villagers ({room.players.length})
            </h2>
            <ul className="space-y-2 h-[120px] overflow-y-auto custom-scrollbar">
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

          <div className="glass p-6">
            <h2 className="text-sm uppercase tracking-[2px] opacity-60 mb-4 flex items-center gap-2 font-bold">
              {isModerator ? 'Deck Builder' : 'Current Deck'}
            </h2>
            
            <div className="flex justify-between items-center mb-4 text-xs font-bold">
              <span className="uppercase text-white/50 tracking-widest">Cards: {totalCards}/{room.players.length}</span>
              {totalCards === room.players.length ? (
                <span className="text-[#10b981]">Matches Players</span>
              ) : (
                <span className="text-[#ff4d4d]">Needs {room.players.length}</span>
              )}
            </div>

            <div className="space-y-2 mb-6 h-[180px] overflow-y-auto custom-scrollbar pr-2">
              {ALL_ROLES.map(role => {
                const count = deck[role] || 0;
                if (!isModerator && count === 0) return null; // Players only see active cards
                
                return (
                  <div key={role} className="flex justify-between items-center bg-white/5 px-3 py-2 rounded">
                    <span className="text-sm font-medium">{role}</span>
                    {isModerator ? (
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateCardCount(role, -1)}
                          disabled={count === 0}
                          className="w-6 h-6 flex items-center justify-center bg-black/40 rounded text-white/70 hover:text-white disabled:opacity-30"
                        >-</button>
                        <span className="w-4 text-center text-sm">{count}</span>
                        <button 
                          onClick={() => updateCardCount(role, 1)}
                          className="w-6 h-6 flex items-center justify-center bg-black/40 rounded text-white/70 hover:text-white"
                        >+</button>
                      </div>
                    ) : (
                      <span className="text-sm text-white/70">{count}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {isModerator && (
              <button 
                onClick={handleStart}
                disabled={totalCards !== room.players.length || room.players.length < 3}
                className="btn-primary w-full py-3"
                style={{ background: '#ff4d4d', borderColor: '#9b1c1c' }}
              >
                Distribute Roles & Start
              </button>
            )}
            {!isModerator && (
              <div className="text-center py-3 text-white/50 text-xs border-t border-white/10 uppercase tracking-widest mt-2">
                Waiting for moderator...
              </div>
            )}
          </div>
        </div>

        {/* How to play */}
        <div className="glass p-6 text-xs h-full">
          <p className="uppercase tracking-[1px] font-bold mb-4 opacity-50">Role Legend</p>
          <ul className="list-none flex flex-col gap-4 overflow-y-auto h-[480px] custom-scrollbar pr-2">
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
              <span className="text-[#ec4899] w-24 shrink-0 font-bold tracking-widest">● Cupid</span>
              <span className="opacity-70">Choose two players to be lovers at the start of the game.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#38bdf8] w-24 shrink-0 font-bold tracking-widest">● Little Girl</span>
              <span className="opacity-70">Can peek during the night but risks being caught by wolves.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#fb923c] w-24 shrink-0 font-bold tracking-widest">● Thief</span>
              <span className="opacity-70">Choose between two unused cards at the start.</span>
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
