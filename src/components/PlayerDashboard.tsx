import { RoomState, Role } from '../types';
import { useState } from 'react';
import { Shield, Eye, Droplets, Crosshair, Pickaxe } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  room: RoomState;
  userId: string;
}

const roleDetails: Record<Role, { title: string, obj: string, icon: any, color: string, bg: string }> = {
  'Werewolf': {
    title: 'Werewolf',
    obj: 'Eliminate villagers during the night. Blend in during the day to avoid being voted out. Survive until only wolves remain.',
    icon: Shield,
    color: 'text-red-500',
    bg: 'from-red-950 to-[#0d0a14]'
  },
  'Seer': {
    title: 'Seer',
    obj: 'Awakens each night to divine the true identity of one player. Use this knowledge to guide the village subtly without getting killed.',
    icon: Eye,
    color: 'text-blue-500',
    bg: 'from-blue-950 to-[#0d0a14]'
  },
  'Witch': {
    title: 'Witch',
    obj: 'Possesses two potions: one to save a victim of the wolves, and one to eliminate a player. Each can be used once. Choose wisely.',
    icon: Droplets,
    color: 'text-purple-500',
    bg: 'from-purple-950 to-[#0d0a14]'
  },
  'Hunter': {
    title: 'Hunter',
    obj: 'If killed (by wolves or vote), you immediately shoot one player of your choice, taking them down with you. Take down a wolf.',
    icon: Crosshair,
    color: 'text-amber-500',
    bg: 'from-amber-950 to-[#0d0a14]'
  },
  'Villager': {
    title: 'Villager',
    obj: 'No special abilities. Use intuition and logic to vote out the werewolves during the day. Do not trust easily.',
    icon: Pickaxe,
    color: 'text-stone-400',
    bg: 'from-stone-900 to-[#0d0a14]'
  }
};

export default function PlayerDashboard({ room, userId }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);
  const me = room.players.find(p => p.id === userId);

  if (!me || !me.role) {
    return <div className="text-center mt-20 italic text-[#a28dc7]">Waiting for role assignment...</div>;
  }

  const details = roleDetails[me.role];
  const Icon = details.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 flex-1">
      <div className="text-center mb-10 space-y-2 opacity-80">
        <h2 className="text-sm uppercase tracking-[2px] font-bold">Player View</h2>
        <p className="text-xs text-white/50">Tap the card to privately view your role</p>
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
