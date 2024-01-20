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
const { player } = require('./lib/objects/player');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const speechFile = path.resolve("./speech.mp3");

const defaultDiceStates = {
    d20: {
        value: [],
        isActive: true,
        isGlowActive: false,
        rolls: 0,
        displayedValue: null,
        inhibit: false,
        advantage: false,
    },
    d10: {
        value: [10],
        isActive: false,
        isGlowActive: false,
        rolls: 0,
        displayedValue: 10,
        inhibit: false,
        advantage: false,
    },
    d8: {
        value: [8],
        isActive: false,
        isGlowActive: false,
        rolls: 0,
        displayedValue: 8,
        inhibit: false,
        advantage: false,
    },
    d6: {
        value: [6],
        isActive: false,
        isGlowActive: false,
        rolls: 0,
        displayedValue: 6,
        inhibit: false,
        advantage: false,
    },
    d4: {
        value: [4],
        isActive: false,
        isGlowActive: false,
        rolls: 0,
        displayedValue: 4,
        inhibit: false,
        advantage: false,
    }
};

const shouldContinue = {};

let activityCount = 1;

const chatMessages = [];

let waitingForUser = false;
const clients = {};
const players = {};
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
                            model: "gpt-4",
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

        //Dice Roll Function Message Creator and sender
        function sendDiceRollMessage(skillValue, advantageValue, users) {



            var namesArray = users.split(',');

            for (var i = 0; i < namesArray.length; i++) {
                let user = namesArray[i].trim();

                console.log("user: ", user)

                if (players[user].mode != "dice") {

                    players[user].mode = "dice";
                    players[user].activeSkill = skillValue.length > 0;
                    players[user].skill = skillValue;
                    players[user].activityId = `activity${activityCount}-${new Date().toISOString()}`;

                    players[user].diceStates.D20 = {
                        value: [],
                        isActive: true,
                        isGlowActive: true,
                        rolls: 0,
                        displayedValue: null,
                        inhibit: false,
                        advantage: advantageValue,
                    }
                }

            }

            // const activityId = `activity${activityCount}-${new Date().toISOString()}`;
            // const diceRollMessage = {
            //     Action: "DiceRoll",
            //     D20: true,
            //     D10: false,
            //     D8: false,
            //     D6: false,
            //     D4: false,
            //     Skill: skillValue,
            //     Advantage: Boolean(advantageValue),
            //     Disadvantage: false,
            //     Id: uniqueId,
            //     User: "aTreeFrog"
            // };
            // Sending the message to the connected client
            //io.to(serverRoomName).emit('dice roll', diceRollMessage); //ToDo. determine who to send this too

            io.to(serverRoomName).emit('dice roll', players);

            activityCount++;
        };




        async function createDallEImage(prompt) {

            const ogprompt = "a dungeons and dragons like book image of a rogue and a wizard about to enter a tavern on a dark snowy night";

            const data = {
                model: "dall-e-3",
                prompt: ("a dungeons and dragons like book image with the following specification: ", prompt),
                n: 1,
                size: "1024x1024",
                quality: "hd",
            };

            let image = await openai.images.generate(data);

            io.to(serverRoomName).emit('dall e image', image.data[0].url);

            console.log("image: ", image.data);

        };





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
            messagesFilteredForFunction.push({ "role": "user", "content": "based on your last message, should you do a sendDiceRollMessage function call? Only do call if the last message by the assistant or bot specifically said to roll a d20 dice with some type of modifier. Do not call if the assistant or bot was saying the results of a role. But if you are sure that the message is requesting the user to roll the D20 dice again. Example would be please roll your D20 with a perception modifier. Ensure the message is not talking about the past explaining the outcome of a roll." })
            const data = {
                model: "gpt-4",
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
                                        enum: ['intelligence', 'investigation', 'nature', 'insight', 'stealth', 'deception'],
                                        description: "Based on the latest conversation from the assistant or bot, what type of skill modifier should be added to the d20 dice roll."
                                    },
                                    advantage: {
                                        type: "boolean",
                                        description: "Determine if the d20 dice roll should be rolled with advantage. The message from the bot or assistant would say the words advantage indicating to do so."
                                    },
                                    users: {
                                        type: "array",
                                        enum: Object.keys(clients),
                                        description: "Based on the latest conversation history. the Assistant or bot says exactly which players should roll the d20. look for all the players that need to role and add them to this array."
                                    },
                                },
                                required: ["skill", "advantage", "users"],
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
                    usersValue = argumentsJson.users
                    sendDiceRollMessage(skillValue, advantageValue, usersValue);

                    // return; //dont check for any other function to get called
                }

            }


            //check if dall e function should be called
            messagesFilteredForFunction.push({ "role": "user", "content": "Based on this prompt history, has a new scenery change just been made? If so, call the function createDallEImage." })
            const dallEdata = {
                model: "gpt-4",
                messages: messagesFilteredForFunction,
                stream: false,
                tools: [
                    {
                        type: "function",
                        function: {
                            name: "createDallEImage",
                            description: "creates a Dall E image based on the prompt given. The prompt should always be in a dungeons and dragons game theme. Fantasy descriptions and worlds. The prompt will produce an image you would see in a fantasy role playing game book. The prompt should be describing the new scenery we are in.",
                            parameters: {
                                type: "object",
                                properties: {
                                    prompt: {
                                        type: "string",
                                        description: "The prompt describing what the image should entale. The image should be in the fantasy setting and resemble artwork used in dungeon and dragons role playing games."
                                    },
                                },
                                required: ["prompt"],
                            }
                        }
                    }
                ]
            };

            messagesFilteredForFunction.pop() //remove what i just added
            const dallEcompletion = await openai.chat.completions.create(dallEdata);
            console.log("checking function call completion: ", dallEcompletion.choices[0].finish_reason);

            if (dallEcompletion.choices[0].finish_reason == "tool_calls") {
                functionData = dallEcompletion.choices[0].message.tool_calls[0].function;
                console.log("checking function call data : ", functionData);

                if (functionData.name == "createDallEImage") {
                    argumentsJson = JSON.parse(functionData.arguments);
                    promptValue = argumentsJson.prompt;
                    createDallEImage(promptValue);
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
                //playBackgroundAudio();////////////////////////for testing//////////
                //createDallEImage("two wizards walking through the forest. Both male. Looking like there could be trouble nearby. lush green forest. nature in an mystical world.");
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
            // Remove the user from the map on disconnect
            for (let userName in clients) {
                if (clients[userName] === socket.id) {
                    delete clients[userName];

                    //remove the user from the players array
                    if (userName in players) {
                        delete players[userName]
                    }

                    break;
                }
            }
            // Emit the updated list of connected users
            io.to(serverRoomName).emit('connected users', Object.keys(clients));


            io.to(serverRoomName).emit('players dictionary', players);


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

        socket.on('user name', (userName) => {

            if (clients[userName] && clients[userName] !== socket.id) {
                // Disconnect the previous socket
                let oldSocket = io.sockets.sockets.get(clients[userName]);
                if (oldSocket) {
                    oldSocket.disconnect(true);
                }
            }

            // Update the map with the new socket ID
            clients[userName] = socket.id;

            io.to(serverRoomName).emit('connected users', Object.keys(clients));

            //delete existing player data if already there and start fresh if user connects
            if (userName in players) {
                delete players[userName]
            }

            //mock obtaining player info from mongodb
            let newPlayer = {
                ...players, // This copies all keys from players object
                name: userName,
                active: false,
                away: false,
                class: "Wizard",
                race: "Elf",
                distance: 30,
                attacks: [{
                    name: "staff",
                    attackBonus: 5,
                    damage: "2d6+2",
                    type: "melee",
                    distance: 5
                }],
                initiative: 5,
                armorClass: 14,
                maxHealth: 30,
                currentHealth: 30,
                xPosition: 0,
                yPosition: 0,
                diceStates: defaultDiceStates,
                mode: "story"
            };

            players[userName] = newPlayer;

            console.log("new players joined: ", players);

            io.to(serverRoomName).emit('players dictionary', players);

        });

        socket.on('obtain all users', () => {

            io.emit('connected users', Object.keys(clients));

            io.emit('players dictionary', players);

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
