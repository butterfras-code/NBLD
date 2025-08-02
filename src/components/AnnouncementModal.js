import React, { useState } from 'react';
import Modal from './Modal';
import { callGeminiAPI } from '../services/gemini';

const GeminiAnnouncementModal = ({ show, onClose }) => {
    const [topic, setTopic] = useState('');
    const [announcement, setAnnouncement] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!show) return null;

    const handleGenerate = async () => {
        if (!topic) return;
        setIsLoading(true);
        setAnnouncement('');
        const prompt = `You are a fun, high-energy country western DJ at a club called Neon Boots. Write a short, fun announcement for the following topic: "${topic}". Keep it under 30 seconds to read.`;
        const result = await callGeminiAPI(prompt);
        setAnnouncement(result);
        setIsLoading(false);
    };
    
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(announcement);
    };

    return (
        <Modal show={show} onClose={onClose} title="✨ AI Announcement Generator">
            <p className="text-gray-300 mb-4">Enter a topic and let the AI craft a fun announcement!</p>
            <input 
                type="text" 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
                className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600 mb-4"
                placeholder="e.g., Last Call, Birthday for Sarah"
            />
            <button onClick={handleGenerate} disabled={isLoading || !topic} className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold py-2 px-4 rounded-lg w-full disabled:opacity-50 flex justify-center items-center">
                {isLoading ? <div className="loader"></div> : 'Generate Announcement'}
            </button>
            
            {announcement && (
                <div className="mt-6 bg-gray-900 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-cyan-300 mb-2">Generated Announcement:</h4>
                    <p className="text-gray-200 whitespace-pre-wrap">{announcement}</p>
                    <button onClick={handleCopyToClipboard} className="text-xs bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-2 rounded mt-3">Copy Text</button>
                </div>
            )}
        </Modal>
    );
};

export default GeminiAnnouncementModal;
