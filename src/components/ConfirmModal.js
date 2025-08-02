import React from 'react';
import Modal from './Modal';

const ConfirmModal = ({ show, onClose, onConfirm, title, message }) => {
    if (!show) return null;
    return (
        <Modal show={show} onClose={onClose} title={title}>
            <p className="text-gray-300 mb-6">{message}</p>
            <div className="flex justify-end gap-4">
                <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Confirm</button>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
