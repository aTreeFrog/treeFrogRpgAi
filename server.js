// server.js at the root of your project
const express = require('express');
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const OpenAI = require('openai');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.prepare().then(() => {
    // HTTP Server for Next.js
    const httpServer = express();

    httpServer.all('*', (req, res) => {
        return handle(req, res);
    });

    const nextJsServer = createServer(httpServer);

    nextJsServer.listen(3000, () => {
        console.log('Next.js is ready on http://localhost:3000');
    });

    // Separate HTTP Server for WebSocket
    const wsServer = createServer((req, res) => {
        res.writeHead(404);
        res.end();
    });

    const io = new Server(wsServer, {
        path: '/api/chat',
        cors: {
            origin: "*",  // Adjust as necessary
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('a user connected:', socket.id);

        socket.on('chat message', async (msg) => {
            try {
                console.log("is this getting called?")
                const completion = await openai.chat.completions.create(msg);
                console.log(completion)

                for await (const chunk of completion) {
                    console.log("chunk: ", chunk.choices[0]?.delta?.content);
                    process.stdout.write(chunk.choices[0]?.delta?.content || "");
                }
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

    wsServer.listen(3001, () => {
        console.log('WebSocket Server is running on http://localhost:3001');
    });
});
