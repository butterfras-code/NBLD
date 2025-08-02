import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { callGeminiAPI } from '../services/gemini';
import TippingSection from './TippingSection';
import { partnerDancesList } from '../utils/data';

const RequestForm = ({ onClose, tippingInfo, formType, lineDancesList }) => {
    const [danceName, setDanceName] = useState('');
    const [songName, setSongName] = useState('');
    const [artist, setArtist] = useState('');
    const [spotifyLink, setSpotifyLink] = useState('');
    const [stepSheetUrl, setStepSheetUrl] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [showThanksModal, setShowThanksModal] = useState(false);
    const [songSuggestions, setSongSuggestions] = useState([]);
    const [isSuggesting, setIsSuggesting] = useState(false);

    // New state for the custom search/dropdown
    const [lineDanceSearch, setLineDanceSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isLineDance = formType === 'line';

    // Handler for selecting a line dance from the custom dropdown
    const handleLineDanceSelect = (dance) => {
        setDanceName(dance.danceName || '');
        setSongName(dance.songTitle || '');
        setArtist(dance.songArtist || '');
        setStepSheetUrl(dance.stepSheetLink || '');
        setLineDanceSearch(dance.danceName); // Show the selected dance name in the input for clarity
        setIsDropdownOpen(false);
    };

    // Original handler for partner dance select
    const handlePartnerDanceSelect = (e) => {
        const selectedDanceName = e.target.value;
        const dance = partnerDancesList.find(d => d.name === selectedDanceName);
        if (dance) {
            setDanceName(dance.name);
            setSongName('');
            setArtist('');
        } else {
            setDanceName('');
        }
    };
    
    // Filtered list for the line dance dropdown
    const filteredLineDances = lineDanceSearch
        ? lineDancesList.filter(dance =>
            (dance.danceName && dance.danceName.toLowerCase().includes(lineDanceSearch.toLowerCase())) ||
            (dance.songTitle && dance.songTitle.toLowerCase().includes(lineDanceSearch.toLowerCase())) ||
            (dance.songArtist && dance.songArtist.toLowerCase().includes(lineDanceSearch.toLowerCase()))
        )
        : lineDancesList;

    // Effect to handle clicks outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleSuggestSongs = async () => {
        if (!danceName) return;
        setIsSuggesting(true);
        setSongSuggestions([]);
        const prompt = `Suggest 3 popular country songs for a '${danceName}' dance. Provide just the song title and artist, each on a new line, like 'Song Title - Artist'. Do not add numbers or bullets.`;
        const result = await callGeminiAPI(prompt);
        const suggestions = result.split('\n').filter(s => s.trim() !== '');
        setSongSuggestions(suggestions);
        setIsSuggesting(false);
    };
    
    const handleSelectSuggestion = (suggestion) => {
        const parts = suggestion.split(' - ');
        if (parts.length === 2) {
            setSongName(parts[0].trim());
            setArtist(parts[1].trim());
        }
        setSongSuggestions([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!customerName || !db) return;
        try {
            const requestData = { 
                danceName, 
                songName, 
                artist, 
                spotifyLink, 
                customerName, 
                createdAt: new Date() 
            };
            if (isLineDance) {
                requestData.stepSheetUrl = stepSheetUrl;
            }
            await db.collection('requests').add(requestData);
            setShowThanksModal(true);
        } catch (error) {
            console.error("Error adding request: ", error);
        }
    };

    if (showThanksModal) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-pink-400 mb-4">Thank You!</h2>
                <p className="text-gray-200 mb-4">Your request has been sent to the DJ.</p>
                <TippingSection tippingInfo={tippingInfo} />
                <button onClick={() => { setShowThanksModal(false); onClose(); }} className="mt-4 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg w-full">Close</button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <p className="text-gray-300 mb-4 text-center">Enter as much as you know, the more the better!</p>
            
            {isLineDance ? (
                <div className="mb-4 relative" ref={dropdownRef}>
                    <label htmlFor="dance-search" className="block text-cyan-300 text-sm font-bold mb-2">Quick Select a Line Dance</label>
                    <input
                        id="dance-search"
                        type="text"
                        value={lineDanceSearch}
                        onChange={(e) => {
                            setLineDanceSearch(e.target.value);
                            setIsDropdownOpen(true);
                            if (e.target.value !== danceName) {
                                setDanceName('');
                                setSongName('');
                                setArtist('');
                                setStepSheetUrl('');
                            }
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder={lineDancesList.length > 0 ? "Search by dance, song, or artist..." : "Dances coming soon..."}
                        autoComplete="off"
                        disabled={lineDancesList.length === 0}
                        className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    />
                    {isDropdownOpen && filteredLineDances.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredLineDances.map(dance => (
                                <div
                                    key={dance.id}
                                    onClick={() => handleLineDanceSelect(dance)}
                                    className="px-4 py-2 text-white hover:bg-gray-700 cursor-pointer"
                                >
                                    <p className="font-bold">{dance.danceName}</p>
                                    <p className="text-sm text-gray-400">{dance.songTitle} - {dance.songArtist}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="mb-4">
                    <label htmlFor="dance-select" className="block text-cyan-300 text-sm font-bold mb-2">Quick Select a Dance Style</label>
                    <select id="dance-select" onChange={handlePartnerDanceSelect} className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600">
                        <option value="">-- Select a Dance --</option>
                        {partnerDancesList.map(dance => <option key={dance.name} value={dance.name}>{dance.name}</option>)}
                    </select>
                </div>
            )}

            <p className="text-center text-gray-400 my-2">OR</p>
            
            <div className="mb-4">
                <label htmlFor="dance-name" className="block text-cyan-300 text-sm font-bold mb-2">Dance Name/Style</label>
                <input type="text" id="dance-name" value={danceName} onChange={e => setDanceName(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600" />
            </div>
            <div className="mb-4">
                <label htmlFor="song-name" className="block text-cyan-300 text-sm font-bold mb-2">Song Name</label>
                <div className="flex items-center gap-2">
                   <input type="text" id="song-name" value={songName} onChange={e => setSongName(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600" />
                   {!isLineDance && (
                        <button type="button" onClick={handleSuggestSongs} disabled={!danceName || isSuggesting} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-3 rounded-lg disabled:opacity-50 text-sm whitespace-nowrap">
                            {isSuggesting ? '...' : '✨ Suggest'}
                        </button>
                   )}
                </div>
                 {songSuggestions.length > 0 && (
                    <div className="mt-2 bg-gray-700 border border-gray-600 rounded-lg p-2">
                        <p className="text-xs text-gray-300 mb-2">Tap to select:</p>
                        {songSuggestions.map((s, i) => (
                            <button type="button" key={i} onClick={() => handleSelectSuggestion(s)} className="block w-full text-left p-1 text-cyan-300 hover:bg-gray-600 rounded text-sm">{s}</button>
                        ))}
                    </div>
                )}
            </div>
            <div className="mb-4">
                <label htmlFor="artist-name" className="block text-cyan-300 text-sm font-bold mb-2">Artist</label>
                <input type="text" id="artist-name" value={artist} onChange={e => setArtist(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600" />
            </div>
            {isLineDance && (
                <div className="mb-4">
                    <label htmlFor="step-sheet-url" className="block text-cyan-300 text-sm font-bold mb-2">Step Sheet URL (Optional)</label>
                    <input type="url" id="step-sheet-url" value={stepSheetUrl} onChange={e => setStepSheetUrl(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600" />
                </div>
            )}
            <div className="mb-4">
                <label htmlFor="spotify-link" className="block text-cyan-300 text-sm font-bold mb-2">Spotify Link (Optional)</label>
                <input type="url" id="spotify-link" value={spotifyLink} onChange={e => setSpotifyLink(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600" />
            </div>
            <div className="mb-4">
                <label htmlFor="customer-name" className="block text-cyan-300 text-sm font-bold mb-2">Your Name*</label>
                <input type="text" id="customer-name" value={customerName} onChange={e => setCustomerName(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline border-gray-600" />
            </div>
            <button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg w-full">Submit Request</button>
        </form>
    );
};

export default RequestForm;
