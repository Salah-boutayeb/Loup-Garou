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
  const [specialPicks, setSpecialPicks] = useState<string[]>([]);
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
    setSpecialPicks([]); // Reset picks on phase change
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

  // Hunter Revenge
  if (room.hunterRevengePlayerId === userId) {
    const handleShoot = () => {
      if (specialPicks.length === 1) {
        socket.emit('special-action', { roomId: room.id, userId, action: 'hunter-shoot', targetIds: specialPicks });
      }
    };
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black relative">
        {volumeControl}
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="max-w-md w-full space-y-6 text-center">
          <Crosshair className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-3xl font-serif text-amber-500 mb-2">Take Your Revenge</h2>
          <p className="text-sm text-amber-200/60 uppercase tracking-widest mb-6">Select someone to take down with you</p>
          <div className="space-y-2 text-left">
            {room.players.filter(p => p.isAlive).map(p => (
              <button
                key={p.id}
                onClick={() => setSpecialPicks([p.id])}
                className={`w-full py-4 px-4 flex justify-between items-center rounded border transition-colors ${
                  specialPicks.includes(p.id) ? 'bg-amber-900 border-amber-500' : 'bg-amber-950/20 border-amber-900/50 hover:bg-amber-900/40'
                }`}
              >
                <span className="font-bold text-amber-100">{p.name}</span>
              </button>
            ))}
          </div>
          <button 
            onClick={handleShoot}
            disabled={specialPicks.length !== 1}
            className="w-full mt-6 py-4 rounded font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed bg-amber-600 text-white"
          >
            Shoot
          </button>
        </motion.div>
      </div>
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

  // Night Mode
  if (room.status === 'night') {
    const handleNightAction = (action: string, targetId: string) => {
      socket.emit('night-action', { roomId: room.id, userId, action, targetId });
    };

    const alivePlayers = room.players.filter(p => p.isAlive);
    const nonWolves = alivePlayers.filter(p => p.role !== 'Werewolf');
    const myWolfVote = room.nightData.wolfVotes[userId];

    const getWolfTarget = () => {
      const votes = Object.values(room.nightData.wolfVotes);
      if (votes.length === 0) return null;
      const counts: Record<string, number> = {};
      let max = 0;
      let target = null;
      votes.forEach(v => {
        counts[v] = (counts[v] || 0) + 1;
        if (counts[v] > max) { max = counts[v]; target = v; }
      });
      return target;
    };
    
    const wolfTargetId = getWolfTarget();
    const wolfTarget = room.players.find(p => p.id === wolfTargetId);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black relative">
        {volumeControl}
        
        {me.role === 'Werewolf' ? (
          <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="text-center">
              <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-serif text-red-500 mb-2">Wolf Pack Awakens</h2>
              <p className="text-sm text-red-300/50 tracking-widest uppercase">Select your prey</p>
            </div>
            <div className="space-y-2">
              {nonWolves.map(p => {
                const wolfVoters = Object.entries(room.nightData.wolfVotes)
                  .filter(([_, tId]) => tId === p.id)
                  .map(([wId, _]) => room.players.find(wp => wp.id === wId)?.name);
                
                return (
                  <button
                    key={p.id}
                    onClick={() => handleNightAction('wolf-vote', p.id)}
                    className={`w-full py-4 px-4 flex justify-between items-center rounded border transition-colors ${
                      myWolfVote === p.id ? 'bg-red-900 border-red-500' : 'bg-red-950/20 border-red-900/50 hover:bg-red-900/40'
                    }`}
                  >
                    <span className="font-bold text-red-100">{p.name}</span>
                    {wolfVoters.length > 0 && (
                      <span className="text-xs text-red-400 font-bold">{wolfVoters.length} Vote{wolfVoters.length > 1 ? 's' : ''} ({wolfVoters.join(', ')})</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ) : me.role === 'Seer' ? (
          <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="text-center">
              <Eye className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-serif text-blue-500 mb-2">Seer's Vision</h2>
              <p className="text-sm text-blue-300/50 tracking-widest uppercase">Investigate one soul</p>
            </div>
            {room.nightData.seerTarget ? (
              <div className="glass p-8 text-center rounded-xl border-blue-500/30">
                <p className="text-blue-200 mb-4">You investigated {room.players.find(p => p.id === room.nightData.seerTarget)?.name}:</p>
                <div className="text-3xl font-serif text-blue-500 italic">
                  {room.players.find(p => p.id === room.nightData.seerTarget)?.role}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {alivePlayers.filter(p => p.id !== userId).map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleNightAction('seer-investigate', p.id)}
                    className="w-full py-4 px-4 flex justify-between items-center rounded border bg-blue-950/20 border-blue-900/50 hover:bg-blue-900/40 text-blue-100"
                  >
                    <span className="font-bold">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : me.role === 'Witch' ? (
          <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="text-center">
              <Droplets className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h2 className="text-2xl font-serif text-purple-500 mb-2">Witch's Brew</h2>
              <p className="text-sm text-purple-300/50 tracking-widest uppercase">Life or Death</p>
            </div>
            
            <div className="space-y-4">
              <div className="glass p-4 rounded border-purple-500/20">
                <h3 className="text-xs uppercase text-green-400 font-bold mb-2">Healing Potion</h3>
                {room.nightData.witchHealUsed ? (
                  <p className="text-white/40 text-sm">Empty.</p>
                ) : (
                  <div>
                    {wolfTarget ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-purple-200">{wolfTarget.name} was attacked.</span>
                        <button 
                          onClick={() => handleNightAction('witch-heal', wolfTarget.id)}
                          className="px-3 py-1 bg-green-900 border border-green-500 text-green-100 rounded text-xs"
                        >
                          Heal
                        </button>
                      </div>
                    ) : (
                      <p className="text-white/40 text-sm italic">Waiting for wolves...</p>
                    )}
                  </div>
                )}
              </div>

              <div className="glass p-4 rounded border-purple-500/20">
                <h3 className="text-xs uppercase text-red-400 font-bold mb-2">Poison Potion</h3>
                {room.nightData.witchKillUsed ? (
                  <p className="text-white/40 text-sm">Empty.</p>
                ) : room.nightData.witchKillTarget ? (
                  <p className="text-red-400 text-sm">Targeted {room.players.find(p => p.id === room.nightData.witchKillTarget)?.name}</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {alivePlayers.filter(p => p.id !== userId).map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleNightAction('witch-kill', p.id)}
                        className="w-full py-2 px-3 flex justify-between items-center rounded border bg-red-950/20 border-red-900/50 hover:bg-red-900/40 text-red-100 text-sm"
                      >
                        <span>Poison {p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : me.role === 'Cupid' && room.firstNight ? (
          <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="text-center">
              <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4" />
              <h2 className="text-2xl font-serif text-pink-500 mb-2">Cupid's Arrow</h2>
              <p className="text-sm text-pink-300/50 tracking-widest uppercase">Choose two lovers</p>
            </div>
            {room.nightData.cupidLovers && room.nightData.cupidLovers.length === 2 ? (
              <div className="glass p-8 text-center rounded-xl border-pink-500/30">
                <p className="text-pink-200">You paired:</p>
                <div className="text-xl font-serif text-pink-500 italic mt-2">
                  {room.players.find(p => p.id === room.nightData.cupidLovers[0])?.name} & {room.players.find(p => p.id === room.nightData.cupidLovers[1])?.name}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {alivePlayers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSpecialPicks(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id].slice(0, 2))}
                      className={`w-full py-4 px-4 flex justify-between items-center rounded border transition-colors ${
                        specialPicks.includes(p.id) ? 'bg-pink-900 border-pink-500 text-pink-100' : 'bg-pink-950/20 border-pink-900/50 hover:bg-pink-900/40 text-pink-100/50'
                      }`}
                    >
                      <span className="font-bold">{p.name} {p.id === userId && '(You)'}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => socket.emit('special-action', { roomId: room.id, userId, action: 'cupid-pick', targetIds: specialPicks })}
                  disabled={specialPicks.length !== 2}
                  className="w-full py-4 rounded font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed bg-pink-600 text-white"
                >
                  Shoot Arrows
                </button>
              </div>
            )}
          </div>
        ) : me.role === 'Thief' && room.firstNight ? (
          <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
             <div className="text-center">
              <Key className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-serif text-orange-500 mb-2">Thief's Swap</h2>
              <p className="text-sm text-orange-300/50 tracking-widest uppercase">Swap two roles</p>
            </div>
            {room.thiefSwapped ? (
              <div className="glass p-8 text-center rounded-xl border-orange-500/30">
                <p className="text-orange-200">You swapped two players' identities.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {alivePlayers.filter(p => p.id !== userId).map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSpecialPicks(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id].slice(0, 2))}
                      className={`w-full py-4 px-4 flex justify-between items-center rounded border transition-colors ${
                        specialPicks.includes(p.id) ? 'bg-orange-900 border-orange-500 text-orange-100' : 'bg-orange-950/20 border-orange-900/50 hover:bg-orange-900/40 text-orange-100/50'
                      }`}
                    >
                      <span className="font-bold">{p.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => socket.emit('special-action', { roomId: room.id, userId, action: 'thief-swap', targetIds: specialPicks })}
                  disabled={specialPicks.length !== 2}
                  className="w-full py-4 rounded font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed bg-orange-600 text-white"
                >
                  Swap Roles
                </button>
              </div>
            )}
          </div>
        ) : me.role === 'Little Girl' ? (
          <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="text-center">
              <Eye className="w-12 h-12 text-sky-500 mx-auto mb-4" />
              <h2 className="text-2xl font-serif text-sky-500 mb-2">Little Girl's Peek</h2>
              <p className="text-sm text-sky-300/50 tracking-widest uppercase mb-4">Shh... The wolves are plotting.</p>
              <div className="glass p-4 rounded-xl border-sky-500/30 text-left">
                 <h3 className="text-sky-300 font-bold mb-2">Wolf Activity:</h3>
                 {Object.keys(room.nightData.wolfVotes).length > 0 ? (
                    <ul className="list-disc pl-5 text-sky-100 text-sm">
                      {Object.entries(room.nightData.wolfVotes).map(([wid, tid]) => (
                         <li key={wid}>{room.players.find(p=>p.id === wid)?.name} voted for <span className="text-red-400 font-bold">{room.players.find(p=>p.id===tid)?.name}</span></li>
                      ))}
                    </ul>
                 ) : (
                    <p className="text-sky-100/50 italic text-sm">No wolves have acted yet...</p>
                 )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center animate-pulse">
            <Moon className="w-16 h-16 text-blue-900 mx-auto mb-6 opacity-50" />
            <h2 className="text-2xl font-serif text-blue-500/50 mb-2">Night Falls</h2>
            <p className="text-sm text-blue-300/30 tracking-widest uppercase">Close your eyes</p>
          </div>
        )}
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
                   {p.isLover && me.isLover && <Heart className="w-3 h-3 text-pink-500 inline ml-2" />}
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

            {me.isLover && (
              <div className="flex items-center gap-1 text-pink-500 font-bold text-xs uppercase mb-2">
                <Heart className="w-3 h-3" /> Lover
              </div>
            )}
            
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
