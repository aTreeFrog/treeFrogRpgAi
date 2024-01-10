// server.js at the root of your project
const express = require('express');
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const OpenAI = require('openai');
const path = require("path");
const fs = require('fs');
const stream = require('stream');
const FormData = require('form-data');
// Dynamically import 'node-fetch'
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const speechFile = path.resolve("./speech.mp3");

const shouldContinue = {};

let activityCount = 1;

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

        //Dice Roll Function Message Creator and sender
        function sendDiceRollMessage() {
            const uniqueId = `activity${activityCount}-${new Date().toISOString()}`;
            const diceRollMessage = {
                Action: "DiceRoll",
                D20: true,
                D10: false,
                D8: false,
                D6: false,
                D4: false,
                Skill: "Deception",
                Advantage: false,
                Disadvantage: false,
                Id: uniqueId,
                User: "aTreeFrog"
            };
            // Sending the message to the connected client
            socket.emit('dice roll', diceRollMessage);
            activityCount++;
        }

        socket.on('chat message', async (msg) => {
            try {
                console.log("is this getting called?")
                if (shouldContinue[socket.id]) {
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
                }
                console.log('made it to chat complete');
                socket.emit('chat complete');
                sendDiceRollMessage();//////for testing
            } catch (error) {
                console.error('Error:', error);
                socket.emit('error', 'Error processing your message');
            }
        });

        const queue = []; // Initialize an empty queue

        socket.on('audio message', async (msg) => {
            queue.push(msg); // Add incoming messages to the queue
            processQueue(); // Trigger processing (if not already in progress)
        });

        let sequenceNumber = 0;

        socket.on('reset audio sequence', async (msg) => {
            sequenceNumber = 0;
        });

        async function processQueue() {
            if (shouldContinue[socket.id] && queue.length > 0) {
                const msg = queue.shift();
                const currentSequence = sequenceNumber++;
                try {
                    console.log("audio is getting called?")
                    console.log("audio msg: ", msg);
                    const mp3 = await openai.audio.speech.create(msg);
                    const buffer = Buffer.from(await mp3.arrayBuffer());
                    // Emit the buffer to the client
                    socket.emit('play audio', { audio: buffer.toString('base64'), sequence: currentSequence });

                } catch (error) {
                    console.error('Error:', error);
                    socket.emit('error', 'Error processing your audio message: ', 'sequence', currentSequence);
                } finally {
                    if (queue.length > 0) {
                        processQueue(); // If there are more items, continue processing
                    }
                }
            }
        }

        socket.on('cancel processing', () => {
            shouldContinue[socket.id] = false; // Set shouldContinue to false for this socket
        });

        socket.on('resume processing', () => {
            shouldContinue[socket.id] = true;
        });

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });

        //jitsi integration
        // Handle creating a meeting
        socket.on('create-meeting', () => {
            const roomName = "Room-" + Date.now(); // Generate unique room name
            const meetingUrl = `https://meet.jit.si/${encodeURIComponent(roomName)}`;



            // Emit back the room details
            socket.emit('meeting-created', {
                roomName: roomName,
                meetingUrl: `https://meet.jit.si/${encodeURIComponent(roomName)}`,
                message: "Meeting created"
            });
        });

        // Handle ending a meeting
        socket.on('end-meeting', () => {
            // Implement logic to handle ending the meeting
            socket.emit('meeting-ended', {
                message: "Meeting ended"
            });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('User disconnected');
        });

        socket.on('player audio stream', async arrayBuffer => {
            // Convert ArrayBuffer to Buffer
            console.log("arrayBuffer: ", arrayBuffer);
            const buffer = Buffer.from(arrayBuffer);
            console.log("buffer: ", buffer)
            const filePath = "src/temp/input.webm";
            fs.writeFileSync(filePath, buffer);
            const readStream = fs.createReadStream(filePath);

            const data = {
                model: "whisper-1",
                file: readStream,
                language: "en"
            };
            const sttData = await openai.audio.transcriptions.create(data);
            socket.emit('speech to text data', sttData);
            fs.unlinkSync(filePath); // deletes file

        });

    });

    wsServer.listen(3001, () => {
        console.log('WebSocket Server is running on http://localhost:3001');
    });
});
