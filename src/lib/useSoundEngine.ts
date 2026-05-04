import { useEffect, useRef } from 'react';

// Placeholders for sound files
const SOUND_FILES = {
  night: '/sounds/night-wind.mp3', // Eerie wind or crickets
  howl: '/sounds/wolf-howl.mp3', // The kill
  gavel: '/sounds/gavel-vote.mp3', // The vote
  victory: '/sounds/victory-orchestral.mp3', // Villagers win
  defeat: '/sounds/defeat-cello.mp3', // Villagers lose / Wolves win
};

export function useSoundEngine(isMuted: boolean) {
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    // Preload audio objects
    Object.entries(SOUND_FILES).forEach(([key, src]) => {
      audioRefs.current[key] = new Audio(src);
    });
  }, []);

  const playSound = (soundName: keyof typeof SOUND_FILES) => {
    if (isMuted) return;
    const audio = audioRefs.current[soundName];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(err => {
        // Silently bypass autoplay errors that occur before user interaction
        console.warn(`Could not play sound: ${soundName}`, err);
      });
    }
  };

  return { playSound };
}
