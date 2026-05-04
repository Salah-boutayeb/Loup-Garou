import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { socket } from '../socket';
import { Moon, QrCode } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function Home() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [showScanner, setShowScanner] = useState(false);

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

  const handleJoin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomCode.trim()) return;
    
    let code = roomCode.trim();
    if (code.includes('/room/')) {
      code = code.split('/room/')[1];
    }
    navigate(`/room/${code}`);
  };

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const text = detectedCodes[0].rawValue;
      if (text) {
        let code = text.trim();
        if (code.includes('/room/')) {
          code = code.split('/room/')[1];
        }
        navigate(`/room/${code}`);
      }
    }
  };

  const handleScanError = (err: unknown) => {
    console.error(err);
    alert('Camera permission denied or camera not found. Please type the room code manually.');
    setShowScanner(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full text-center space-y-10 glass p-8 md:p-12">
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
          className="btn-primary w-full py-4 text-base uppercase tracking-widest"
        >
          {isCreating ? 'Conjuring...' : 'Create Room'}
        </button>

        <div className="relative flex items-center justify-center pt-2">
          <div className="border-t border-white/10 w-full"></div>
          <span className="absolute bg-[#1a1a24] px-4 text-xs tracking-widest uppercase text-white/40">Or</span>
        </div>

        {showScanner ? (
          <div className="space-y-4 bg-black/40 p-4 rounded-lg">
            <div className="rounded overflow-hidden">
              <Scanner onScan={handleScan} onError={handleScanError} />
            </div>
            <button 
              onClick={() => setShowScanner(false)}
              className="text-xs uppercase tracking-widest text-white/50 hover:text-white"
            >
              Cancel Scan
            </button>
          </div>
        ) : (
          <div className="bg-black/20 p-5 rounded-lg border border-white/5 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-white/60 mb-2 font-bold text-left">Join Existing Village</h3>
            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <input 
                type="text" 
                value={roomCode}
                onChange={e => setRoomCode(e.target.value)}
                placeholder="Paste Link or Code"
                className="w-full bg-[#151520] border border-white/10 rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ff4d4d] transition-colors"
              />
              <div className="flex gap-2">
                <button 
                  type="submit"
                  disabled={!roomCode.trim()}
                  className="btn-secondary flex-1 py-3"
                >
                  Join
                </button>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="bg-[#2a2a35] hover:bg-[#3a3a45] text-white p-3 rounded flex items-center justify-center transition-colors border border-white/10"
                  aria-label="Scan QR Code"
                >
                  <QrCode className="w-5 h-5 text-white/70" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
