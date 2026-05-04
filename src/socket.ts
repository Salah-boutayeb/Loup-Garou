import { io, Socket } from 'socket.io-client';

// We reuse the same host and port by default
const URL = process.env.NODE_ENV === 'production' ? window.location.origin : window.location.origin;

export const socket: Socket = io(URL, {
  autoConnect: true,
});
