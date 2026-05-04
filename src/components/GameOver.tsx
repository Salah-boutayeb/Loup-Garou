import { Winner, Role } from '../types';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';

interface Props {
  winner: Winner;
  myRole?: Role;
  isModerator: boolean;
  onPlayAgain?: () => void;
}

export default function GameOverScreen({ winner, myRole, isModerator, onPlayAgain }: Props) {
  const isWolf = myRole === 'Werewolf';
  const isVillager = myRole && myRole !== 'Werewolf';
  
  let didIWin = false;
  if (winner === 'wolves' && isWolf) didIWin = true;
  if (winner === 'villagers' && isVillager) didIWin = true;
  if (winner === 'lovers') didIWin = false; // Simplified

  // Custom Imagery Placeholders
  const wolfWinImg = 'https://images.unsplash.com/photo-1590423048995-2cc359ea4bc5?q=80&w=2940&auto=format&fit=crop';
  const villagerWinImg = 'https://images.unsplash.com/photo-1510006939921-2776c12c40c8?q=80&w=2940&auto=format&fit=crop';
  
  const bgImg = winner === 'wolves' ? wolfWinImg : villagerWinImg;
  const overlayColor = winner === 'wolves' ? 'from-red-900/90 to-black' : 'from-blue-900/90 to-black';
  const title = winner === 'wolves' ? 'The Pack Conquers' : 'The Village is Safe';
  const subtitle = winner === 'wolves' ? 'The werewolves have overrun the town' : 'The werewolves have been eliminated';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black"
      style={{
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className={`absolute inset-0 bg-gradient-to-b ${overlayColor}`} />
      
      <div className="relative z-10 text-center space-y-8 max-w-lg mx-auto">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/10"
        >
          <Shield className={`w-20 h-20 mx-auto mb-6 ${winner === 'wolves' ? 'text-red-500' : 'text-blue-500'}`} />
          <h1 className="text-4xl md:text-5xl font-serif italic text-white mb-4">{title}</h1>
          <p className="text-lg text-white/70 uppercase tracking-widest">{subtitle}</p>
        </motion.div>

        {!isModerator && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <h2 className={`text-5xl font-bold uppercase tracking-[4px] ${didIWin ? 'text-amber-400' : 'text-stone-500'}`}>
              {didIWin ? 'Victory' : 'Defeat'}
            </h2>
            <p className="mt-2 text-sm text-white/50">Your side has {didIWin ? 'won' : 'lost'} the battle.</p>
          </motion.div>
        )}

        {isModerator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <button 
              onClick={onPlayAgain}
              className="btn-primary px-12 py-4 text-lg uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              Play Again
            </button>
            <p className="mt-4 text-xs text-white/40 uppercase tracking-widest">Return to Deck Builder</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
