import { RoomState, GamePhase } from '../types';
import { socket } from '../socket';
import { RefreshCw, Users, Eye, Moon, Sun, Vote, UserX, AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSoundEngine } from '../lib/useSoundEngine';
import GameOverScreen from './GameOver';

interface Props {
  room: RoomState;
  userId: string;
}

const roleColors: Record<string, string> = {
  'Werewolf': 'text-red-400',
  'Seer': 'text-blue-400',
  'Witch': 'text-purple-400',
  'Hunter': 'text-amber-400',
  'Villager': 'text-stone-300',
  'Cupid': 'text-pink-400',
  'Little Girl': 'text-sky-400',
  'Thief': 'text-orange-400',
};

export default function ModeratorDashboard({ room, userId }: Props) {
  const [showResetModal, setShowResetModal] = useState(false);
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
    if (room.winner === 'wolves') playSound('defeat'); // Mod hears default defeat/victory (wolves = defeat, villagers = victory)
    if (room.winner === 'villagers') playSound('victory');
  }, [room.status, room.winner]);

  const confirmReset = () => {
    socket.emit('reset-game', { roomId: room.id, userId });
    setShowResetModal(false);
  };

  const changePhase = (phase: GamePhase) => {
    socket.emit('change-phase', { roomId: room.id, userId, phase });
  };

  const toggleAlive = (targetId: string, isAlive: boolean) => {
    socket.emit('set-alive-status', { roomId: room.id, userId, targetId, isAlive });
    if (!isAlive) playSound('howl'); // Play howl when moderator manually eliminates
  };

  const revealVotes = () => {
    socket.emit('reveal-votes', { roomId: room.id, userId });
  };

  // Sort Werewolves first, then special roles, then Villagers
  const sortedPlayers = [...room.players].sort((a, b) => {
    const order: Record<string, number> = { 'Werewolf': 1, 'Seer': 2, 'Witch': 3, 'Hunter': 4, 'Cupid': 5, 'Little Girl': 6, 'Thief': 7, 'Villager': 8 };
    return (order[a.role || 'Villager'] || 99) - (order[b.role || 'Villager'] || 99);
  });

  return (
    <>
      {room.winner && (
        <GameOverScreen 
          winner={room.winner} 
          isModerator={true} 
          onPlayAgain={() => socket.emit('reset-game', { roomId: room.id, userId })} 
        />
      )}
      
      {/* Background Phase Overlay */}
      <div 
        className={`fixed inset-0 pointer-events-none transition-colors duration-1000 z-0 ${
          room.status === 'night' ? 'bg-[#050520]/90' : 
          room.status === 'day' ? 'bg-amber-500/5' : 
          room.status === 'voting' ? 'bg-amber-600/10' : 
          'bg-transparent'
        }`}
      />
      <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col min-h-screen relative z-10">
        <header className="h-[80px] flex items-center justify-between border-b border-white/5 mb-8">
          <div>
            <h1 className="text-xl font-bold tracking-[2px] uppercase">MILLER'S <span className="text-[#ff4d4d]">HOLLOW</span></h1>
            <p className="text-xs opacity-50 mt-1">Room ID: <span className="text-[#a78bfa]">{room.id}</span></p>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={toggleMute} className="text-white/50 hover:text-white transition-colors">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className="text-right ml-2 border-l border-white/10 pl-4">
              <p className="text-xs opacity-80 uppercase tracking-widest">{room.status}</p>
              <p className="text-[10px] text-[#10b981]">● Game in Progress</p>
            </div>
            <button onClick={() => setShowResetModal(true)} className="btn-secondary flex items-center gap-2">
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="col-span-1 flex flex-col gap-4">
            <div className="glass p-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#a78bfa] mb-4">Phase Controls</h2>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => changePhase('night')}
                  className={`btn-secondary flex items-center gap-2 justify-center py-3 ${room.status === 'night' ? 'bg-[#3c2f5a] border-[#5a4a8a] text-white' : ''}`}
                >
                  <Moon className="w-4 h-4" /> Night
                </button>
                <button 
                  onClick={() => changePhase('day')}
                  className={`btn-secondary flex items-center gap-2 justify-center py-3 ${room.status === 'day' ? 'bg-[#3c2f5a] border-[#5a4a8a] text-white' : ''}`}
                >
                  <Sun className="w-4 h-4" /> Day
                </button>
                
                <div className="h-px bg-white/10 my-2"></div>
                
                <button 
                  onClick={() => changePhase('voting')}
                  className={`btn-secondary flex items-center gap-2 justify-center py-3 ${(room.status === 'night' || room.status === 'day') ? 'border-amber-500/50 text-amber-500 hover:bg-amber-500/10' : ''} ${room.status === 'voting' ? 'bg-amber-900 border-amber-500 text-white' : ''}`}
                >
                  <Vote className="w-4 h-4" /> Start Vote
                </button>
                
                {room.status === 'voting' && !room.votesRevealed && (
                  <button 
                    onClick={revealVotes}
                    className="btn-primary flex items-center justify-center py-3"
                    style={{ background: '#ff4d4d', borderColor: '#9b1c1c' }}
                  >
                    Reveal Results & Kill
                  </button>
                )}
                {room.status === 'voting' && room.votesRevealed && (
                  <button 
                    onClick={() => changePhase('night')}
                    className="btn-primary flex items-center justify-center py-3 gap-2"
                    style={{ background: '#3c2f5a', borderColor: '#5a4a8a' }}
                  >
                    <Moon className="w-4 h-4" /> Close Vote & Sleep
                  </button>
                )}
              </div>
            </div>

            {room.status === 'night' && (
              <div className="glass p-5 mt-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#a78bfa] mb-4">Night Activity</h3>
                <ul className="space-y-3 text-sm text-white/70">
                  <li className="flex justify-between items-center bg-white/5 p-2 rounded">
                    <span className="text-red-400">Wolf Votes:</span>
                    <span>{Object.keys(room.nightData?.wolfVotes || {}).length} voted</span>
                  </li>
                  <li className="flex justify-between items-center bg-white/5 p-2 rounded">
                    <span className="text-blue-400">Seer:</span>
                    <span>{room.nightData?.seerTarget ? 'Checked' : 'Waiting...'}</span>
                  </li>
                  <li className="flex flex-col gap-1 bg-white/5 p-2 rounded">
                    <span className="text-purple-400">Witch:</span>
                    <span className="text-xs">{room.nightData?.witchHealUsed ? 'Heal Potion Empty' : (room.nightData?.witchHealTarget ? 'Used Heal' : 'Heal Pending/Kept')}</span>
                    <span className="text-xs">{room.nightData?.witchKillUsed ? 'Kill Potion Empty' : (room.nightData?.witchKillTarget ? 'Used Kill' : 'Kill Pending/Kept')}</span>
                  </li>
                </ul>
                <div className="mt-4 text-xs text-amber-500/80 italic">
                  Switch to Day to automatically resolve kills.
                </div>
              </div>
            )}
          </aside>

          <section className="glass flex flex-col col-span-1 md:col-span-3 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm uppercase tracking-[2px] opacity-60 font-bold flex items-center gap-2">
                <Eye className="w-4 h-4"/>
                God View &bull; Live Status
              </h2>
              {room.status === 'voting' && (
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded bg-amber-950/50 border border-amber-900 text-amber-500`}>
                  Voting Active
                </span>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm text-left">
                <thead>
                  <tr className="border-b border-white/10 opacity-40">
                    <th className="pb-3 font-normal">Player Name</th>
                    <th className="pb-3 font-normal">Assigned Role</th>
                    <th className="pb-3 font-normal">Status</th>
                    <th className="pb-3 font-normal text-right">Actions / Votes</th>
                  </tr>
                </thead>
                <tbody className="opacity-90">
                  {sortedPlayers.map(p => {
                    let voteText = '';
                    if (room.status === 'voting') {
                      if (p.isAlive) {
                        const targetName = p.voteTarget ? room.players.find(t => t.id === p.voteTarget)?.name : '...';
                        voteText = room.votesRevealed ? `Voted: ${targetName}` : (p.voteTarget ? 'Voted' : 'Voting...');
                      }
                    }

                    return (
                      <tr key={p.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${!p.isAlive ? 'opacity-50' : ''}`}>
                        <td className="py-4 font-medium flex items-center gap-2">
                          {!p.isAlive && <UserX className="w-4 h-4 text-[#ff4d4d]" />}
                          {p.name}
                        </td>
                        <td className={`py-4 font-bold tracking-wide uppercase text-xs ${p.role ? roleColors[p.role] : ''}`}>
                          {p.role || 'Unknown'}
                        </td>
                        <td className="py-4">
                          <span className={p.isAlive ? "text-[#10b981]" : "text-[#ff4d4d] font-bold uppercase text-[10px] tracking-widest"}>
                            {p.isAlive ? 'Alive' : 'Eliminated'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {room.status === 'voting' && p.isAlive ? (
                            <span className={`text-xs ${room.votesRevealed ? 'text-amber-300' : 'text-white/50'}`}>
                              {voteText}
                            </span>
                          ) : (
                            <button 
                              onClick={() => toggleAlive(p.id, !p.isAlive)}
                              className="text-xs uppercase bg-black/40 px-2 py-1 rounded hover:bg-black/80"
                            >
                              {p.isAlive ? 'Kill' : 'Revive'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass p-8 max-w-md w-full rounded-xl border border-red-500/30 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold uppercase tracking-widest text-[#ff4d4d]">End Current Game?</h3>
              <p className="text-white/60 text-sm mt-3 leading-relaxed">
                This will send all players back to the lobby. Roles will be unassigned and all game progress will be lost forever.
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-3 bg-[#2a2a35] hover:bg-[#3a3a45] rounded font-bold uppercase text-xs tracking-widest transition-colors border border-white/10 text-white/70"
              >
                Cancel
              </button>
              <button 
                onClick={confirmReset}
                className="flex-1 py-3 bg-[#ff4d4d] hover:bg-red-500 text-white rounded font-bold uppercase text-xs tracking-widest transition-colors border border-red-600 shadow-[0_0_15px_rgba(255,77,77,0.4)]"
              >
                Yes, Reset Game
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
