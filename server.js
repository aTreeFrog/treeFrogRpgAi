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

const chatMessages = [];

let waitingForUser = false;
const clients = {};
let responseSent = new Map();

serverRoomName = "WizardsAndGoblinsRoom";

app.prepare().then(() => {
    // HTTP Server for Next.js
    const httpServer = express();

    httpServer.all('*', (req, res) => {
        return handle(req, res);
    });

    console.log("__dirname: ", __dirname);
    // to handle sending audio urls to front end
    httpServer.use('/audio', express.static('public/audio'));

    httpServer.all('*', (req, res) => {
        return handle(req, res);
    });


    const nextJsServer = createServer(httpServer);

    // Separate HTTP Server for WebSocket
    // const wsServer = createServer((req, res) => {
    //     res.writeHead(404);
    //     res.end();
    // });

    nextJsServer.listen(3000, () => {
        console.log('Next.js is ready on http://localhost:3000');

    });

    const io = new Server(nextJsServer, {
        path: '/api/chat',
        cors: {
            origin: "*",  // Adjust as necessary
            methods: ["GET", "POST"]
        }
    });


    io.on('connection', (socket) => {

        async function processMessages() {

            while (true) {

                if (!waitingForUser) {

                    let unprocessedUserMessages = chatMessages.filter(message => message.role === 'user' && !message.processed);

                    if (unprocessedUserMessages.length > 0) {
                        let outputMsg = "";
                        chatMessages.forEach(message => {
                            message.processed = true;
                        });
                        console.log("checking chat messages");
                        let messagesFilteredForApi = chatMessages.map(item => ({
                            role: item.role,
                            content: item.content,
                        }));

                        const data = {
                            model: "gpt-4-1106-preview",
                            messages: messagesFilteredForApi,
                            stream: true,
                        };

                        const completion = await openai.chat.completions.create(data);

                        console.log("completion: ", completion);

                        for await (const chunk of completion) {

                            // // Check if we should continue before emitting the next chunk
                            // if (!shouldContinue[socket.id]) {
                            //     break; // Exit the loop if instructed to stop
                            // }

                            outputStream = chunk.choices[0]?.delta?.content;
                            outputMsg += outputStream;
                            io.to(serverRoomName).emit('chat message', outputStream || "");
                        }

                        console.log('made it to chat complete');
                        io.to(serverRoomName).emit('chat complete');
                        chatMessages.push({ "role": "assistant", "content": outputMsg, "processed": true });

                        // if all messages are processed, check for function call now
                        if ((chatMessages.filter(message => !message.processed)).length == 0) {
                            await checkForFunctionCall();
                        }
                    };

                }

                await new Promise(resolve => setTimeout(resolve, 200)); // Wait a bit before checking again
            }
        };

        socket.join(serverRoomName); //name of conference room
        console.log('a user connected:', socket.id);
        clients[socket.id] = socket;

        //Dice Roll Function Message Creator and sender
        function sendDiceRollMessage(skillValue, advantageValue) {
            const uniqueId = `activity${activityCount}-${new Date().toISOString()}`;
            const diceRollMessage = {
                Action: "DiceRoll",
                D20: true,
                D10: false,
                D8: false,
                D6: false,
                D4: false,
                Skill: skillValue,
                Advantage: Boolean(advantageValue),
                Disadvantage: false,
                Id: uniqueId,
                User: "aTreeFrog"
            };
            // Sending the message to the connected client
            io.to(serverRoomName).emit('dice roll', diceRollMessage); //ToDo. determine who to send this too
            activityCount++;
        }

        // socket.on('chat message', async (msg) => {
        //     try {
        //         playBackgroundAudio();////////////////////////for testing//////////
        //         outputMsg = "";
        //         chatMessages.push(msg); //ToDo: need to identify which user is speaking
        //         console.log("is this getting called?")

        //     } catch (error) {
        //         console.error('Error:', error);
        //         socket.emit('error', 'Error processing your message'); // say to which client
        //     }
        // });

        const queue = []; // Initialize an empty queue

        socket.on('audio message', async (msg) => {

            async function processQueue() {
                if (shouldContinue[socket.id] && queue.length > 0) {
                    const msg = queue.shift();
                    const currentSequence = sequenceNumber++;
                    try {
                        console.log("audio is getting called?");
                        console.log("audio msg: ", msg);
                        const mp3 = await openai.audio.speech.create(msg);
                        const buffer = Buffer.from(await mp3.arrayBuffer());
                        // Emit the buffer to the client
                        socket.emit('play audio', { audio: buffer.toString('base64'), sequence: currentSequence }); //ToDo. for specific user

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

            console.log("audio message: ", msg);
            queue.push(msg); // Add incoming messages to the queue
            processQueue(); // Trigger processing (if not already in progress)//////TURNED OFF
        });

        let sequenceNumber = 0;

        socket.on('reset audio sequence', async (msg) => {
            sequenceNumber = 0;
        });

        async function checkForFunctionCall() {

            let messagesFilteredForFunction = chatMessages.map(item => ({
                role: item.role,
                content: item.content,
            }));
            messagesFilteredForFunction.push({ "role": "user", "content": "based on your last message, should you do a sendDiceRollMessage function call? Should only ask if the last message by the assistant or bot specifically said to roll a d20 dice." })
            const data = {
                model: "gpt-4-1106-preview",
                messages: messagesFilteredForFunction,
                stream: false,
                tools: [
                    {
                        type: "function",
                        function: {
                            name: "sendDiceRollMessage",
                            description: "Request the user to roll a d20 dice and to add a modifier based on Dungeons and Dragons style rules. Want the user to roll to determine the outcome of a decision based on the game. You, the AI bot, is the dungeon master. You should only call this function if the last message from the assistant, bot, ai specifically said to roll a d20 dice.",
                            parameters: {
                                type: "object",
                                properties: {
                                    skill: {
                                        type: "string",
                                        description: "Can be the following: deception, stealth, insight, nature, investigation, intelligence."
                                    },
                                    advantage: {
                                        type: "boolean",
                                        description: "Determine if the roll should be done with advantage. Usually if the player has an advantage in the situation."
                                    },
                                },
                                required: ["skill", "advantage"],
                            }
                        }
                    }
                ]
            };

            messagesFilteredForFunction.pop() //remove what i just added
            const completion = await openai.chat.completions.create(data);
            console.log("checking function call completion: ", completion.choices[0].finish_reason);

            if (completion.choices[0].finish_reason == "tool_calls") {
                functionData = completion.choices[0].message.tool_calls[0].function;
                console.log("checking function call data : ", functionData);

                if (functionData.name == "sendDiceRollMessage") {
                    argumentsJson = JSON.parse(functionData.arguments);
                    skillValue = argumentsJson.skill;
                    advantageValue = argumentsJson.advantage;
                    sendDiceRollMessage(skillValue, advantageValue);
                }

            }

        }

        async function playBackgroundAudio() {
            io.to(serverRoomName).emit('background music', { url: 'http://localhost:3000/audio/lord_of_the_land.mp3' });
        }

        socket.on('my user message', (msg) => {
            if (!responseSent.has(msg.id)) {
                waitingForUser = true;

                //means ai is supposed to see and respond to this message
                if (msg.mode.toLowerCase() == "all") {
                    chatMessages.push(msg);
                }
                console.log("chatMessages: ", chatMessages);
                console.log("received my user message, ", msg);
                io.to(serverRoomName).emit('latest user message', msg);
                responseSent.set(msg.id, true);
                playBackgroundAudio();////////////////////////for testing//////////
            }
        });


        socket.on('received user message', (msg) => {
            console.log("all done waiting");
            waitingForUser = false;
        });


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

            // Emit back the room details
            io.to(serverRoomName).emit('meeting-created', {
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
                language: "en",
                prompt: "ignore silence in the audio file." // helps produce same output if silent audio coming in
            };
            const sttData = await openai.audio.transcriptions.create(data);
            socket.emit('speech to text data', sttData);
            fs.unlinkSync(filePath); // deletes file

        });

        processMessages();

    });

    setInterval(() => {
        responseSent.clear();
    }, 1000 * 60 * 30); // Clear every 30 mins, for example

    // wsServer.listen(3001, () => {
    //     console.log('WebSocket Server is running on http://localhost:3001');
    // });
});
