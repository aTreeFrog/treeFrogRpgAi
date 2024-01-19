import React from 'react';

export default function MoveOnPopup({ popupText, MoveOnClose, MoveOnConfirm }) {
    return (
        <div className="break-words overflow-wrap popup-glow border border-black fixed top-1/2 left-1/2 -translate-x-[55%] -translate-y-1/2 bg-purple-600 p-5 z-50 w-100 rounded-md text-center text-white">
            <pre>{popupText}</pre>
            <div className="flex justify-around mt-4">
                <button className="font-semibold px-4 py-2 rounded bg-purple-900 text-white hover:bg-gray-600 rounded-md" onClick={MoveOnConfirm}>Yes</button>
                <button className="font-semibold px-4 py-2 rounded bg-purple-900 text-white hover:bg-red-600 rounded-md" onClick={MoveOnClose}>Cancel</button>
            </div>
        </div>
    );
};