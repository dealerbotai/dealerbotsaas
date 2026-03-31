import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SERVER_URL;

export const socket = io(socketUrl, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 5000,
});

socket.on('connect', () => {
    console.log('✅ Conectado al servidor de WebSocket');
});

socket.on('disconnect', () => {
    console.log('❌ Desconectado del servidor de WebSocket');
});
