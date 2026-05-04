import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { socket } from '../socket';
import { Moon } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  // Initialize or retrieve userId
  useEffect(() => {
    if (!sessionStorage.getItem('userId')) {
      sessionStorage.setItem('userId', uuidv4());
    }
  }, []);

  const handleCreateRoom = () => {
    setIsCreating(true);
    const roomId = uuidv4().substring(0, 8); // Short UUID for URL
    const userId = sessionStorage.getItem('userId');
    
    socket.emit('create-room', { roomId, userId });
    
    // We listen for confirmation
    socket.once('room-created', (room) => {
      navigate(`/room/${room.id}`);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full text-center space-y-12 glass p-12">
        <div className="space-y-4">
          <Moon className="w-16 h-16 mx-auto text-[#ff4d4d]" />
          <h1 className="text-3xl font-bold tracking-widest text-white uppercase mt-4">
            Miller's <span className="text-[#ff4d4d]">Hollow</span>
          </h1>
          <p className="text-sm text-white/50">
            The village sleeps. The wolves awaken.
          </p>
        </div>

        <button
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="btn-primary w-full py-3 text-base uppercase tracking-widest"
        >
          {isCreating ? 'Conjuring...' : 'Create Room'}
        </button>
      </div>
    </div>
  );
}
