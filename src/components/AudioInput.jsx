import React, { useState, useEffect, useRef } from 'react';
import { stopAi } from '../pages/index'


export default function AudioInput({ isAudioOpen, setIsAudioOpen, chatSocket, setLastAudioInputSequence, setShouldStopAi, isRecording, setIsRecording, diceRollsActive, mediaRecorder, setMediaRecorder, audioChunks }) {
    // Define constraints for the audio
    const constraints = { audio: true };
    const [recordText, setRecordText] = useState("Click to Start recording")
    const cancelled = useRef(false);
    const [isButtonEnabled, setIsButtonEnabled] = useState(true);

    const handleButton = () => {


        if (!isButtonEnabled) return;

        setIsButtonEnabled(false);

        if (mediaRecorder && mediaRecorder.state === "recording") {
            cancelled.current = false;
            mediaRecorder.stop();
            setIsRecording(false);
            setRecordText("Click to Start recording");

        } else if (mediaRecorder && mediaRecorder.state != "recording") {
            //setShouldStopAi(true); //stops ai from talking and typing since user interrupted
            cancelled.current = false;
            audioChunks.current = [];
            mediaRecorder.start();
            setIsRecording(true);
            setRecordText("Click to finish recording");
        }

        // Re-enable the button after 2 seconds
        setTimeout(() => {
            setIsButtonEnabled(true);
        }, 2000);

    }

    const handleCancel = () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            cancelled.current = true;
            mediaRecorder.stop();
            setIsRecording(false);
            setRecordText("Click to Start recording");
        }

        setIsAudioOpen(false);
    }

    useEffect(() => {
        if (diceRollsActive && mediaRecorder && mediaRecorder.state === "recording") {
            cancelled.current = true;
            mediaRecorder.stop();
            setIsRecording(false);
            setRecordText("Click to Start recording");
        }
    }, [diceRollsActive]);

    const sendAudioChunkToAPI = (audioBlob) => {
        // Function to send the audio chunk to your API
        // Implement the API call logic here
        console.log('Sending audio chunk to API...');
        audioBlob.arrayBuffer().then(arrayBuffer => {
            console.log("arrayBuffer: ", arrayBuffer);
            chatSocket.emit('player audio stream', arrayBuffer);
        });

    };


    useEffect(() => {

        if (mediaRecorder && mediaRecorder.state === "recording") {
            cancelled.current = true;
            mediaRecorder.stop();
        }

        setIsRecording(false);
        setRecordText("Click to Start recording");

        // Request permissions to record audio
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                setMediaRecorder(recorder);
                recorder.ondataavailable = event => {
                    if (event.data.size > 0) {
                        audioChunks.current.push(event.data);
                        console.log("onavailable called");
                        console.log("initial audioChunks: ", audioChunks.current);
                    }

                };

                recorder.onstop = () => {

                    // only do it if cancel button wasn't pressed
                    if (!cancelled.current) {
                        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm;codecs=opus' });
                        console.log("audioBlob: ", audioBlob);
                        sendAudioChunkToAPI(audioBlob);
                    }
                };
            });

    }, []);

    return (
        < div class={`flex flex-col justify-center items-center ${isRecording ? 'bg-purple-900' : 'bg-gray-900'}  p-6 rounded-lg border border-gray-500 space-y-4`} >

            <button id="audioCircle" className={`audio-circle flex justify-center items-center text-white font-semibold relative px-4 bg-gray-500 inline-block overflow-visible whitespace-nowrap ${isRecording ? 'animate-grow-shrink' : ''}`}
                disabled={diceRollsActive}
                onClick={() => handleButton()}>
                {recordText}
            </button>
            <button class=" -mt-4 flex justify-center items-center text-white font-bold text-xl bg-red-600 h-10 w-10 rounded-full"
                onClick={() => handleCancel()}>
                X
            </button>
        </div >


    );
}
