import React, { useState } from 'react';
import Modal from './Modal';

const LineDanceLessonModal = ({ show, onClose, onConfirm, lineDancesList }) => {
    const [selectedDance, setSelectedDance] = useState('');
    if (!show) return null;

    const handleConfirm = () => {
        if (selectedDance) {
            onConfirm(selectedDance);
        }
    };

    return (
        <Modal show={show} onClose={onClose} title="Select Dance for Lesson">
            <p className="text-gray-300 mb-4">Which dance will be taught?</p>
            <select value={selectedDance} onChange={e => setSelectedDance(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600 mb-6">
                <option value="">-- Select a Dance --</option>
                {lineDancesList.map(dance => <option key={dance.name} value={dance.name}>{dance.name}</option>)}
            </select>
            <div className="flex justify-end gap-4">
                <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button onClick={handleConfirm} disabled={!selectedDance} className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold py-2 px-4 rounded-lg disabled:opacity-50">Add Lesson</button>
            </div>
        </Modal>
    );
};

export default LineDanceLessonModal;
