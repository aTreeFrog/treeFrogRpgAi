// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import axios from 'axios';
import OpenAI from "openai";
import WebSocket from 'ws';
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';


const app = express();
// Enable All CORS Requests for simplicity or configure as needed
app.use(cors());

const server = createServer(app);

const io = new Server(server, {
  path: '/api/chat',
  cors: {
    origin: "http://localhost:3000",  // or '*' for all origins
    methods: ["GET", "POST"]
  }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default function handler(req, res) {
  // Stub response for Next.js API route requirement
  res.status(200).json({ message: 'This is a stub for the WebSocket server.' });

}

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // Handle message event
  socket.on('chat message', async (msg) => {
    try {
      const completion = await openai.chat.completions.create(msg);
      console.log(completion)
      socket.emit('chat message', completion);
    } catch (error) {
      console.error('Error:', error);
      socket.emit('error', 'Error processing your message');
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});

// export default async function handler(req, res) {
//   const referer = req.headers.referer || req.headers.referrer; // get the referer from the request headers

//   if (req.method !== 'POST') {
//     res.status(405).json({ message: 'Method should be POST' });
//   } else if (process.env.NODE_ENV !== "development") {
//     if (!referer || referer !== process.env.APP_URL) {
//       res.status(401).json({ message: 'Unauthorized' });
//     }
//   }
//   else {
//     try {

//       const { body } = req;
//       const completion = await openai.chat.completions.create(body);
//       console.log(completion.choices[0]);
//       res.status(200).json(completion);

//     } catch (error) {
//       console.log(error);
//       res.status(500).json({ message: "Something went wrong" });
//     }
//   }

// }
