import React, { useEffect, useRef, useState } from 'react';

const JitsiMeetComponent = ({ meetingRoom, onApiReady }) => {
    const jitsiContainerRef = useRef(null);
    const isScriptLoaded = useRef(false);
    const [meetingEnded, setMeetingEnded] = useState(false);

    // Define loadJitsiScript inside the component
    const loadJitsiScript = () => {
        if (meetingRoom && !isScriptLoaded.current) {
            console.log("loadjitsiscript");
            const script = document.createElement("script");
            script.src = process.env.NEXT_PUBLIC_JITSI_APP_ID;
            script.async = true;
            script.onload = () => {
                // Check if the JitsiMeetExternalAPI constructor is available
                if (window.JitsiMeetExternalAPI) {
                    initializeJitsi(); // Initialize Jitsi after the script is loaded
                }
            };
            isScriptLoaded.current = true;
            document.body.appendChild(script);
        }
    };


    const initializeJitsi = () => {
        if (meetingRoom) {
            console.log("initializeJitsi");
            const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN;
            const roomPrefix = process.env.NEXT_PUBLIC_JITSI_ROOM_PREFIX;
            const options = {
                roomName: `${roomPrefix}/${meetingRoom}`,
                width: '100%',
                height: '100%',
                parentNode: jitsiContainerRef.current,
                configOverwrite: {
                    startAudioOnly: true, // Start with only audio
                    disableDeepLinking: true,
                },
                interfaceConfigOverwrite: {
                    DISABLE_VIDEO_BACKGROUND: true,
                    filmStripOnly: true, // Set to true if you want to see only the audio levels and not any video
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
                    TOOLBAR_BUTTONS: [ // List the buttons you want to remain
                        'microphone', 'settings', 'hangup', 'fodeviceselection', 'invite', 'mute-everyone'
                        // Exclude 'chat', 'camera', or other buttons you don't want
                    ],
                },

            };

            const api = new window.JitsiMeetExternalAPI(domain, options);
            onApiReady(api);

            // After the API is initialized and the conference is joined
            api.addEventListener('videoConferenceJoined', (response) => {
                // Check your own role shortly after joining
                setTimeout(() => {
                    //const myUserId = api.getMyUserId();
                    console.log("api.getParticipantsInfo: ", api.getParticipantsInfo());

                    // if (me.role === 'moderator') {
                    //     console.log("I am the moderator!");
                    //     setIsModerator(true);  // Set state or handle accordingly
                    // } else {
                    //     console.log("My role:", me.role);
                    // }
                }, 5000); // Adjust time as needed to ensure roles are fully initialized
            });

            api.addEventListener('participantRoleChanged', function (event) {
                if (event.role === "moderator") {
                    console.log("im moderator");
                    // Now you're the moderator!
                    // You can make decisions about participant roles, etc.
                }
            });

            api.addEventListener('lobbyUserJoined', function (id, displayName, email) {
                console.log(`${displayName} is waiting in the lobby.`);
                // You can now allow or deny entry to this participant
                api.allowLobbyParticipant(id);
            });

            api.addEventListener('participantRoleChanged', function (event) {
                setTimeout(() => {
                    console.log("event.role ", event.role);
                    console.log("event.id ", event.id);
                }, 5000);
            });

            api.addEventListener('videoConferenceLeft', () => {
                setMeetingEnded(true); // Update the state to indicate meeting has ended
            });

            // You can use the api object to add event listeners or execute commands

            return () => {
                if (jitsiContainerRef.current) {
                    jitsiContainerRef.current.innerHTML = '';
                }
            };
        }
    }

    useEffect(() => {
        if (!window.JitsiMeetExternalAPI) {
            loadJitsiScript();
        } else {
            initializeJitsi();
        }

        // Cleanup function to remove the Jitsi iframe when component unmounts
        return () => {
            if (jitsiContainerRef.current) {
                jitsiContainerRef.current.innerHTML = '';
            }
        };
    }, [meetingRoom]);

    useEffect(() => {
        // Whenever the component mounts or meetingRoom changes,
        // reinitialize the Jitsi component if the meeting had ended
        if (meetingEnded) {
            setMeetingEnded(false); // Reset the flag
            if (window.JitsiMeetExternalAPI) {
                initializeJitsi();
            } else {
                loadJitsiScript();
            }
        }
    }, [meetingRoom, meetingEnded]);

    return <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <div style={{ transform: 'scale(0.8)', transformOrigin: 'top left', width: '125%', height: '125%' }}>
            <div ref={jitsiContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
    </div>
};

export default JitsiMeetComponent;
