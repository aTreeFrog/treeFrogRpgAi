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
const { game } = require('./lib/objects/game');
const enemies = require('./lib/enemies');
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const speechFile = path.resolve("./speech.mp3");
const ColorThief = require('colorthief');




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

let shouldContinue = {};
let activityCount = 1
let chatMessages = [];
let aiInOrderChatMessage = [];
let waitingForUser = false;
let clients = {};
let players = {};
let responseSent = new Map();
let waitingForRolls = false;
let awayPlayerCount = 1
let settingUpNewScene = false;
let msgActivityCount = 1;
let processingMessage = false;

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
    httpServer.use('/battlemaps', express.static('public/battleMaps'));
    httpServer.use('/images', express.static('public/images'));

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

        async function getDominantColor(imagePath) {
            try {
                const dominantColor = await ColorThief.getColor(imagePath);
                // Convert RGB to RGBA (assuming 0.8 opacity)
                return `rgba(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]}, 0.8)`;
            } catch (error) {
                console.error('Error in getting dominant color:', error);
                return null;
            }
        }

        async function enterBattleMode(mapName, backgroundMusic, enemyType, enemyCount) {
            const mapUrl = `http://localhost:3000/battlemaps/${mapName}.png`;
            const gridDataUrl = `http://localhost:3000/battlemaps/${mapName}.json`;
            const initGridLocFile = path.join(__dirname, '/public/battleMaps/InitGridLocations.json');
            const initGridData = JSON.parse(fs.readFileSync(initGridLocFile, 'utf8'));
            const initiativeUrl = 'http://localhost:3000/images/wizardclosegoblins.png';
            const backgroundSong = `http://localhost:3000/audio/${backgroundMusic}.mp3`;

            let shadowColor = await getDominantColor(initiativeUrl);

            const dateStamp = new Date().toISOString();
            //setup battle mode for the battle object
            game.mode = "battle";
            game.battleGrid = gridDataUrl;
            game.image = mapUrl;
            game.activityId = `game${serverRoomName}-activity${activityCount} -${dateStamp}`

            // place enemy fighters into the players object since they will fight in the game
            for (let j = 0; j < enemyCount; j++) {
                const enemyKey = `${enemyType}${j + 1}`;
                players[enemyKey] = { ...enemies[enemyType] }; // Create a new object for each enemy
                players[enemyKey].name = enemyKey;
                players[enemyKey].mode = "battle";
                players[enemyKey].initiative = Math.floor(Math.random() * 20) + 1; //between 1 and 20
                players[enemyKey].activityId = `user${enemyKey}-game${serverRoomName}-activity${activityCount}-${dateStamp}`;
                players[enemyKey].xPosition = initGridData[mapName].Enemies[j][0];
                players[enemyKey].yPosition = initGridData[mapName].Enemies[j][1];
                defaultPlayersBattleInitMode(enemyKey);

                console.log("xpos", players[enemyKey].xPosition);
                console.log("ypos", players[enemyKey].yPosition);
                console.log("all players with enemies", players);

            }

            let activePlayers = 0;
            //update players state for init battle mode
            let i = 0;
            for (let user in players) {

                // figure out how many active players
                if (players.hasOwnProperty(user) && !players[user].away && players[user].type == "player") {
                    activePlayers++;
                }

                if (players.hasOwnProperty(user) && players[user].type == "player") {

                    if (players[user].away) {
                        players[user].battleMode.initiativeRoll = 1;
                        players[user].mode = "battle" //avoid asking user to roll initiative
                        players[user].active = false;
                    } else {
                        //ToDo: figure out how to do the call for away thing for entering this mode
                        players[user].battleMode.initiativeRoll = 0;
                        players[user].mode = "initiative";
                        players[user].active = true;
                    }

                    players[user].xPosition = initGridData[mapName].Players[i][0];
                    players[user].yPosition = initGridData[mapName].Players[i][1];
                    i++;

                    players[user].diceStates = defaultDiceStates;
                    players[user].activityId = `user${user}-game${serverRoomName}-activity${activityCount}-${dateStamp}`;
                    players[user].activeSkill = false;
                    players[user].skill = "";

                    players[user].battleMode.yourTurn = false;
                    players[user].battleMode.distanceMoved = null;
                    players[user].battleMode.actionAttempted = false;
                    players[user].battleMode.damageDelt = null;
                    players[user].battleMode.enemiesDamaged = [];
                    players[user].battleMode.turnCompleted = false;
                    players[user].battleMode.mapUrl = mapUrl;
                    players[user].battleMode.gridDataUrl = gridDataUrl;
                    players[user].battleMode.initiativeImageUrl = initiativeUrl;
                    players[user].battleMode.initiativeImageShadow = shadowColor;
                    players[user].backgroundAudio = backgroundSong;

                    players[user].diceStates.D20 = {
                        value: [],
                        isActive: true,
                        isGlowActive: true,
                        rolls: 0,
                        displayedValue: null,
                        inhibit: false,
                        advantage: false,
                    }

                    waitingForRolls = true;

                    // set this to > 1 prob but for testing keeping it at 0
                    if (activePlayers > 1) {

                        players[user].timers.duration = 120; //seconds
                        players[user].timers.enabled = true;
                        //dont put await, or it doesnt finish since upstream in my messageque im not doing await in the checkforfunction call
                        waitAndCall(players[user].timers.duration, () => forceResetCheck(players[user]));
                    }

                }

            }
            activityCount++;

            io.to(serverRoomName).emit('enter battle mode', game); //not sure i need game object at all yet
            io.to(serverRoomName).emit('players objects', players);

        }

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

                if (!waitingForUser && !waitingForRolls && !settingUpNewScene && !processingMessage) {

                    processingMessage = true;

                    let unprocessedUserMessages = chatMessages.filter(message => message.role === 'user' && !message.processed);

                    if (unprocessedUserMessages.length > 0) {

                        unprocessedUserMessages.forEach(message => {
                            aiInOrderChatMessage.push(message);
                        });

                        let outputMsg = "";
                        chatMessages.forEach(message => {
                            message.processed = true;
                        });


                        aiInOrderChatMessage.forEach(message => {
                            message.processed = true;
                        });

                        console.log("checking chat messages");
                        let messagesFilteredForApi = aiInOrderChatMessage.map(item => ({
                            role: item.role,
                            content: item.content,
                        }));

                        console.log("messagesFilteredForApi", messagesFilteredForApi);

                        const data = {
                            model: "gpt-3.5-turbo",
                            messages: messagesFilteredForApi,
                            stream: true,
                        };

                        serverMessageId = `user - Assistant - activity - ${msgActivityCount} -${new Date().toISOString()} `;

                        const completion = await openai.chat.completions.create(data);

                        console.log("completion: ", completion);

                        for await (const chunk of completion) {

                            // // Check if we should continue before emitting the next chunk
                            // if (!shouldContinue[socket.id]) {
                            //     break; // Exit the loop if instructed to stop
                            // }

                            let outputStream = {
                                message: chunk.choices[0]?.delta?.content || "",
                                messageId: serverMessageId,
                                role: "assistant",
                            };
                            outputMsg += outputStream.message;


                            io.to(serverRoomName).emit('chat message', outputStream || "");
                        }

                        msgActivityCount++;

                        console.log('made it to chat complete');
                        io.to(serverRoomName).emit('chat complete');
                        let completeOutput = { "role": "assistant", "content": outputMsg, "processed": true }
                        aiInOrderChatMessage.push(completeOutput)
                        chatMessages.push(completeOutput);

                        // if all messages are processed, check for function call now
                        if ((aiInOrderChatMessage.filter(message => !message.processed)).length == 0) {
                            checkForFunctionCall(); // don't put await, otherwise it will block people from continuing until timeout occurs or they roll. So others wouldnt be able to type or cancel a roll.
                        }
                    };

                    processingMessage = false;



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
                    players[user].activityId = `user${user}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()} `;

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

                        players[user].timers.duration = 60;
                        players[user].timers.enabled = true;
                        //dont put await, or it doesnt finish since upstream in my messageque im not doing await in the checkforfunction call
                        waitAndCall(players[user].timers.duration, () => forceResetCheck(players[user]));
                    }
                }

            }

            // const activityId = `activity${ activityCount } -${ new Date().toISOString() } `;
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

        function waitAndCall(duration, func) {
            return new Promise(resolve => {
                setTimeout(() => {
                    func();
                    resolve();
                }, duration * 1000);
            });
        }

        // if timer expired and player is still active, set them to away and not active and
        // send default dice roll message to AI to take them out of the game. 
        function forceResetCheck(player) {
            if (player?.active) {

                console.log("forceResetCheck");

                let message = "Game master, I stepped away from the game. Please do not include me in your story until I return."
                const uniqueId = `user${player.name} -activity${awayPlayerCount} -${new Date().toISOString()} `;
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
            player.activityId = `user${player.name}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()} `;
            activityCount++;

            //send updated entire players object to room
            io.to(serverRoomName).emit('players objects', players);

        }

        async function createDallEImage(prompt) {

            //const ogprompt = "a dungeons and dragons like book image of a rogue and a wizard about to enter a tavern on a dark snowy night";

            const data = {
                model: "dall-e-3",
                prompt: ("a dungeons and dragons like book image with the following specification: ", prompt),
                n: 1,
                size: "1024x1024",
                quality: "hd",
            };

            let image = await openai.images.generate(data);

            let shadowColor = await getDominantColor(image.data[0].url);

            console.log("shadowColor", shadowColor);

            let dallEObject = {
                imageUrl: image.data[0].url,
                shadowColor: shadowColor
            }

            io.to(serverRoomName).emit('dall e image', dallEObject);

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

            let diceRollCalled = false;

            let messagesFilteredForFunction = aiInOrderChatMessage.map(item => ({
                role: item.role,
                content: item.content,
            }));
            console.log("messagesFilteredForFunction", messagesFilteredForFunction);
            //just see if you should call function based on last ai message
            let latestAssistantMessage = [messagesFilteredForFunction.findLast(item => item.role === "assistant")];
            console.log("latestAssistantMessage", latestAssistantMessage);
            //only check it to do the roll function if you sense d20 and roll in the ai statement
            if (latestAssistantMessage[0].content.toLowerCase().includes("d20") && latestAssistantMessage[0].content.toLowerCase().includes("roll") && !latestAssistantMessage[0].content.toLowerCase().includes("initiative")) {

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
                        diceRollCalled = true;
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

            await askAiIfInitiative(messagesFilteredForFunction, diceRollCalled);

        }

        async function askAiIfInitiative(messagesFilteredForFunction, diceRollCalled) {

            let latestAssistantMessage = [messagesFilteredForFunction.findLast(item => item.role === "assistant")];

            if (!diceRollCalled && latestAssistantMessage[0].content.toLowerCase().includes("initiative") && latestAssistantMessage[0].content.toLowerCase().includes("roll")) {

                messagesFilteredForFunction.push({ "role": "user", "content": "seems like a battle is about to start and your asking to roll for initiative to get the battle turn order? If so call the function enterBattleMode." })
                console.log("enterBattleMode latestAssistantMessage", latestAssistantMessage);
                const data = {
                    model: "gpt-4",
                    messages: messagesFilteredForFunction,
                    stream: false,
                    tools: [    ///////////mapName, backgroundMusic, enemyType, enemyCount
                        {
                            type: "function",
                            function: {
                                name: "enterBattleMode",
                                description: "function that should be called anytime the AI assistant is about to start a game battle between the players and some enemy.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        mapName: {
                                            type: "string",
                                            enum: ['ForestRiver'],
                                            description: "map that should be used for the battle. ForestRiver is a forest map."
                                        },
                                        backgroundMusic: {
                                            type: "string",
                                            enum: ['Black_Vortex'],
                                            description: "Background music that should be played for battle. Black_Vortex has an engaging feel."
                                        },
                                        enemyType: {
                                            type: "string",
                                            enum: ['goblin'],
                                            description: "the enemy race the players are about to battle."
                                        },
                                        enemyCount: {
                                            type: "integer",
                                            minimum: 1,
                                            maximum: 5,
                                            description: "the number of enemies the players are going to battle."
                                        },
                                    },
                                    required: ["mapName", "backgroundMusic", "enemyType", "enemyCount"],
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

                    if (functionData.name == "enterBattleMode") {
                        argumentsJson = JSON.parse(functionData.arguments);
                        mapNameValue = argumentsJson.mapName;
                        backgroundMusicValue = argumentsJson.backgroundMusic;
                        enemyTypeValue = argumentsJson.enemyType;
                        enemyCountValue = argumentsJson.enemyCount;
                        enterBattleMode(mapNameValue, backgroundMusicValue, enemyTypeValue, enemyCountValue); // no await because theres the active counter going on dont want to block

                    }

                }

            }
        }

        async function playBackgroundAudio(song) {
            io.to(serverRoomName).emit('background music', { url: `http://localhost:3000/audio/${song}.mp3` });
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
                //playBackgroundAudio("lord_of_the_land");////////////////////////for testing//////////
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
                ...player, // This copies all keys from players object
                name: userName,
                type: "player",
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
                    duration: 30, //seconds
                    enabled: false
                },
                figureIcon: "/icons/wizard.svg",
            };

            players[userName] = newPlayer;
            players[userName].activityId = `user${userName}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`
            activityCount++;

            console.log("new players joined: ", players);

            io.to(serverRoomName).emit('players objects', players);

            //enterBattleMode('ForestRiver', 'Black_Vortex', 'goblin', 3);////////////FOR TESTING!!!!//////////////////////

        });

        socket.on('obtain all users', () => {

            io.emit('connected users', Object.keys(clients));

            io.emit('players objects', players);

        });


        socket.on('D20 Dice Roll Complete', (diceData) => {

            if (players[diceData.User].mode == "initiative") {
                players[diceData.User].battleMode.initiativeRoll = diceData.Total;

            } else if (players[diceData.User].mode == "dice") {
                players[diceData.User].mode = "story";
            }

            //set a bunch of default states for the player
            defaultPlayersBattleInitMode(diceData.User);

            players[diceData.User].activityId = `user${diceData.User}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`;
            activityCount++;

            console.log("d20 completed");
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
            players[userName].activityId = `user${userName}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`;
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

        socket.on('player moved', (data) => {

            if (players.hasOwnProperty(data.name)) {
                players[data.name].xPosition = data.xPosition;
                players[data.name].yPosition = data.yPosition;
                players[data.name].activityId = `user${data.name}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()} `;
                activityCount++;
                io.to(serverRoomName).emit('players objects', players);
            };

        });

        processMessages();

    });

    function defaultPlayersBattleInitMode(userName) {
        players[userName].active = false;
        players[userName].away = false;
        players[userName].diceStates = defaultDiceStates;
        players[userName].battleMode.yourTurn = false;
        players[userName].battleMode.distanceMoved = null;
        players[userName].battleMode.actionAttempted = false;
        players[userName].battleMode.damageDelt = null;
        players[userName].battleMode.enemiesDamaged = [];
        players[userName].battleMode.turnCompleted = false;
        players[userName].skill = "";
        players[userName].activeSkill = false;
        players[userName].timers.enabled = false;
    }


    async function checkPlayersState() {

        let anyPlayerRoll = false
        let anyPlayerInitiativeRoll = false
        let inInitiativeMode = false;
        Object.entries(players).forEach(([userName, playerData]) => {

            // check if any player is in iniative mode, means game is in iniative mode
            if (playerData?.type == "player" && playerData?.mode == "initiative") {
                inInitiativeMode = true;
            }

            if (playerData?.type == "player" && playerData?.mode == "dice" && playerData?.active && !playerData?.away) {
                console.log("player roll true: ", playerData)
                anyPlayerRoll = true;
            }

            if (playerData?.type == "player" && playerData?.mode == "initiative" && !playerData?.away && playerData?.battleMode?.initiativeRoll < 1) {
                anyPlayerInitiativeRoll = true;
            }

        });

        if (anyPlayerRoll || anyPlayerInitiativeRoll) {
            waitingForRolls = true;
        } else {
            waitingForRolls = false;
        }

        //if everyone has done there initiative roll, put everyone in battle mode, and setup battle
        if (inInitiativeMode && !waitingForRolls) {
            console.log("going to battle mode");
            const activityDate = new Date().toISOString();
            Object.entries(players).forEach(([userName, playerData]) => {
                playerData.mode = "battle";
                //set a bunch of default states for the player
                defaultPlayersBattleInitMode(userName);
                playerData.activityId = `user${userName}-game${serverRoomName}-activity${activityCount}-${activityDate}`;

            });
            activityCount++;

        }

        io.emit('players objects', players);

    };

    setInterval(checkPlayersState, 5000);

    setInterval(() => {
        responseSent.clear();
    }, 1000 * 60 * 30); // Clear every 30 mins, for example

    // wsServer.listen(3001, () => {
    //     console.log('WebSocket Server is running on http://localhost:3001');
    // });
});
