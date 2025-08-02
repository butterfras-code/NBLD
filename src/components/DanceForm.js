import React, { useState } from 'react';

const DanceForm = ({ danceToEdit, onSave, onClose }) => {
    const [danceData, setDanceData] = useState(danceToEdit || {
        danceName: '',
        songTitle: '',
        songArtist: '',
        stepSheetLink: '',
        difficulty: 'Beginner',
        isBeginnerFriendly: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setDanceData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => onSave(e, danceData);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-cyan-300">Dance Name</label>
                <input type="text" name="danceName" value={danceData.danceName} onChange={handleChange} required className="mt-1 block w-full rounded-md bg-gray-700 text-white border-gray-600 shadow-sm focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50" />
            </div>
            <div>
                <label className="block text-sm font-medium text-cyan-300">Song Title</label>
                <input type="text" name="songTitle" value={danceData.songTitle} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-gray-600 shadow-sm focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50" />
            </div>
            <div>
                <label className="block text-sm font-medium text-cyan-300">Song Artist</label>
                <input type="text" name="songArtist" value={danceData.songArtist} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-gray-600 shadow-sm focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50" />
            </div>
            <div>
                <label className="block text-sm font-medium text-cyan-300">Step Sheet Link</label>
                <input type="url" name="stepSheetLink" value={danceData.stepSheetLink} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-gray-600 shadow-sm focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50" />
            </div>
            <div>
                <label className="block text-sm font-medium text-cyan-300">Difficulty</label>
                <select name="difficulty" value={danceData.difficulty} onChange={handleChange} className="mt-1 block w-full rounded-md bg-gray-700 text-white border-gray-600 shadow-sm focus:border-cyan-400 focus:ring focus:ring-cyan-400 focus:ring-opacity-50">
                    <option value="Beginner">Beginner</option>
                    <option value="Improver">Improver</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                </select>
            </div>
            <div className="flex items-center space-x-2">
                <input type="checkbox" id="isBeginnerFriendly" name="isBeginnerFriendly" checked={danceData.isBeginnerFriendly} onChange={handleChange} className="form-checkbox text-blue-500 bg-gray-700 rounded-md focus:ring-cyan-400" />
                <label htmlFor="isBeginnerFriendly" className="text-sm font-medium text-cyan-300">Beginner Friendly</label>
            </div>
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 text-gray-900 bg-cyan-500 rounded-lg hover:bg-cyan-600">Save</button>
            </div>
        </form>
    );
};

export default DanceForm;
