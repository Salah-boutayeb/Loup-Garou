import { RoomState, Role } from '../types';
import { useState, useEffect } from 'react';
import { Shield, Eye, Droplets, Crosshair, Pickaxe, Heart, Key, Ghost, Moon, Vote, VolumeX, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';
import { socket } from '../socket';
import { useSoundEngine } from '../lib/useSoundEngine';
import GameOverScreen from './GameOver';

interface Props {
  room: RoomState;
  userId: string;
}

const roleDetails: Record<Role, { title: string, obj: string, icon: any, color: string, bg: string }> = {
  'Werewolf': { title: 'Werewolf', obj: 'Eliminate villagers during the night.', icon: Shield, color: 'text-red-500', bg: 'from-red-950 to-[#0d0a14]' },
  'Seer': { title: 'Seer', obj: 'Awakens each night to divine the true identity of one player.', icon: Eye, color: 'text-blue-500', bg: 'from-blue-950 to-[#0d0a14]' },
  'Witch': { title: 'Witch', obj: '1 Life pot, 1 Death pot. Use them wisely.', icon: Droplets, color: 'text-purple-500', bg: 'from-purple-950 to-[#0d0a14]' },
  'Hunter': { title: 'Hunter', obj: 'Fires when killed, taking down any player with them.', icon: Crosshair, color: 'text-amber-500', bg: 'from-amber-950 to-[#0d0a14]' },
  'Villager': { title: 'Villager', obj: 'Survive the night. Vote out the werewolves during the day.', icon: Pickaxe, color: 'text-stone-400', bg: 'from-stone-900 to-[#0d0a14]' },
  'Cupid': { title: 'Cupid', obj: 'Choose two players to be lovers at the start of the game.', icon: Heart, color: 'text-pink-500', bg: 'from-pink-950 to-[#0d0a14]' },
  'Little Girl': { title: 'Little Girl', obj: 'Can peek during the night but risks being caught by wolves.', icon: Eye, color: 'text-sky-500', bg: 'from-sky-950 to-[#0d0a14]' },
  'Thief': { title: 'Thief', obj: 'Choose between two unused cards at the start.', icon: Key, color: 'text-orange-500', bg: 'from-orange-950 to-[#0d0a14]' },
};

export default function PlayerDashboard({ room, userId }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('werewolf_muted') === 'true';
  });

  const { playSound } = useSoundEngine(isMuted);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('werewolf_muted', String(newMuted));
  };
  
  // Watch for phase changes to trigger sounds
  useEffect(() => {
    if (room.status === 'night') playSound('night');
    if (room.status === 'voting') playSound('gavel');
    if (room.winner === 'wolves') playSound('defeat'); 
    if (room.winner === 'villagers') playSound('victory');
  }, [room.status, room.winner]);

  const me = room.players.find(p => p.id === userId);

  if (!me || !me.role) {
    return <div className="text-center mt-20 italic text-[#a28dc7]">Waiting for role assignment...</div>;
  }

  const volumeControl = (
    <button 
      onClick={toggleMute} 
      className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-20"
      aria-label="Toggle Mute"
    >
      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
    </button>
  );

  // Game Over handling
  if (room.winner) {
    return (
      <>
        {volumeControl}
        <GameOverScreen winner={room.winner} myRole={me.role} isModerator={false} />
      </>
    );
  }

  // Dead View
  if (!me.isAlive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black relative">
        {volumeControl}
        <Ghost className="w-24 h-24 text-white/20 mb-6" />
        <h1 className="text-4xl font-serif italic text-white/50 mb-2">Eliminated</h1>
        <p className="text-sm text-white/40 tracking-widest uppercase mb-12">You are dead (No talking!)</p>
        <div className="opacity-40 pointer-events-none filter grayscale">
          {/* Minified version of their card */}
          <div className="w-32 h-48 border border-white/20 rounded-xl flex items-center justify-center flex-col gap-2">
             {(() => {
                const Icon = roleDetails[me.role].icon;
                return <Icon className="w-8 h-8" />;
             })()}
             <span className="text-xs uppercase font-bold">{me.role}</span>
          </div>
        </div>
      </div>
    );
  }

  // Night Mode Blindfold
  if (room.status === 'night') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black relative">
        {volumeControl}
        <Moon className="w-16 h-16 text-blue-900 mb-6" />
        <h2 className="text-2xl font-serif text-blue-500 mb-2">Night Falls</h2>
        <p className="text-sm text-blue-300/50 tracking-widest uppercase">Close your eyes</p>
      </div>
    );
  }

  // Voting Mode
  if (room.status === 'voting') {
    const handleVote = (targetId: string) => {
      socket.emit('cast-vote', { roomId: room.id, userId, targetId });
    };

    return (
      <div className="flex flex-col min-h-screen p-4 bg-[#151520] relative">
        {volumeControl}
        <div className="text-center mt-8 mb-8 space-y-2">
          <Vote className="w-8 h-8 text-amber-500 mx-auto" />
          <h2 className="text-xl uppercase tracking-[2px] font-bold text-amber-500">Village Vote</h2>
          <p className="text-xs text-white/50">Who do you accuse? Choose carefully.</p>
        </div>

        <div className="max-w-md w-full mx-auto glass p-6 space-y-3">
           {room.players.map(p => {
             if (!p.isAlive) return null;
             const votesForP = room.players.filter(voter => voter.voteTarget === p.id).length;
             const isMe = p.id === userId;
             return (
               <button 
                 key={p.id}
                 onClick={() => !room.votesRevealed && !isMe && handleVote(p.id)}
                 disabled={room.votesRevealed || isMe}
                 className={`w-full py-4 px-4 flex justify-between items-center rounded border transition-colors ${
                   me.voteTarget === p.id ? 'bg-amber-900 border-amber-500 text-amber-100' : 'bg-white/5 border-white/10'
                 } ${
                   !isMe && !room.votesRevealed ? 'hover:bg-white/10' : ''
                 } ${
                   room.votesRevealed || isMe ? 'cursor-default opacity-80' : ''
                 } ${
                   isMe ? 'bg-black/20 border-white/5' : ''
                 }`}
               >
                 <span className="font-bold">
                   {p.name} 
                   {isMe && <span className="opacity-50 text-xs ml-1">(You)</span>}
                 </span>
                 {room.votesRevealed ? (
                   votesForP > 0 ? (
                     <span className="text-xs uppercase font-bold text-red-400 flex items-center gap-1">
                       {votesForP} Vote{votesForP > 1 ? 's' : ''}
                       {!p.isAlive && <span className="ml-2 text-[10px] bg-red-900/50 px-2 py-0.5 rounded text-red-200">Killed</span>}
                     </span>
                   ) : null
                 ) : (
                   me.voteTarget === p.id && <span className="text-[10px] uppercase font-bold text-amber-400">Selected</span>
                 )}
               </button>
             );
           })}
        </div>
      </div>
    );
  }

  // Day Mode (Show Card)
  const details = roleDetails[me.role];
  const Icon = details.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 flex-1 relative">
      {volumeControl}
      <div className="text-center mb-10 space-y-2 opacity-80">
        <h2 className="text-sm uppercase tracking-[2px] font-bold">Player View</h2>
        <p className="text-xs text-white/50">Day phase is active. Discuss with the village.</p>
      </div>

      <div 
        className="card-reveal relative w-[240px] h-[340px] perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="w-full h-full relative preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Card Back (Hidden) */}
          <div className="absolute inset-0 backface-hidden glass flex flex-col items-center justify-center">
            <div className="w-16 h-16 border border-white/20 rounded-full flex items-center justify-center mb-4 text-[#ff4d4d]">
              <span className="font-serif text-2xl font-bold italic">M</span>
            </div>
            <div className="text-white/50 text-xs tracking-[2px] uppercase font-bold">Secret Role</div>
          </div>

          {/* Card Front (Revealed) */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl border-2 border-[#3c2f5a] shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden bg-[#1a1a24] flex flex-col items-center text-center p-5"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className="absolute top-3 right-3 opacity-30 text-[10px] font-bold">#WW</div>
            
            <div className={`mt-2 mb-4 ${details.color}`}>
              <Icon strokeWidth={1} className="w-16 h-16" />
            </div>
            
            <h3 className="text-2xl mb-2 font-serif italic text-white">
              {details.title}
            </h3>
            
            <p className="text-[11px] opacity-60 px-2 leading-relaxed">
              {details.obj}
            </p>

            <div className="mt-8">
              <div className={`text-[9px] uppercase tracking-[2px] ${details.color} font-bold`}>Reveal Held</div>
              <div className="w-[140px] h-1 bg-white/10 rounded-sm mt-2 overflow-hidden mx-auto">
                <div className={`w-full h-full ${details.bg.includes('red') ? 'bg-[#ff4d4d]' : details.bg.includes('blue') ? 'bg-[#a78bfa]' : details.bg.includes('purple') ? 'bg-[#facc15]' : details.bg.includes('amber') ? 'bg-[#10b981]' : 'bg-white'}`}></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
