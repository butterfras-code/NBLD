import React, { useState, useEffect, useCallback } from 'react';
import { db } from './services/firebase';
import { callGeminiAPI } from './services/gemini';
import Modal from './components/Modal';
import ConfirmModal from './components/ConfirmModal';
import GeminiAnnouncementModal from './components/GeminiAnnouncementModal';
import RequestForm from './components/RequestForm';
import PromptModal from './components/PromptModal';
import LineDanceLessonModal from './components/LineDanceLessonModal';
import TippingSection from './components/TippingSection';
import DJLogin from './components/DJLogin';
import QueueList from './components/QueueList';
import EditQueueItemModal from './components/EditQueueItemModal';
import AdminPanel from './components/AdminPanel';
import ChangePasswordModal from './components/ChangePasswordModal';
import LineDanceManagement from './components/LineDanceManagement';

const App = () => {
    const [loggedInDj, setLoggedInDj] = useState(null);
    const [activeDj, setActiveDj] = useState(null);
    const [queue, setQueue] = useState([]);
    const [requests, setRequests] = useState([]);
    const [djs, setDjs] = useState([]);
    const [lineDances, setLineDances] = useState([]);
    const [showLineRequestModal, setShowLineRequestModal] = useState(false);
    const [showPartnerRequestModal, setShowPartnerRequestModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showLineDanceLessonModal, setShowLineDanceLessonModal] = useState(false);
    const [showGeminiModal, setShowGeminiModal] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showManageLineDances, setShowManageLineDances] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [venmoUser, setVenmoUser] = useState('');
    const [cashappUser, setCashappUser] = useState('');
    const [tipSaveConfirm, setTipSaveConfirm] = useState(false);
    const [confirmState, setConfirmState] = useState({ show: false, title: '', message: '', onConfirm: () => {} });
    const [promptState, setPromptState] = useState({ show: false, title: '', message: '', onConfirm: () => {} });
    const [showDjHistory, setShowDjHistory] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [votedSongs, setVotedSongs] = useState(() => {
        const saved = localStorage.getItem('votedSongs');
        return saved ? JSON.parse(saved) : [];
    });
    const [userId, setUserId] = useState(() => {
        let id = localStorage.getItem('neonBootsUserId');
        if (!id) {
            id = Math.random().toString(36).substring(2, 15);
            localStorage.setItem('neonBootsUserId', id);
        }
        return id;
    });

    useEffect(() => {
        if (loggedInDj) {
            setVenmoUser(loggedInDj.venmo || '');
            setCashappUser(loggedInDj.cashapp || '');
        }
    }, [loggedInDj]);

    useEffect(() => {
        localStorage.setItem('votedSongs', JSON.stringify(votedSongs));
    }, [votedSongs]);

    useEffect(() => {
        if (!db) {
            console.log("Firestore not initialized, skipping data fetch.");
            return;
        }
        seedInitialData();
        const queueQuery = db.collection("queue").orderBy("order");
        const unsubscribeQueue = queueQuery.onSnapshot(snapshot => {
            const queueData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            queueData.sort((a, b) => {
                if (a.played && !b.played) return 1;
                if (!a.played && b.played) return -1;
                return a.order - b.order;
            });
            setQueue(queueData);
        });

        const requestsQuery = db.collection("requests").orderBy("createdAt", "desc");
        const unsubscribeRequests = requestsQuery.onSnapshot(snapshot => {
            setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const djsQuery = db.collection("djs");
        const unsubscribeDjs = djsQuery.onSnapshot(snapshot => {
            setDjs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const lineDancesQuery = db.collection(`artifacts/${appId}/public/data/line_dances`).orderBy("danceName");
        const unsubscribeLineDances = lineDancesQuery.onSnapshot(snapshot => {
            setLineDances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, error => {
            console.error("Error fetching line dances:", error);
        });
        
        const activeDjDoc = db.collection("settings").doc("active_dj");
        const unsubscribeActiveDj = activeDjDoc.onSnapshot(doc => {
            if (doc.exists) {
                setActiveDj(doc.data());
            } else {
                setActiveDj(null);
            }
        });

        return () => { 
            unsubscribeQueue(); 
            unsubscribeRequests(); 
            unsubscribeDjs(); 
            unsubscribeActiveDj();
            unsubscribeLineDances();
        };
    }, []);

    const handleAddRequestToQueue = async (request, position) => {
        if (!db) return;
        const upcomingQueue = queue.filter(q => !q.played);
        const batch = db.batch();
        
        const newItemData = {
            type: 'song',
            danceName: request.danceName,
            songName: request.songName,
            artist: request.artist,
            spotifyLink: request.spotifyLink || '',
            stepSheetUrl: request.stepSheetUrl || '',
            played: false,
            likes: [],
            dislikes: []
        };

        if (position === 'next') {
            newItemData.order = 1; // Position #2
            upcomingQueue.forEach(item => {
                if (item.order >= newItemData.order) {
                    batch.update(db.collection('queue').doc(item.id), { order: item.order + 1 });
                }
            });
        } else { // 'last'
            newItemData.order = upcomingQueue.length;
        }
        
        const newDocRef = db.collection('queue').doc();
        batch.set(newDocRef, newItemData);
        batch.delete(db.collection('requests').doc(request.id));
        await batch.commit();
    };

    const handleAddDanceToQueue = async (dance, position) => {
        if (!db || !loggedInDj) return;
        
        const upcomingQueue = queue.filter(q => !q.played);
        const newItemData = {
            type: 'song',
            danceName: dance.danceName,
            songName: dance.songTitle,
            artist: dance.songArtist,
            spotifyLink: dance.spotifyLink || '',
            stepSheetUrl: dance.stepSheetLink || '',
            isBeginnerFriendly: dance.isBeginnerFriendly || false,
            played: false,
            likes: [],
            dislikes: []
        };

        const batch = db.batch();
        
        if (position === 'next') {
            newItemData.order = 1;
            upcomingQueue.forEach(item => {
                if(item.order >= 1) {
                   batch.update(db.collection('queue').doc(item.id), { order: item.order + 1 });
                }
            });
        } else { // 'last'
            newItemData.order = upcomingQueue.length;
        }
        
        const newDocRef = db.collection('queue').doc();
        batch.set(newDocRef, newItemData);
        await batch.commit();
    };

    const handleDeleteRequest = async (id) => { if (!db) return; await db.collection('requests').doc(id).delete(); };

    const handleAddEventToQueue = (eventName, notes = '') => {
        const upcomingQueue = queue.filter(q => !q.played);
        db.collection('queue').add({ type: 'event', danceName: eventName, songName: notes, artist: '', order: upcomingQueue.length, played: false, likes: [], dislikes: [] });
    };

    const handleAddLineDanceLesson = async (danceName) => {
        if (!db) return;
        const upcomingQueue = queue.filter(q => !q.played);
        await db.collection('queue').add({ type: 'event', danceName: 'Line Dance Lesson', songName: `Teaching: ${danceName}`, artist: '', order: upcomingQueue.length, played: false, likes: [], dislikes: [] });
        setShowLineDanceLessonModal(false);
    };

    const handleSaveTippingInfo = async (e) => {
        e.preventDefault();
        if (!db || !loggedInDj) return;
        const djRef = db.collection("djs").doc(loggedInDj.id);
        const updatedDjData = { ...loggedInDj, venmo: venmoUser, cashapp: cashappUser };
        await djRef.update({ venmo: venmoUser, cashapp: cashappUser });
        setLoggedInDj(updatedDjData);
        setTipSaveConfirm(true);
        setTimeout(() => setTipSaveConfirm(false), 2000);
    };

    const handleChangePassword = async (newPassword) => {
        if (!db || !loggedInDj) return;
        const djRef = db.collection("djs").doc(loggedInDj.id);
        await djRef.update({ password: newPassword });
        setLoggedInDj({ ...loggedInDj, password: newPassword });
    };
    
    const handleQueueReorder = useCallback(async (dragIndex, dropIndex) => {
        if (!db) return;
        const upcomingQueue = queue.filter(item => !item.played);
        const newQueue = [...upcomingQueue];
        const [draggedItem] = newQueue.splice(dragIndex, 1);
        newQueue.splice(dropIndex, 0, draggedItem);
        const batch = db.batch();
        newQueue.forEach((item, index) => batch.update(db.collection('queue').doc(item.id), { order: index }));
        await batch.commit();
    }, [queue]);

    const handleMoveQueueItem = (index, direction) => {
        const upcomingQueue = queue.filter(item => !item.played);
        if (direction === 'up' && index > 0) handleQueueReorder(index, index - 1);
        else if (direction === 'down' && index < upcomingQueue.length - 1) handleQueueReorder(index, index + 1);
    };
    
    const handleSaveEditedItem = async (updatedItem) => {
        if (!db) return;
        const { id, ...data } = updatedItem;
        await db.collection('queue').doc(id).update(data);
        setEditingItem(null);
    };

    const handleMarkAsPlayed = async (id) => {
        if (!db) return;
        await db.collection('queue').doc(id).update({ played: true });
    };

    const handleDeleteQueueItem = (id) => {
        setConfirmState({
            show: true,
            title: 'Delete Item',
            message: 'Are you sure you want to permanently delete this item from the queue?',
            onConfirm: async () => {
                if (!db) return;
                const itemToDelete = queue.find(item => item.id === id);
                if (!itemToDelete) return;
                const batch = db.batch();
                batch.delete(db.collection('queue').doc(id));
                
                const upcomingQueue = queue.filter(q => !q.played && q.id !== id);
                upcomingQueue.forEach((item, index) => {
                    if (item.order > itemToDelete.order) {
                        batch.update(db.collection('queue').doc(item.id), { order: item.order - 1 });
                    }
                });

                await batch.commit();
                setConfirmState({ show: false, title: '', message: '', onConfirm: () => {} });
            }
        });
    };

    const handleClearQueue = () => {
        setConfirmState({
            show: true,
            title: 'Clear Entire Upcoming Queue',
            message: 'Are you sure you want to delete all upcoming items? This cannot be undone.',
            onConfirm: async () => {
                if (!db) return;
                const batch = db.batch();
                const upcomingItems = await db.collection('queue').where('played', '==', false).get();
                upcomingItems.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                setConfirmState({ show: false, title: '', message: '', onConfirm: () => {} });
            }
        });
    };

    const handleClearHistory = () => {
        setConfirmState({
            show: true,
            title: 'Clear Entire Played History',
            message: 'Are you sure you want to delete all played items from the history? This cannot be undone.',
            onConfirm: async () => {
                if (!db) return;
                const batch = db.batch();
                const playedItems = await db.collection('queue').where('played', '==', true).get();
                playedItems.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                setConfirmState({ show: false, title: '', message: '', onConfirm: () => {} });
            }
        });
    };

    const handleVote = async (songId, voteType) => {
        if (!db) return;
        const songRef = db.collection('queue').doc(songId);
        const existingVote = votedSongs.find(v => v.id === songId);
        const batch = db.batch();
        let newVotedSongs = [...votedSongs];

        if (existingVote) {
            const oldVoteType = existingVote.vote;
            const oldField = oldVoteType === 'like' ? 'likes' : 'dislikes';
            batch.update(songRef, { [oldField]: firebase.firestore.FieldValue.arrayRemove(userId) });
            newVotedSongs = newVotedSongs.filter(v => v.id !== songId);

            if (voteType !== oldVoteType) {
                const newField = voteType === 'like' ? 'likes' : 'dislikes';
                batch.update(songRef, { [newField]: firebase.firestore.FieldValue.arrayUnion(userId) });
                newVotedSongs.push({ id: songId, vote: voteType });
            }
        } else {
            const newField = voteType === 'like' ? 'likes' : 'dislikes';
            batch.update(songRef, { [newField]: firebase.firestore.FieldValue.arrayUnion(userId) });
            newVotedSongs.push({ id: songId, vote: voteType });
        }

        await batch.commit();
        setVotedSongs(newVotedSongs);
    };

    const handleLoginSuccess = async (dj) => {
        setLoggedInDj(dj);
        setShowLoginModal(false);
        if (db) {
            await db.collection("settings").doc("active_dj").set({ name: dj.name });
        }
    };

    const handleLogout = async () => {
        if (db) {
            await db.collection("settings").doc("active_dj").set({ name: null });
        }
        setLoggedInDj(null);
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
            handleAddEventToQueue(data.payload);
        }
    };

    const handleAddToLineDances = async (request) => {
        if (!db || !request.danceName) return;
        const collectionPath = `artifacts/${appId}/public/data/line_dances`;
        await db.collection(collectionPath).add({
            danceName: request.danceName,
            songTitle: request.songName,
            songArtist: request.artist,
            stepSheetLink: request.stepSheetUrl || ''
        });
    };

    const upcomingQueue = queue.filter(item => !item.played);
    const recentlyPlayedQueue = queue.filter(item => item.played);
    const filteredRequests = requests.filter(req => 
        (req.songName && req.songName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (req.artist && req.artist.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (req.danceName && req.danceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (req.customerName && req.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const currentDjDetails = activeDj?.name ? djs.find(dj => dj.name === activeDj.name) : null;

    if (!db) {
        return (
            <div className="bg-gray-900 text-white min-h-screen flex flex-col justify-center items-center">
                <h1 className="text-3xl text-red-500">Firebase Not Configured</h1>
                <p className="mt-4">This app requires a Firebase configuration to run.</p>
            </div>
        );
    }

    if (loggedInDj) {
        if (showAdminPanel) {
            return <AdminPanel djs={djs} onClose={() => setShowAdminPanel(false)} />;
        }
         if (showManageLineDances) {
            return <LineDanceManagement onClose={() => setShowManageLineDances(false)} onAddDanceToQueue={handleAddDanceToQueue} />;
        }
        return (
            <div className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
                {editingItem && <EditQueueItemModal item={editingItem} onSave={handleSaveEditedItem} onClose={() => setEditingItem(null)} />}
                <ConfirmModal {...confirmState} onClose={() => setConfirmState({ ...confirmState, show: false })} />
                <PromptModal {...promptState} onClose={() => setPromptState({ ...promptState, show: false })} />
                <LineDanceLessonModal show={showLineDanceLessonModal} onClose={() => setShowLineDanceLessonModal(false)} onConfirm={handleAddLineDanceLesson} lineDancesList={lineDances} />
                <GeminiAnnouncementModal show={showGeminiModal} onClose={() => setShowGeminiModal(false)} />
                <ChangePasswordModal show={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)} onSave={handleChangePassword} />

                <header className="flex justify-between items-center mb-6 pb-4 border-b-2 border-cyan-400">
                    <div className="flex items-baseline gap-4">
                        <h1 className="text-3xl md:text-4xl font-bold text-cyan-400">DJ Console</h1>
                        <h2 className="text-2xl text-white font-semibold">{loggedInDj.name}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowManageLineDances(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">Manage Line Dances</button>
                        {loggedInDj.role === 'admin' && (
                            <button onClick={() => setShowAdminPanel(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg">Admin Panel</button>
                        )}
                        <button onClick={() => setShowChangePasswordModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg">Change Password</button>
                        <button onClick={handleLogout} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg">Logout</button>
                    </div>
                </header>
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-1/2 flex flex-col gap-6">
                        <div>
                            <h3 className="text-2xl font-semibold text-pink-400 mb-3">DJ Tools</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setShowGeminiModal(true)} className="bg-purple-600 hover:bg-purple-700 col-span-2 text-white font-semibold p-3 rounded-lg text-center">✨ Generate Announcement</button>
                                <button draggable onDragStart={(e) => handleDragStart(e, 'event', 'Line Dance Lesson')} onClick={() => setShowLineDanceLessonModal(true)} className="bg-gray-700 hover:bg-gray-600 text-cyan-300 font-semibold p-3 rounded-lg text-center cursor-grab">Line Dance Lesson</button>
                                {['Line Dance', 'Country Partner', 'West Coast', 'Couples Dance', 'Last Call', 'Closing Time'].map(event => (
                                    <button key={event} draggable onDragStart={(e) => handleDragStart(e, 'event', event)} onClick={() => handleAddEventToQueue(event)} className="bg-gray-700 hover:bg-gray-600 text-cyan-300 font-semibold p-3 rounded-lg text-center cursor-grab">{event}</button>
                                ))}
                            </div>
                        </div>
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
                            <h3 className="text-2xl font-semibold text-pink-400">{showDjHistory ? 'Played History' : 'Live Dance Queue'}</h3>
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
                                <QueueList queue={upcomingQueue} isDjView={true} onReorder={handleQueueReorder} onEdit={setEditingItem} onDelete={handleDeleteQueueItem} onMove={handleMoveQueueItem} onMarkAsPlayed={handleMarkAsPlayed} title="Queue" isUpcomingQueue={true} onDrop={handleDropOnQueue} onDragOver={(e) => e.preventDefault()} />
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
                <RequestForm onClose={() => setShowLineRequestModal(false)} tippingInfo={currentDjDetails} formType="line" lineDancesList={lineDances}/>
            </Modal>
            <Modal show={showPartnerRequestModal} onClose={() => setShowPartnerRequestModal(false)} title="Request a Partner Dance">
                <RequestForm onClose={() => setShowPartnerRequestModal(false)} tippingInfo={currentDjDetails} formType="partner" />
            </Modal>
            <Modal show={showLoginModal} onClose={() => setShowLoginModal(false)} title="DJ Login">
                <DJLogin onLogin={handleLoginSuccess} djs={djs} />
            </Modal>
            <header className="relative text-center mb-8">
                 <button onClick={() => setShowLoginModal(true)} className="absolute top-0 right-0 text-gray-400 hover:text-cyan-300 transition-colors bg-gray-800/50 hover:bg-gray-700/70 font-bold py-2 px-4 rounded-lg">
                    DJ Login
                </button>
                <h1 className="text-7xl md:text-8xl font-neon" style={{ color: '#ff00ff' }}>
                    Neon Boots
                </h1>
                <p className="text-cyan-300 text-lg mt-2">Houston's Premier Country & Western Dance Club</p>
                <div className="flex justify-center gap-4 mt-6">
                    <a href="https://www.neonbootsclub.com/" target="_blank" rel="noopener noreferrer" className="bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-gray-900 font-bold py-2 px-6 rounded-lg transition-colors">
                        Visit Website
                    </a>
                    <button onClick={() => setShowLineRequestModal(true)} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Request Line Dance
                    </button>
                    <button onClick={() => setShowPartnerRequestModal(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Request Partner Dance
                    </button>
                </div>
            </header>
            <main>
                <div className="flex justify-center items-baseline gap-4 mb-4">
                    <h2 className="text-3xl font-bold text-center text-cyan-400">Live Dance Queue</h2>
                    {activeDj?.name && <p className="text-lg text-gray-300">Your DJ is {activeDj.name}</p>}
                </div>
                <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                    <QueueList queue={upcomingQueue} isDjView={false} title="Queue" isUpcomingQueue={true} onVote={handleVote} votedSongs={votedSongs} />
                </div>

                {recentlyPlayedQueue.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-3xl font-bold text-center text-cyan-400 mb-4">Recently Played</h2>
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                            <QueueList queue={recentlyPlayedQueue} isDjView={false} title="Recently Played" onVote={handleVote} votedSongs={votedSongs} />
                        </div>
                    </div>
                )}
                <TippingSection tippingInfo={currentDjDetails} />
            </main>
            <footer className="text-center mt-8 pt-4 border-t border-gray-700">
                <p className="text-gray-500">&copy; 2024 Neon Boots. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default App;
