import React, { useState } from 'react';

const DJLogin = ({ onLogin, djs }) => {
    const [djName, setDjName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        const dj = djs.find(d => d.name === djName);
        if (dj && dj.password === password) {
            onLogin(dj);
        } else {
            setError('Invalid DJ Name or Password.');
        }
    };

    return (
        <form onSubmit={handleLogin}>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="mb-4">
                <label htmlFor="dj-name" className="block text-cyan-300 text-sm font-bold mb-2">DJ Name</label>
                <select id="dj-name" value={djName} onChange={e => setDjName(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600">
                    <option value="">Select DJ</option>
                    {djs.map(dj => <option key={dj.id} value={dj.name}>{dj.name}</option>)}
                </select>
            </div>
            <div className="mb-4">
                <label htmlFor="dj-password" className="block text-cyan-300 text-sm font-bold mb-2">Password</label>
                <input type="password" id="dj-password" value={password} onChange={e => setPassword(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600" />
            </div>
            <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold py-2 px-4 rounded-lg w-full">Login</button>
        </form>
    );
};

export default DJLogin;
