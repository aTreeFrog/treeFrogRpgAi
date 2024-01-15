import '@/styles/globals.css'
import SocketContext from '../context/SocketContext'
import { useState, useEffect, useRef } from "react";
import { chatSocket } from '../context/SocketSingleton'

export default function App({ Component, pageProps }) {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize the WebSocket connection
    if (!socketRef.current) {
      socketRef.current = chatSocket();
      setSocket(socketRef.current);
    }

    return () => {

    };
  }, []);

  useEffect(() => {
    // Initialize the WebSocket connection
    console.log("socket: ", socket)
  }, [socket]);

  return (
    <div className="bg-gray-800">
      {socket ? <Component {...pageProps} /> : <div>Loading...</div>}
    </div>
  )
}
