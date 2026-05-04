import { RoomState, GamePhase } from '../types';
import { socket } from '../socket';
import { RefreshCw, Users, Eye, Moon, Sun, Vote, UserX } from 'lucide-react';

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
  const handleReset = () => {
    if (window.confirm("Are you sure you want to reshuffle roles and reset the game?")) {
      socket.emit('reset-game', { roomId: room.id, userId });
    }
  };

  const changePhase = (phase: GamePhase) => {
    socket.emit('change-phase', { roomId: room.id, userId, phase });
  };

  const toggleAlive = (targetId: string, isAlive: boolean) => {
    socket.emit('set-alive-status', { roomId: room.id, userId, targetId, isAlive });
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
    <div className={`max-w-5xl mx-auto p-4 md:p-8 flex flex-col min-h-screen transition-colors duration-1000 ${room.status === 'day' || room.status === 'voting' ? 'bg-[#151520]' : ''}`}>
      <header className="h-[80px] flex items-center justify-between border-b border-white/5 mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-[2px] uppercase">MILLER'S <span className="text-[#ff4d4d]">HOLLOW</span></h1>
          <p className="text-xs opacity-50 mt-1">Room ID: <span className="text-[#a78bfa]">{room.id}</span></p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-xs opacity-80 uppercase tracking-widest">{room.status}</p>
            <p className="text-[10px] text-[#10b981]">● Game in Progress</p>
          </div>
          <button onClick={handleReset} className="btn-secondary flex items-center gap-2">
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
            </div>
          </div>
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
  );
}
