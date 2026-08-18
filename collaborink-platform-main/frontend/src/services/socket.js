// frontend/src/services/socket.js
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket;

export function initSocket() {
  if (socket) return socket;
  const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
  socket = io(url, { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    const { user } = useAuthStore.getState();
    if (user && user._id) socket.emit('user:online', user._id);
  });

  return socket;
}

export function joinRoom(room) {
  if (!socket) return;
  socket.emit('room:join', room);
}

export function leaveRoom(room) {
  if (!socket) return;
  socket.emit('room:leave', room);
}

export function on(event, cb) {
  if (!socket) return;
  socket.on(event, cb);
}

export function off(event, cb) {
  if (!socket) return;
  socket.off(event, cb);
}

export function emit(event, payload) {
  if (!socket) return;
  socket.emit(event, payload);
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}