import React, { useState, useEffect, useCallback, useRef } from 'react';

// Import Firebase and Gemini services
import { db, auth, functions } from './api/firebase';
import { callGeminiAPI } from './api/gemini';

// Import hooks and functions from Firebase
import { onAuthStateChanged, signInAnonymously, signOut, updatePassword } from 'firebase/auth';
import { 
    collection, doc, onSnapshot, orderBy, query, getDoc, setDoc, deleteDoc, 
    addDoc, updateDoc, writeBatch, where, getDocs, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';


// --- Import All Component Files ---
import Modal from './components/modals/Modal';
import ConfirmModal from './components/modals/ConfirmModal';
import TippingModal from './components/modals/TippingModal';
import EditQueueItemModal from './components/modals/EditQueueItemModal';
import GeminiAnnouncementModal from './components/modals/GeminiAnnouncementModal';
import ChangePasswordModal from './components/modals/ChangePasswordModal';

import DJLogin from './components/dj/DJLogin';
import AdminPanel from './components/dj/AdminPanel';
import DjToolsPanel from './components/dj/DjToolsPanel';
import LineDanceManagement from './components/dj/LineDanceManagement';

import RequestForm from './components/forms/RequestForm';
import LineRequestForm from './components/forms/LineRequestForm';
import PartnerRequestForm from './components/forms/PartnerRequestForm';
import DjLineDanceLessonForm from './components/forms/DjLineDanceLessonForm';
import AnnouncementForm from './components/forms/AnnouncementForm';
import ShoutOutForm from './components/forms/ShoutOutForm';
import TimeInputModal from './components/forms/TimeInputModal';

import QueueList from './components/QueueList';
import TippingSection from './components/TippingSection';

// --- Constants ---
const partnerDancesList = [
    { name: 'Two Step' }, { name: 'Triple Two' }, { name: 'Cha Cha' }, 
    { name: 'Polka' }, { name: 'Waltz' }, { name: 'West Coast Swing' }, 
    { name: 'East Coast Swing' }, { name: 'Night Club Two Step' },
];
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';


const App = () => {
    // --- STATE MANAGEMENT ---

    // Auth State
    const [authReady, setAuthReady] = useState(false);
    const [user, setUser] = useState(null); // Firebase auth user object
    const [djDetails, setDjDetails] = useState(null); // Firestore dj document
    const [authError, setAuthError] = useState(null);

    // Data State
    const [queue, setQueue] = useState([]);
    const [requests, setRequests] = useState([]);
    const [djs, setDjs] = useState([]); // Full list of DJs for Admin panel
    const [lineDances, setLineDances] = useState([]);
    const [activeDj, setActiveDj] = useState(null);

    // UI State
    const [showLineRequestModal, setShowLineRequestModal] = useState(false);
    const [showPartnerRequestModal, setShowPartnerRequestModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showTipModal, setShowTipModal] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showManageLineDances, setShowManageLineDances] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [venmoUser, setVenmoUser] = useState('');
    const [cashappUser, setCashappUser] = useState('');
    const [tipSaveConfirm, setTipSaveConfirm] = useState(false);
    const [confirmState, setConfirmState] = useState({ show: false, title: '', message: '', onConfirm: () => {} });
    const [showDjHistory, setShowDjHistory] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAllPublicQueue, setShowAllPublicQueue] = useState(false);
    const [votedSongs, setVotedSongs] = useState(() => {
        const saved = localStorage.getItem('votedSongs');
        return saved ? JSON.parse(saved) : [];
    });
    const [djToolModal, setDjToolModal] = useState({ show: false, tool: null, title: '' });

    // --- EFFECTS ---

    // Auth listener
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                const djDocRef = doc(db, 'djs', user.uid);
                const djDoc = await getDoc(djDocRef);
                if (djDoc.exists()) {
                    const djData = { id: djDoc.id, ...djDoc.data() };
                    setDjDetails(djData);
                    setVenmoUser(djData.venmo || '');
                    setCashappUser(djData.cashapp || '');
                    await setDoc(doc(db, "settings", "active_dj"), { name: djData.name, uid: user.uid });
                } else {
                    setDjDetails(null);
                }
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (err) {
                     console.error("Anonymous sign in failed:", err);
                     if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
                         setAuthError("Configuration Issue: Anonymous sign-in is not enabled for this project. Please go to your Firebase Console, navigate to Authentication -> Sign-in method, and enable the 'Anonymous' provider.");
                     } else {
                         setAuthError(err.message);
                     }
                }
            }
            setAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    // Save votes to local storage
    useEffect(() => {
        localStorage.setItem('votedSongs', JSON.stringify(votedSongs));
    }, [votedSongs]);

    // Data listeners
    useEffect(() => {
        if (!db) return; 
        
        const qQueue = query(collection(db, "queue"), orderBy("order"));
        const unsubQueue = onSnapshot(qQueue, snapshot => {
            setQueue(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, console.error);

        const qLineDances = query(collection(db, `artifacts/${appId}/public/data/line_dances`), orderBy("danceName"));
        const unsubLineDances = onSnapshot(qLineDances, snapshot => {
            setLineDances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, console.error);

        const unsubActiveDj = onSnapshot(doc(db, "settings", "active_dj"), doc => {
            setActiveDj(doc.exists() ? doc.data() : null);
        }, console.error);

        let unsubRequests = () => {};
        let unsubDjs = () => {};
        if (authReady && djDetails) {
            const qRequests = query(collection(db, "requests"), orderBy("createdAt", "desc"));
            unsubRequests = onSnapshot(qRequests, snapshot => {
                setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, console.error);

            unsubDjs = onSnapshot(collection(db, "djs"), snapshot => {
                setDjs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, console.error);
        }
        
        const interval = setInterval(() => {
            setQueue(currentQueue => {
                const now = new Date();
                const filteredQueue = currentQueue.filter(item => !item.expirationTime || new Date(item.expirationTime) > now);
                return filteredQueue.map(item => ({
                    ...item,
                    flashing: item.targetTime && new Date(item.targetTime).getTime() - now.getTime() < 5 * 60 * 1000 && new Date(item.targetTime) > now
                }));
            });
        }, 5000);

        return () => { 
            unsubQueue(); 
            unsubRequests(); 
            unsubDjs(); 
            unsubActiveDj();
            unsubLineDances();
            clearInterval(interval);
        };
    }, [authReady, djDetails]);

    // --- HANDLER FUNCTIONS ---

    const addToQueue = async (itemData, position) => {
        if (!db || !djDetails) return;
        
        setDjToolModal({ show: false, tool: null, title: '' });

        const upcomingQueue = queue.filter(q => !q.played).sort((a, b) => a.order - b.order);
        
        const newItemData = {
            ...itemData, played: false, likes: [], dislikes: [],
            createdAt: new Date(),
            expirationTime: itemData.expirationTime || null,
            targetTime: itemData.targetTime || null,
            customerName: itemData.customerName || djDetails.name,
        };
        delete newItemData.id;

        if (position === 'next' && upcomingQueue.length > 0) {
            newItemData.order = upcomingQueue[0].order + 0.5;
        } else {
            const maxOrder = queue.reduce((max, item) => Math.max(max, item.order), -1);
            newItemData.order = maxOrder + 1;
        }

        try {
            await addDoc(collection(db, 'queue'), newItemData);
        } catch (error) {
            console.error("Error adding item to queue:", error);
        }
    };

    const handleAddRequestToQueue = async (request, position) => {
        if (!db) return;
        const itemData = {
            type: 'song', danceName: request.danceName, songName: request.songName,
            artist: request.artist, spotifyLink: request.spotifyLink || '',
            stepSheetUrl: request.stepSheetUrl || '',
        };
        await addToQueue(itemData, position);
        await deleteDoc(doc(db, 'requests', request.id));
    };
    
    const handleTimeEventConfirm = (time, eventName) => {
        const today = new Date().toISOString().split('T')[0];
        const targetTime = new Date(`${today}T${time}`);
        const eventData = {
            danceName: eventName, artist: `at ${time}`,
            targetTime: targetTime.toISOString(), type: 'event'
        };
        addToQueue(eventData, 'last');
    };

    const handleDeleteRequest = async (id) => { if (!db) return; await deleteDoc(doc(db, 'requests', id)); };
    
    const handleToolClick = (toolName) => {
         const timeBasedTools = ['Last Call', 'Closing Time'];
         if (timeBasedTools.includes(toolName)) {
             setDjToolModal({ show: true, tool: 'timeInput', title: `Set Time: ${toolName}`, eventName: toolName });
         } else if (toolName === 'AI Announcement') {
             setDjToolModal({ show: true, tool: 'AI Announcement', title: '✨ AI Announcement Generator' });
         }
         else {
             setDjToolModal({ show: true, tool: toolName, title: `DJ Request: ${toolName}` });
         }
    };

    const handleSaveTippingInfo = async (e) => {
        e.preventDefault();
        if (!db || !djDetails) return;
        const djRef = doc(db, "djs", djDetails.id);
        await updateDoc(djRef, { venmo: venmoUser, cashapp: cashappUser });
        setTipSaveConfirm(true);
        setTimeout(() => setTipSaveConfirm(false), 2000);
    };

    const handleChangePassword = async (newPassword) => {
        if (!user) return;
        try {
            await updatePassword(user, newPassword);
            alert("Password updated successfully!");
        } catch (error) {
            console.error("Error changing password:", error);
            alert("Error changing password: " + error.message);
        }
    };
    
    const handleQueueReorder = useCallback(async (dragIndex, dropIndex) => {
        if (!db) return;
        const upcomingQueue = queue.filter(item => !item.played).sort((a,b) => a.order - b.order);
        const newQueue = [...upcomingQueue];
        const [draggedItem] = newQueue.splice(dragIndex, 1);
        newQueue.splice(dropIndex, 0, draggedItem);
        
        const batch = writeBatch(db);
        newQueue.forEach((item, index) => {
            const newOrder = index + 1;
            if (item.order !== newOrder) {
                batch.update(doc(db, 'queue', item.id), { order: newOrder });
            }
        });
        await batch.commit();
    }, [queue]);

    const handleMoveQueueItem = (index, direction) => {
        const upcomingQueue = queue.filter(item => !item.played).sort((a,b) => a.order - b.order);
        if (direction === 'up' && index > 0) handleQueueReorder(index, index - 1);
        else if (direction === 'down' && index < upcomingQueue.length - 1) handleQueueReorder(index, index + 1);
    };
    
    const handleSaveEditedItem = async (updatedItem) => {
        if (!db) return;
        const { id, ...data } = updatedItem;
        await updateDoc(doc(db, 'queue', id), data);
        setEditingItem(null);
    };

    const handleMarkAsPlayed = async (id) => {
        if (!db) return;
        await updateDoc(doc(db, 'queue', id), { played: true });
    };

    const handleDeleteQueueItem = (id) => {
        setConfirmState({
            show: true, title: 'Delete Item',
            message: 'Are you sure you want to permanently delete this item from the queue?',
            onConfirm: async () => {
                if (!db) return;
                await deleteDoc(doc(db, 'queue', id));
                setConfirmState({ show: false, title: '', message: '', onConfirm: () => {} });
            }
        });
    };
    
    const clearQueueOrHistory = async (isHistory) => {
        if (!db) return;
        const batch = writeBatch(db);
        const field = 'played';
        const operator = '==';
        const value = isHistory;
        const q = query(collection(db, 'queue'), where(field, operator, value));
        const itemsToDelete = await getDocs(q);
        itemsToDelete.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        setConfirmState({ show: false, title: '', message: '', onConfirm: () => {} });
    };

    const handleClearQueue = () => {
        setConfirmState({
            show: true, title: 'Clear Entire Upcoming Queue',
            message: 'Are you sure you want to delete all upcoming items? This cannot be undone.',
            onConfirm: () => clearQueueOrHistory(false)
        });
    };

    const handleClearHistory = () => {
        setConfirmState({
            show: true, title: 'Clear Entire Played History',
            message: 'Are you sure you want to delete all played items from the history? This cannot be undone.',
            onConfirm: () => clearQueueOrHistory(true)
        });
    };

    const handleVote = async (songId, voteType) => {
        if (!db || !user) return;
        const songRef = doc(db, 'queue', songId);
        const batch = writeBatch(db);
        const currentVote = votedSongs.find(v => v.id === songId)?.vote;

        if (currentVote) {
            const fieldToRemove = currentVote === 'like' ? 'likes' : 'dislikes';
            batch.update(songRef, { [fieldToRemove]: arrayRemove(user.uid) });
        }

        if (currentVote !== voteType) {
            const fieldToAdd = voteType === 'like' ? 'likes' : 'dislikes';
            batch.update(songRef, { [fieldToAdd]: arrayUnion(user.uid) });
            setVotedSongs(votedSongs.filter(v => v.id !== songId).concat({ id: songId, vote: voteType }));
        } else {
            setVotedSongs(votedSongs.filter(v => v.id !== songId));
        }

        await batch.commit();
    };

    const handleLogout = async () => {
        if (db && activeDj && user && activeDj.uid === user.uid) {
            await deleteDoc(doc(db, "settings", "active_dj"));
        }
        await signOut(auth);
        setDjDetails(null);
    };

    const handleDragStart = (e, type, payload) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type, payload }));
    };

    const handleDropOnQueue = async (e) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.type === 'request') {
            await handleAddRequestToQueue(data.payload, 'last');
        } else if (data.type === 'event') {
            handleToolClick(data.payload)
        }
    };

    const handleAddToLineDances = async (request) => {
        if (!db || !request.danceName) return;
        const collectionPath = `artifacts/${appId}/public/data/line_dances`;
        await addDoc(collection(db, collectionPath), {
            danceName: request.danceName, songTitle: request.songName,
            songArtist: request.artist, stepSheetLink: request.stepSheetUrl || ''
        });
    };

    // --- RENDER LOGIC ---

    const upcomingQueueSorted = queue.filter(item => !item.played).sort((a, b) => a.order - b.order);
    const recentlyPlayedQueue = queue.filter(item => item.played).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    const publicQueueToShow = showAllPublicQueue ? upcomingQueueSorted : upcomingQueueSorted.slice(0, 5);

    const filteredRequests = requests.filter(req => 
        (req.songName && req.songName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (req.artist && req.artist.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (req.danceName && req.danceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (req.customerName && req.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const currentDjDetailsOnAir = activeDj?.uid ? djs.find(dj => dj.id === activeDj.uid) : null;
    
    const renderDjToolModal = () => {
        if (!djToolModal.show) return null;
        const { tool, title, eventName } = djToolModal;
        let content;
        switch (tool) {
            case 'Line Dance':
                content = <LineRequestForm onAddToQueue={addToQueue} djName={djDetails?.name} lineDancesList={lineDances} />;
                break;
            case 'Line Dance Lesson':
                content = <DjLineDanceLessonForm onAddToQueue={addToQueue} djName={djDetails?.name} lineDancesList={lineDances} />;
                break;
            case 'Country Partner':
                content = <PartnerRequestForm onAddToQueue={addToQueue} djName={djDetails?.name} partnerDancesList={partnerDancesList} />;
                break;
            case 'West Coast':
                content = <PartnerRequestForm onAddToQueue={addToQueue} djName={djDetails?.name} initialDanceType="West Coast Swing" partnerDancesList={partnerDancesList} />;
                break;
            case 'timeInput':
                content = <TimeInputModal onConfirm={(time) => handleTimeEventConfirm(time, eventName)} eventName={eventName} />;
                break;
            case 'Custom Announcement':
                content = <AnnouncementForm onAddToQueue={addToQueue} />;
                break;
            case 'Birthday Shout-Out':
                content = <ShoutOutForm onAddToQueue={addToQueue} />;
                break;
            case 'AI Announcement':
                return <GeminiAnnouncementModal show={true} onClose={() => setDjToolModal({ show: false, tool: null })} />;
            default:
                content = null;
        }
        return (
            <Modal show={true} onClose={() => setDjToolModal({ show: false, tool: null })} title={title}>
                {content}
            </Modal>
        );
    };

    if (authError) {
        return (
            <div className="bg-gray-900 text-white min-h-screen flex flex-col justify-center items-center p-8 text-center">
                <h1 className="text-3xl text-red-500 mb-4">Authentication Error</h1>
                <p className="max-w-md text-gray-300">{authError}</p>
            </div>
        )
    }

    if (!authReady) {
        return (
            <div className="static-loader-container">
                <div className="loader"></div>
                <p className="mt-4">Loading the Dance Floor...</p>
            </div>
        );
    }

    if (djDetails) {
        if (showAdminPanel) {
            return <AdminPanel djs={djs} onClose={() => setShowAdminPanel(false)} />;
        }
         if (showManageLineDances) {
            return <LineDanceManagement onClose={() => setShowManageLineDances(false)} onAddToQueue={addToQueue} />;
        }
        return (
            <div className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
                {editingItem && <EditQueueItemModal item={editingItem} onSave={handleSaveEditedItem} onClose={() => setEditingItem(null)} />}
                <ConfirmModal {...confirmState} onClose={() => setConfirmState({ ...confirmState, show: false })} />
                {renderDjToolModal()}
                <ChangePasswordModal show={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} onSave={handleChangePassword} />

                <header className="flex justify-between items-center mb-6 pb-4 border-b-2 border-cyan-400">
                    <div className="flex items-center gap-4">
                        <img 
                            src="/logo.png" 
                            alt="Logo" 
                            className="w-16 h-16 rounded-md"
                            onError={(e) => { e.target.onerror = null; e.target.outerHTML = `<div class="w-16 h-16 bg-gray-700 rounded-md flex items-center justify-center text-gray-400 font-bold text-xs">LOGO</div>` }}
                        />
                        <h1 className="text-3xl md:text-4xl font-bold text-cyan-400">DJ Console</h1>
                        <h2 className="text-2xl text-white font-semibold">{djDetails.name}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowManageLineDances(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">Manage Line Dances</button>
                        {djDetails.role === 'admin' && (
                            <button onClick={() => setShowAdminPanel(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg">Admin Panel</button>
                        )}
                        <button onClick={() => setShowChangePasswordModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg">Change Password</button>
                        <button onClick={handleLogout} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg">Logout</button>
                    </div>
                </header>
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-1/2 flex flex-col gap-6">
                        
                        <DjToolsPanel onToolClick={handleToolClick} onDragStart={handleDragStart} />

                        <div>
                            <h3 className="text-2xl font-semibold text-pink-400 mb-3">Submitted Requests ({filteredRequests.length})</h3>
                            <input 
                                type="text"
                                placeholder="Search by song, artist, dance, or name..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full p-2 mb-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            />
                            <div className="bg-gray-800 p-4 rounded-lg max-h-96 overflow-y-auto space-y-3">
                                {filteredRequests.length > 0 ? filteredRequests.map(req => {
                                    const isPartnerDance = partnerDancesList.some(p => p.name.toLowerCase() === req.danceName?.toLowerCase());
                                    const isLineDance = req.danceName && !isPartnerDance;
                                    const borderColorClass = isPartnerDance ? 'border-teal-400' : isLineDance ? 'border-pink-500' : 'border-transparent';

                                    return (
                                        <div key={req.id} draggable onDragStart={(e) => handleDragStart(e, 'request', req)} className={`bg-gray-700 p-3 rounded-lg cursor-grab border-l-4 ${borderColorClass}`}>
                                            <p><span className="font-bold text-cyan-300">{req.danceName}</span> - <span className="text-gray-300">{req.songName}</span> by <span className="italic text-gray-400">{req.artist}</span></p>
                                            <p className="text-sm text-gray-500">From: {req.customerName}</p>
                                            {req.spotifyLink && <a href={req.spotifyLink} target="_blank" rel="noopener noreferrer" className="text-green-400 text-sm hover:underline">Spotify Link</a>}
                                            {req.stepSheetUrl && <a href={req.stepSheetUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-sm hover:underline ml-2">Step Sheet</a>}
                                            <div className="flex gap-2 mt-2">
                                                <button onClick={() => handleAddRequestToQueue(req, 'next')} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded">Add Next</button>
                                                <button onClick={() => handleAddRequestToQueue(req, 'last')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded">Add Last</button>
                                                <button onClick={() => handleDeleteRequest(req.id)} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded">Delete</button>
                                                {isLineDance && (
                                                    <button onClick={() => handleAddToLineDances(req)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded text-xs" title="Add to managed line dances">+</button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                }) : <p className="text-gray-400">No matching requests.</p>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold text-pink-400 mb-3">Tipping Links</h3>
                            <form onSubmit={handleSaveTippingInfo} className="bg-gray-800 p-4 rounded-lg space-y-3">
                                <input type="text" value={venmoUser} onChange={e => setVenmoUser(e.target.value)} placeholder="Venmo Username" className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                                <input type="text" value={cashappUser} onChange={e => setCashappUser(e.target.value)} placeholder="Cash App $Cashtag" className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                                <div className="flex items-center gap-4">
                                    <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-bold py-2 px-4 rounded-lg">Save Tips</button>
                                    {tipSaveConfirm && <span className="text-green-400 text-2xl">✔️</span>}
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="lg:w-1/2">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-2xl font-semibold text-pink-400">{showDjHistory ? 'Played History' : "Tonight's Dance Queue"}</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowDjHistory(!showDjHistory)} className="bg-gray-700 hover:bg-gray-600 text-cyan-300 font-semibold py-1 px-3 rounded-lg text-sm">
                                    {showDjHistory ? 'View Queue' : 'View History'}
                                </button>
                                <button onClick={showDjHistory ? handleClearHistory : handleClearQueue} className="bg-red-800 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-lg text-sm">
                                    {showDjHistory ? 'Clear History' : 'Clear Queue'}
                                </button>
                            </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg min-h-[50vh]">
                            {showDjHistory ? (
                                <QueueList queue={recentlyPlayedQueue} isDjView={true} title="History" />
                            ) : (
                                <QueueList queue={upcomingQueueSorted} isDjView={true} onReorder={handleQueueReorder} onEdit={setEditingItem} onDelete={handleDeleteQueueItem} onMove={handleMoveQueueItem} onMarkAsPlayed={handleMarkAsPlayed} title="Queue" isUpcomingQueue={true} onDrop={handleDropOnQueue} onDragOver={(e) => e.preventDefault()} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Modal show={showLineRequestModal} onClose={() => setShowLineRequestModal(false)} title="Request a Line Dance">
                <RequestForm onClose={() => setShowLineRequestModal(false)} tippingInfo={currentDjDetailsOnAir} formType="line" lineDancesList={lineDances} openTippingModal={() => setShowTipModal(true)} />
            </Modal>
            <Modal show={showPartnerRequestModal} onClose={() => setShowPartnerRequestModal(false)} title="Request a Partner Dance">
                <RequestForm onClose={() => setShowPartnerRequestModal(false)} tippingInfo={currentDjDetailsOnAir} formType="partner" openTippingModal={() => setShowTipModal(true)} partnerDancesList={partnerDancesList} />
            </Modal>
            <Modal show={showLoginModal} onClose={() => setShowLoginModal(false)} title="DJ Login">
                <DJLogin onLogin={() => setShowLoginModal(false)} />
            </Modal>
            <TippingModal show={showTipModal} onClose={() => setShowTipModal(false)} tippingInfo={currentDjDetailsOnAir} />

            <header className="relative text-center mb-8">
                 <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="absolute top-0 left-0 h-32 md:h-48 rounded-md"
                    onError={(e) => { e.target.onerror = null; e.target.outerHTML = `<div class="absolute top-0 left-0 w-16 h-16 md:w-20 md:h-20 bg-gray-700 rounded-md flex items-center justify-center text-gray-400 font-bold">LOGO</div>` }}
                 />
                 <button onClick={() => setShowLoginModal(true)} className="absolute top-0 right-0 text-gray-400 hover:text-cyan-300 transition-colors bg-gray-800/50 hover:bg-gray-700/70 font-bold py-2 px-4 rounded-lg">
                    DJ Login
                </button>
                <div className="bg-gray-800/50 rounded-lg py-1 mb-2">
                   <p className="text-white text-lg md:text-xl">Dancing with <a href="https://qjay.app" target="_blank" className="text-cyan-300 hover:underline">Qjay.app</a> at</p>
                </div>
                <h1 className="text-7xl md:text-8xl font-neon text-white">
                    Neon Boots
                </h1>
                <p className="text-cyan-300 text-lg mt-2">Houston's Premier Country & Western Dance Club</p>
                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 mt-6">
                    <button onClick={() => setShowLineRequestModal(true)} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-1 px-4 rounded-lg transition-colors">
                        Request Line Dance
                    </button>
                    <button onClick={() => setShowPartnerRequestModal(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-1 px-4 rounded-lg transition-colors">
                        Request Partner Dance
                    </button>
                     {currentDjDetailsOnAir && (currentDjDetailsOnAir.venmo || currentDjDetailsOnAir.cashapp) && (
                        <button onClick={() => setShowTipModal(true)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-4 rounded-lg transition-colors">
                            Tip the DJ
                        </button>
                    )}
                    <a href="https://www.neonbootsclub.com/" target="_blank" rel="noopener noreferrer" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-1 px-4 rounded-lg transition-colors">
                        Visit Website
                    </a>
                </div>
            </header>
            <main>
                <div className="flex flex-col sm:flex-row justify-center items-center sm:items-baseline gap-2 sm:gap-4 mb-4">
                    <h2 className="text-3xl font-bold text-center text-cyan-400">Tonight's Dance Queue</h2>
                    {activeDj?.name && <p className="text-lg text-gray-300">Your DJ is {activeDj.name}</p>}
                </div>
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                    <QueueList queue={publicQueueToShow} isDjView={false} title="Queue" isUpcomingQueue={true} onVote={handleVote} votedSongs={votedSongs} user={user} />
                     {upcomingQueueSorted.length > 5 && (
                        <div className="text-center mt-4">
                            <button onClick={() => setShowAllPublicQueue(!showAllPublicQueue)} className="text-cyan-400 hover:underline">
                                {showAllPublicQueue ? 'Show Less' : `Show All (${upcomingQueueSorted.length})`}
                            </button>
                        </div>
                    )}
                </div>

                {recentlyPlayedQueue.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-3xl font-bold text-center text-cyan-400 mb-4">Recently Played</h2>
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                            <QueueList queue={recentlyPlayedQueue} isDjView={false} title="Recently Played" onVote={handleVote} votedSongs={votedSongs} user={user} />
                        </div>
                    </div>
                )}
                <TippingSection tippingInfo={currentDjDetailsOnAir} openTippingModal={() => setShowTipModal(true)}/>
            </main>
            <footer className="text-center mt-8 pt-4 border-t border-gray-700">
                <p className="text-gray-500">&copy; 2025 W. Justin Butterfras. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default App;
