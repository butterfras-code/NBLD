import React from 'react';

const Modal = ({ show, onClose, title, children, bgColor = 'bg-gray-800' }) => {
    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-start overflow-y-auto p-4 pt-8">
            <div className={`${bgColor} rounded-lg shadow-xl w-full max-w-md p-6 relative mb-8`}>
                <h2 className="text-2xl font-bold text-pink-400 mb-4">{title}</h2>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
                {children}
            </div>
        </div>
    );
};

export default Modal;
