import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, SkipForward } from 'lucide-react';

const storySlides = [
  {
    title: "The Village of Ravenbrook",
    text: "Nestled deep within the ancient, mist-shrouded pines of the Blackwood Forest lies the village of Ravenbrook. For generations, the villagers lived in peace, protected by the eerie silence of the woods.",
    image: "https://images.unsplash.com/photo-1542223616-949fb1e28b15?q=80&w=2000&auto=format&fit=crop"
  },
  {
    title: "A Dark Curse",
    text: "But an ancient curse has awakened. By day, they are friends, neighbors, and kin. But when the full moon rises, a dark transformation occurs. Werewolves lurk among them, thirsty for blood.",
    image: "https://images.unsplash.com/photo-1514373941175-5ca31cb0f2fd?q=80&w=2000&auto=format&fit=crop"
  },
  {
    title: "Trust No One",
    text: "Every night, the wolves claim a victim. Every day, the villagers must investigate, argue, and vote to lynch those they suspect to be beasts. Who is telling the truth? Who is lying? Only time will tell.",
    image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=2000&auto=format&fit=crop"
  },
  {
    title: "Survive the Night",
    text: "Use your role to your advantage. The Seer may uncover the truth. The Witch holds the power of life and death. The Little Girl can peek through the shadows. Will the villagers survive, or will Ravenbrook fall to the wolves?",
    image: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=2000&auto=format&fit=crop"
  }
];

export default function IntroStory({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Preload images
  useEffect(() => {
    storySlides.forEach(slide => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);

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
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
          <img src={storySlides[currentSlide].image} alt="Story background" className="w-full h-full object-cover opacity-60" />
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
