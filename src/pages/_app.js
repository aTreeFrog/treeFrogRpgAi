import '@/styles/globals.css'
import io from 'Socket.IO-client'
import SocketContext from '../context/SocketContext'
import { useState, useEffect, useRef } from "react";

export default function App({ Component, pageProps }) {
  const [chatSocket, setChatSocket] = useState(null);
  const userName = "aTreeFrog";

  useEffect(() => {
    // Initialize the WebSocket connection
    let newSocket = null;
    const connectToSocket = () => {
      if (!chatSocket) {
        const chatUrl = '/api/chat';
        const newSocket = io('http://localhost:3000', { path: chatUrl });

        newSocket.on('connect', () => {
          console.log('Connected to socket');
          newSocket.emit('user name', userName);
          setChatSocket(newSocket);
        });

        newSocket.on('connect_error', (err) => {
          console.error('Connection Error:', err);
          newSocket.disconnect();
          setTimeout(() => {
            console.log(`Retrying connection`);
            connectToSocket();
          }, 3000); // Retry after 3 seconds

        });
      }

    }

    if (!chatSocket) {
      connectToSocket();
    }

    return () => {
      if (chatSocket) {
        newSocket.off('connect');
        newSocket.off('connect_error');
        newSocket.disconnect();
      }
      // Disconnect socket when app is unmounted
    };
  }, []);

  useEffect(() => {
    // Initialize the WebSocket connection
    console.log("socket: ", chatSocket)
  }, [chatSocket]);

  return (
    <SocketContext.Provider value={{ chatSocket, userName }} className="bg-gray-800">
      {chatSocket ? <Component {...pageProps} /> : <div>Loading...</div>}
    </SocketContext.Provider>
  )
}
