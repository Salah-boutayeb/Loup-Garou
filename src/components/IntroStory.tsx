import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, SkipForward } from 'lucide-react';

const storySlides = [
  {
    title: "The Continent's Edge",
    text: "At the edge of the Northern Realms lies the village of Ravenbrook. A place where monsters of myth are more than just fireside tales. For generations, the villagers lived in uneasy peace, protected only by the silver and steel of passing monster hunters.",
    image: "https://images.unsplash.com/photo-1533154868016-1de63162fb16?q=80&w=2000&auto=format&fit=crop"
  },
  {
    title: "The Curse of the Moon",
    text: "But an ancient curse has awakened. By day, they are friends and neighbors. But when the moon bleeds red, the beast within them surfaces. Lycanthropes lurk among them, thirsty for blood and chaos.",
    image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=2000&auto=format&fit=crop"
  },
  {
    title: "Silver and Steel",
    text: "Every night, the pack claims a victim. Every day, the survivors must investigate, argue, and vote to lynch those they suspect to be monsters. The stakes are death; trust is a luxury no one can afford.",
    image: "https://images.unsplash.com/photo-1614059082728-662cbab3ab9b?q=80&w=2000&auto=format&fit=crop"
  },
  {
    title: "The Path Ahead",
    text: "Use your abilities to survive. The Seer's visions pierce the veil, the Witch's alchemy holds the power of life and death, and the Hunters stand ready. Draw your swords—will you cleanse Ravenbrook, or feed the beasts?",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop"
  }
];

export default function IntroStory({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // No preloading needed

  const nextSlide = () => {
    if (currentSlide === storySlides.length - 1) {
      onComplete();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0 bg-[#0d0a14]"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-20 flex flex-col h-full p-8 md:p-12 justify-end max-w-4xl w-full mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-6 mb-12 bg-black/40 p-8 rounded-2xl backdrop-blur-sm border border-white/10 drop-shadow-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-serif italic text-red-200 drop-shadow-lg">
              {storySlides[currentSlide].title}
            </h2>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed font-light">
              {storySlides[currentSlide].text}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-auto pb-8">
          <button 
            onClick={onComplete}
            className="flex items-center gap-2 text-white/50 hover:text-white uppercase tracking-[2px] text-xs transition-colors"
          >
            <SkipForward className="w-4 h-4" /> Skip Intro
          </button>
          
          <div className="flex gap-3 absolute left-1/2 -translate-x-1/2">
            {storySlides.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${currentSlide === i ? 'w-8 bg-red-500' : 'w-2 bg-white/20'}`} 
              />
            ))}
          </div>

          <button 
            onClick={nextSlide}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full uppercase tracking-widest text-xs font-bold transition-all border border-white/10 hover:border-white/30"
          >
            {currentSlide === storySlides.length - 1 ? 'Enter Village' : 'Next'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
