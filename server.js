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
let activityCount = 1
let chatMessages = [];
let waitingForUser = false;
const clients = {};
const players = {};
let responseSent = new Map();
let waitingForRolls = false;
let awayPlayerCount = 1
let settingUpNewScene = false;
let msgActivityCount = 1;

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

        async function summarizeAndMoveOn() {

            settingUpNewScene = true;

            for (let userName in players) {
                if (players.hasOwnProperty(userName)) {
                    players[userName].active = false;
                    players[userName].active = false;
                    players[userName].currentHealth = players[userName].maxHealth;
                    players[userName].diceStates = defaultDiceStates;
                    players[userName].mode = "story"

                }
            }

            let messagesFilteredForApi = chatMessages.map(item => ({
                role: item.role,
                content: item.content,
            }));

            messagesFilteredForApi.push({ "role": "user", "content": "The players decided to move on without wrapping up this scene. please summarize the story so far, including the details of the decisions each player made so far. Then, make a decision on what the next scene will entale. Even if you were waiting on players to do something, move onto the next scene. Tell us where the players are heading." })

            const data = {
                model: "gpt-4",
                messages: messagesFilteredForApi,
                stream: true,
            };

            let outputMsg = "";

            const completion = await openai.chat.completions.create(data);

            for await (const chunk of completion) {

                outputStream = chunk.choices[0]?.delta?.content;
                outputMsg += outputStream;
                io.to(serverRoomName).emit('chat message', outputStream || "");
            }
            io.to(serverRoomName).emit('chat complete');

            //start chatMessages over again. But dont forget to add instructions to this list.
            chatMessages = [];
            chatMessages.push({ "role": "assistant", "content": outputMsg, "processed": true });

            settingUpNewScene = false;

            //need to call function to determine which scene we need to setup next. 



        }

        async function processMessages() {

            while (true) {

                if (!waitingForUser && !waitingForRolls && !settingUpNewScene) {

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

                        serverMessageId = `user-Assistant-activity-${msgActivityCount}-${new Date().toISOString()}`;

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
        async function sendDiceRollMessage(skillValue, advantageValue, users) {

            //find number of active players. If more then one, set timer to make game faster
            let activePlayers = 0;
            for (let key in players) {
                if (players.hasOwnProperty(key) && !players[key].away) {
                    activePlayers++;
                }
            }

            if (typeof users === 'string') {
                //ai sent the users as a string with , seperated. instead of an array. So need to filter
                var namesArray = users.split(',');
            } else {
                var namesArray = users;
            }

            for (var i = 0; i < namesArray.length; i++) {
                let user = namesArray[i].trim();

                console.log("user: ", user)

                if (players[user] && players[user]?.mode != "dice" && !players[user].away) {

                    players[user].active = true;
                    players[user].mode = "dice";
                    players[user].activeSkill = skillValue.length > 0;
                    players[user].skill = skillValue;
                    players[user].activityId = `user${user}-activity${activityCount}-${new Date().toISOString()}`;

                    players[user].diceStates.D20 = {
                        value: [],
                        isActive: true,
                        isGlowActive: true,
                        rolls: 0,
                        displayedValue: null,
                        inhibit: false,
                        advantage: advantageValue,
                    }
                    waitingForRolls = true;

                    if (activePlayers > 0) {

                        players[user].timers.duration = 30000;
                        players[user].timers.enabled = true;
                        await waitAndCall(players[user].timers.duration, () => forceResetCheck(players[user]));
                    }
                }

            }

            function waitAndCall(duration, func) {
                return new Promise(resolve => {
                    setTimeout(() => {
                        func();
                        resolve();
                    }, duration);
                });
            }

            // if timer expired and player is still active, set them to away and not active and
            // send default dice roll message to AI to take them out of the game. 
            function forceResetCheck(player) {
                if (player.active) {

                    console.log("forceResetCheck");

                    let message = "Game master, I stepped away from the game. Please do not include me in your story until I return."
                    const uniqueId = `user${player.name}-activity${awayPlayerCount}-${new Date().toISOString()}`;
                    let serverData = { "role": 'user', "content": message, "processed": false, "id": uniqueId, "mode": "All" };
                    awayPlayerCount++;
                    //send message to users and ai
                    chatMessages.push(serverData);
                    io.to(serverRoomName).emit('latest user message', serverData);
                    responseSent.set(serverData.id, true);
                    makePlayerInactive(player)

                }
            }

            function makePlayerInactive(player) {
                player.active = false;
                player.away = true;
                player.mode = "story";
                player.diceStates = defaultDiceStates;
                player.skill = "";
                player.activeSkill = false;
                player.timers.enabled = false;
                player.activityId = `user${player.name}-activity${activityCount}-${new Date().toISOString()}`;
                activityCount++;

                //send updated entire players object to room
                io.emit('players objects', players);

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

            io.to(serverRoomName).emit('players objects', players);

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
            console.log("messagesFilteredForFunction", messagesFilteredForFunction);
            //just see if you should call function based on last ai message
            let latestAssistantMessage = [messagesFilteredForFunction.findLast(item => item.role === "assistant")];
            console.log("latestAssistantMessage", latestAssistantMessage);
            //only check it to do the roll function if you sense d20 and roll in the ai statement
            if (latestAssistantMessage[0].content.toLowerCase().includes("d20") && latestAssistantMessage[0].content.toLowerCase().includes("roll")) {

                latestAssistantMessage.push({ "role": "user", "content": "did you specifically request a user to roll a d20 dice? If so, call the sendDiceRollMessage function." })
                console.log("latestAssistantMessage", latestAssistantMessage);
                const data = {
                    model: "gpt-4",
                    messages: latestAssistantMessage,
                    stream: false,
                    tools: [
                        {
                            type: "function",
                            function: {
                                name: "sendDiceRollMessage",
                                description: "function that should be called anytime the AI assistant asks a user to roll a d20 dice.",
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

                latestAssistantMessage.pop() //remove what i just added
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
                        await sendDiceRollMessage(skillValue, advantageValue, usersValue);

                        // return; //dont check for any other function to get called
                    }

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
                    createDallEImage(promptValue);  ////////////TURN BACK ON!!!////////////////
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


            io.to(serverRoomName).emit('players objects', players);


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
                mode: "story",
                timers: {
                    duration: 30000, //milliseconds
                    enabled: false
                }
            };

            players[userName] = newPlayer;
            players[userName].activityId = `user${userName}-activity${activityCount}-${new Date().toISOString()}`
            activityCount++;

            console.log("new players joined: ", players);

            io.to(serverRoomName).emit('players objects', players);

        });

        socket.on('obtain all users', () => {

            io.emit('connected users', Object.keys(clients));

            io.emit('players objects', players);

        });


        socket.on('D20 Dice Roll Complete', (diceData) => {

            players[diceData.User].active = false;
            players[diceData.User].away = false;
            players[diceData.User].mode = "story";
            players[diceData.User].diceStates = defaultDiceStates;
            players[diceData.User].skill = "";
            players[diceData.User].activeSkill = false;
            players[diceData.User].timers.enabled = false;
            players[diceData.User].activityId = `user${diceData.User}-activity${activityCount}-${new Date().toISOString()}`;
            activityCount++;
            io.emit('players objects', players);

        });

        socket.on('playing again', (userName) => {

            //check if any players not away is in battle mode. If so, put this returned player in battle mode
            const battleModeActive = Object.values(players).some(value => !value.away && value.mode === "battle");

            if (battleModeActive) {
                players[userName].mode = "battle";
            } else {
                players[userName].mode = "story";
            }

            players[userName].active = true;
            players[userName].away = false;
            players[userName].diceStates = defaultDiceStates;
            players[userName].activeSkill = false;
            players[userName].activityId = `user${userName}-activity${activityCount}-${new Date().toISOString()}`;
            activityCount++;

            io.emit('players objects', players);

        });

        socket.on('story move on', () => {

            let message = "Activated move to next scene sequence"
            const uniqueId = `user${player.name}-activity${awayPlayerCount}-${new Date().toISOString()}`;
            let serverData = { "role": 'user', "content": message, "processed": false, "id": uniqueId, "mode": "All" };
            io.to(serverRoomName).emit('latest user message', serverData);

            summarizeAndMoveOn();

        });

        processMessages();

    });



    async function checkPlayersState() {

        let anyPlayerRoll = false
        Object.entries(players).forEach(([userName, playerData]) => {

            if (playerData.mode == "dice" && playerData.active && !playerData.away) {
                anyPlayerRoll = true;
            }

        });

        if (anyPlayerRoll) {
            waitingForRolls = true;
        } else {
            waitingForRolls = false;
        }

        io.emit('players objects', players);

    };

    setInterval(checkPlayersState, 1000);

    setInterval(() => {
        responseSent.clear();
    }, 1000 * 60 * 30); // Clear every 30 mins, for example

    // wsServer.listen(3001, () => {
    //     console.log('WebSocket Server is running on http://localhost:3001');
    // });
});
