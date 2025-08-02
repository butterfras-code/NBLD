import React, { useState } from 'react';
import Modal from './Modal';

const EditQueueItemModal = ({ item, onSave, onClose }) => {
    const [danceName, setDanceName] = useState(item.danceName);
    const [songName, setSongName] = useState(item.songName);
    const [artist, setArtist] = useState(item.artist);

    const handleSave = (e) => {
        e.preventDefault();
        onSave({ ...item, danceName, songName, artist });
    };

    return (
        <Modal show={true} onClose={onClose} title="Edit Queue Item">
            <form onSubmit={handleSave}>
                <div className="mb-4">
                    <label htmlFor="edit-dance-name" className="block text-cyan-300 text-sm font-bold mb-2">Dance Name/Style</label>
                    <input type="text" id="edit-dance-name" value={danceName} onChange={e => setDanceName(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600" />
                </div>
                <div className="mb-4">
                    <label htmlFor="edit-song-name" className="block text-cyan-300 text-sm font-bold mb-2">Song/Event Info</label>
                    <input type="text" id="edit-song-name" value={songName} onChange={e => setSongName(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600" />
                </div>
                <div className="mb-4">
                    <label htmlFor="edit-artist-name" className="block text-cyan-300 text-sm font-bold mb-2">Artist</label>
                    <input type="text" id="edit-artist-name" value={artist} onChange={e => setArtist(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600" />
                </div>
                <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold py-2 px-4 rounded-lg w-full">Save Changes</button>
            </form>
        </Modal>
    );
};

export default EditQueueItemModal;
