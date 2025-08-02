import React, { useState } from 'react';
import Modal from './Modal';

const ChangePasswordModal = ({ show, onClose, onSave }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        onSave(newPassword);
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} title="Change Password">
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}
            <div className="mb-4">
                <label className="block text-cyan-300 text-sm font-bold mb-2">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white" />
            </div>
            <div className="mb-6">
                <label className="block text-cyan-300 text-sm font-bold mb-2">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white" />
            </div>
            <button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold py-2 px-4 rounded-lg w-full">Save New Password</button>
        </Modal>
    );
};

export default ChangePasswordModal;
