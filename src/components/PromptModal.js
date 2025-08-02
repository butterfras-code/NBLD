import React, { useState } from 'react';
import Modal from './Modal';

const PromptModal = ({ show, onClose, onConfirm, title, message }) => {
    const [inputValue, setInputValue] = useState('');
    if (!show) return null;

    const handleConfirm = () => {
        onConfirm(inputValue);
        setInputValue('');
    };

    return (
        <Modal show={show} onClose={onClose} title={title}>
            <p className="text-gray-300 mb-4">{message}</p>
            <input 
                type="text" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600 mb-6"
                placeholder="Optional notes..."
            />
            <div className="flex justify-end gap-4">
                <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button onClick={handleConfirm} className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold py-2 px-4 rounded-lg">Add Event</button>
            </div>
        </Modal>
    );
};

export default PromptModal;
