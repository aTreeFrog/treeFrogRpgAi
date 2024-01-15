// socketSingleton.js
import io from 'socket.io-client';

let socket = null;

export const chatSocket = () => {
    if (!socket) {
        const chatUrl = '/api/chat';
        const socket = io('http://localhost:3000', { path: chatUrl });
        socket.on('connect', () => console.log('Connected to socket'));
        // Add other event listeners or configuration here
    }
    return socket;
};

export default chatSocket;
