import { RoomState } from '../types';
import { socket } from '../socket';
import { RefreshCw, Users, Eye } from 'lucide-react';

interface Props {
  room: RoomState;
  userId: string;
}

const roleColors: Record<string, string> = {
  'Werewolf': 'role-werewolf',
  'Seer': 'role-seer',
  'Witch': 'role-witch',
  'Hunter': 'role-hunter',
  'Villager': 'role-villager',
};

export default function ModeratorDashboard({ room, userId }: Props) {
  const handleReset = () => {
    if (window.confirm("Are you sure you want to reshuffle roles and reset the game?")) {
      socket.emit('reset-game', { roomId: room.id, userId });
    }
  };

  // Sort Werewolves first, then special roles, then Villagers
  const sortedPlayers = [...room.players].sort((a, b) => {
    const order: Record<string, number> = { 'Werewolf': 1, 'Seer': 2, 'Witch': 3, 'Hunter': 4, 'Villager': 5 };
    return (order[a.role || 'Villager'] || 99) - (order[b.role || 'Villager'] || 99);
  });

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col min-h-screen">
      <header className="h-[80px] flex items-center justify-between border-b border-white/5 mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-[2px] uppercase">MILLER'S <span className="text-[#ff4d4d]">HOLLOW</span></h1>
          <p className="text-xs opacity-50 mt-1">Room ID: <span className="text-[#a78bfa]">{room.id}</span></p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-xs opacity-80">{room.players.length} Players Connected</p>
            <p className="text-[10px] text-[#10b981]">● Game in Progress</p>
          </div>
          <button onClick={handleReset} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-3 h-3" />
            Reset Round
          </button>
        </div>
      </header>

      <section className="glass flex flex-col flex-1 p-6">
        <h2 className="text-sm uppercase tracking-[2px] opacity-60 mb-6 font-bold flex items-center gap-2">
          <Eye className="w-4 h-4"/>
          God View &bull; Live Distribution
        </h2>
        
        <div className="flex-1 overflow-x-auto">
          <table className="w-full border-collapse text-sm text-left">
            <thead>
              <tr className="border-b border-white/10 opacity-40">
                <th className="pb-3 font-normal">Player Name</th>
                <th className="pb-3 font-normal">Assigned Role</th>
                <th className="pb-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="opacity-90">
              {sortedPlayers.map(p => (
                <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-4 font-medium">{p.name}</td>
                  <td className={`py-4 font-bold tracking-wide uppercase text-xs ${p.role ? roleColors[p.role] : ''}`}>
                    {p.role || 'Unknown'}
                  </td>
                  <td className="py-4">
                    <span className={p.isAlive ? "text-[#10b981]" : "text-[#ff4d4d]"}>
                      {p.isAlive ? 'Alive' : 'Eliminated'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </section>
    </div>
  );
}
