import React, { useState } from 'react';
import { db } from '../services/firebase';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';

const AdminPanel = ({ djs, onClose }) => {
    const [editingDj, setEditingDj] = useState(null);
    const [newDjName, setNewDjName] = useState('');
    const [newDjPassword, setNewDjPassword] = useState('');
    const [newDjRole, setNewDjRole] = useState('dj');
    const [confirmDelete, setConfirmDelete] = useState(null);

    const handleAddNewDj = async (e) => {
        e.preventDefault();
        if (!newDjName || !newDjPassword || !db) return;
        await db.collection('djs').add({ name: newDjName, password: newDjPassword, role: newDjRole, venmo: '', cashapp: '' });
        setNewDjName('');
        setNewDjPassword('');
        setNewDjRole('dj');
    };

    const handleUpdateDj = async (dj) => {
        if (!db) return;
        const { id, ...data } = dj;
        await db.collection('djs').doc(id).update(data);
        setEditingDj(null);
    };

    const handleDeleteDj = async (id) => {
        if (!db) return;
        await db.collection('djs').doc(id).delete();
        setConfirmDelete(null);
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
            {confirmDelete && <ConfirmModal show={true} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteDj(confirmDelete.id)} title="Delete DJ" message={`Are you sure you want to delete ${confirmDelete.name}? This action cannot be undone.`} />}
            {editingDj && (
                <Modal show={true} onClose={() => setEditingDj(null)} title={`Edit DJ: ${editingDj.name}`}>
                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateDj(editingDj); }}>
                        {/* Edit form fields */}
                        <div className="mb-4">
                            <label className="block text-cyan-300 text-sm font-bold mb-2">Name</label>
                            <input type="text" value={editingDj.name} onChange={e => setEditingDj({...editingDj, name: e.target.value})} className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white" />
                        </div>
                        <div className="mb-4">
                            <label className="block text-cyan-300 text-sm font-bold mb-2">Password</label>
                            <input type="text" value={editingDj.password} onChange={e => setEditingDj({...editingDj, password: e.target.value})} className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white" />
                        </div>
                        <div className="mb-4">
                            <label className="block text-cyan-300 text-sm font-bold mb-2">Role</label>
                            <select value={editingDj.role} onChange={e => setEditingDj({...editingDj, role: e.target.value})} className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white">
                                <option value="dj">DJ</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                         <div className="mb-4">
                            <label className="block text-cyan-300 text-sm font-bold mb-2">Venmo</label>
                            <input type="text" value={editingDj.venmo} onChange={e => setEditingDj({...editingDj, venmo: e.target.value})} className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white" />
                        </div>
                         <div className="mb-4">
                            <label className="block text-cyan-300 text-sm font-bold mb-2">Cash App</label>
                            <input type="text" value={editingDj.cashapp} onChange={e => setEditingDj({...editingDj, cashapp: e.target.value})} className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white" />
                        </div>
                        <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold py-2 px-4 rounded-lg w-full">Save Changes</button>
                    </form>
                </Modal>
            )}
            <header className="flex justify-between items-center mb-6 pb-4 border-b-2 border-yellow-400">
                <h1 className="text-3xl md:text-4xl font-bold text-yellow-400">Admin Panel</h1>
                <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Back to Console</button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-2xl font-semibold text-pink-400 mb-4">Add New DJ</h2>
                    <form onSubmit={handleAddNewDj} className="bg-gray-800 p-4 rounded-lg space-y-4">
                        <input type="text" value={newDjName} onChange={e => setNewDjName(e.target.value)} placeholder="DJ Name" required className="w-full p-2 bg-gray-700 rounded border border-gray-600" />
                        <input type="password" value={newDjPassword} onChange={e => setNewDjPassword(e.target.value)} placeholder="Password" required className="w-full p-2 bg-gray-700 rounded border border-gray-600" />
                        <select value={newDjRole} onChange={e => setNewDjRole(e.target.value)} className="w-full p-2 bg-gray-700 rounded border border-gray-600">
                            <option value="dj">DJ</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold py-2 px-4 rounded-lg">Add DJ</button>
                    </form>
                </div>
                <div>
                    <h2 className="text-2xl font-semibold text-pink-400 mb-4">Manage DJs</h2>
                    <div className="space-y-3">
                        {djs.map(dj => (
                            <div key={dj.id} className="bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg text-cyan-300">{dj.name}</p>
                                    <p className="text-sm text-gray-400">Role: {dj.role}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingDj(dj)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-sm">Edit</button>
                                    <button onClick={() => setConfirmDelete(dj)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
