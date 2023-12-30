// server.js at the root of your project
const express = require('express');
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const OpenAI = require('openai');
const path = require("path");
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const speechFile = path.resolve("./speech.mp3");

const shouldContinue = {};

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

        shouldContinue[socket.id] = true; //front end can cancel this to break chat completion

        socket.on('chat message', async (msg) => {
            try {
                console.log("is this getting called?")
                const completion = await openai.chat.completions.create(msg);
                console.log(completion)

                for await (const chunk of completion) {
                    console.log(chunk.choices[0]?.delta?.content);
                    // Check if we should continue before emitting the next chunk
                    if (!shouldContinue[socket.id]) {
                        break; // Exit the loop if instructed to stop
                    }
                    socket.emit('chat message', chunk.choices[0]?.delta?.content || "");
                }
            } catch (error) {
                console.error('Error:', error);
                socket.emit('error', 'Error processing your message');
            }
        });

        socket.on('audio message', async (msg) => {
            try {
                console.log("audio is getting called?")
                const mp3 = await openai.audio.speech.create(msg);
                console.log(speechFile);
                const buffer = Buffer.from(await mp3.arrayBuffer());
                // Emit the buffer to the client
                socket.emit('play audio', { audio: buffer.toString('base64') });

            } catch (error) {
                console.error('Error:', error);
                socket.emit('error', 'Error processing your audio message');
            }
        });

        socket.on('cancel processing', () => {
            shouldContinue[socket.id] = false; // Set shouldContinue to false for this socket
        });

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });

    wsServer.listen(3001, () => {
        console.log('WebSocket Server is running on http://localhost:3001');
    });
});
