import React, { useRef } from 'react';
import { partnerDancesList } from '../utils/data';

const QueueList = ({ queue, isDjView, onReorder, onEdit, onDelete, onMove, onMarkAsPlayed, title, isUpcomingQueue, onVote, votedSongs = [], onDrop, onDragOver }) => {
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleDragStart = (e, index) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragEnter = (e, index) => { dragOverItem.current = index; };
    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            onReorder(dragItem.current, dragOverItem.current);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };
    
    if (queue.length === 0 && !isDjView) {
        return <div className="text-center text-gray-400 py-8">The {title.toLowerCase()} is currently empty.</div>
    }

    return (
        <div className="space-y-3" onDrop={onDrop} onDragOver={onDragOver}>
            {queue.map((item, index) => {
                const isNowPlaying = isUpcomingQueue && index === 0;
                const totalVotes = (item.likes?.length || 0) + (item.dislikes?.length || 0);
                const likePercentage = totalVotes > 0 ? Math.round(((item.likes?.length || 0) / totalVotes) * 100) : null;
                const canVote = !isDjView && item.type === 'song' && (isNowPlaying || item.played);
                const currentVote = votedSongs.find(v => v.id === item.id)?.vote;

                const isPartnerDance = partnerDancesList.some(p => p.name === item.danceName);
                const isLineDance = item.type === 'song' && item.danceName && !isPartnerDance;
                const borderColorClass = isPartnerDance ? 'border-teal-400' : isLineDance ? 'border-pink-500' : 'border-transparent';

                const itemContent = (
                    <div 
                        className={`flex items-center gap-4 p-3 rounded-lg shadow-md transition-all border-l-4
                            ${item.type === 'event' ? 'bg-pink-600' : 'bg-gray-700'} 
                            ${item.played ? 'opacity-50' : ''}
                            ${isDjView && !item.played ? 'cursor-move' : ''}
                            ${borderColorClass}`}
                        draggable={isDjView && !item.played}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <div className="text-2xl font-bold text-cyan-300 w-8 text-center">{index + 1}</div>
                        <div className="w-12 h-12 bg-gray-800 rounded-md flex items-center justify-center text-3xl text-gray-500">
                            {item.spotifyLink ? (
                                <a href={item.spotifyLink} target="_blank" rel="noopener noreferrer" title="Listen on Spotify">
                                    <svg className="h-8 w-8 text-green-400 hover:text-green-300" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.423 13.923c-.213.32-.633.426-.953.213-2.66-1.633-6.003-1.996-9.98-1.093-.426.093-.853-.173-.946-.6-.093-.426.173-.853.6-.946 4.346-.986 8.08-.55 10.996 1.28.32.213.426.633.213.953zm.64-2.453c-.266.373-.76.48-1.133.213-2.986-1.813-7.466-2.346-11.186-1.28-.48.12-.986-.186-1.106-.666-.12-.48.186-.986.666-1.106 4.16-1.186 9.013-.593 12.386 1.493.373.267.48.76.213 1.133zm.107-2.56c-.32.426-.88.56-1.306.24-3.466-2.106-9.252-2.293-12.919-1.253-.56.133-1.12-.213-1.253-.773-.133-.56.213-1.12.773-1.253 4.186-1.146 10.452-.933 14.36 1.493.426.32.56.88.24 1.306z"/>
                                    </svg>
                                </a>
                            ) : '🎵'}
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center gap-2">
                                <p className={`font-bold text-lg ${item.type === 'event' ? 'text-white' : 'text-cyan-300'}`}>
                                    {item.songName || item.danceName}
                                </p>
                            </div>
                            
                            {item.danceName && item.songName && (
                                <div className="flex items-center gap-2">
                                    <p className={`text-sm ${item.type === 'event' ? 'text-pink-200' : 'text-gray-300'}`}>
                                        ({item.danceName})
                                    </p>
                                    {item.stepSheetUrl && (
                                        <a href={item.stepSheetUrl} target="_blank" rel="noopener noreferrer" className="bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 rounded-md hover:bg-purple-700">
                                            step sheet
                                        </a>
                                    )}
                                </div>
                            )}
                            <p className="text-xs text-gray-400">{item.artist}</p>
                        </div>
                        {canVote && (
                            <div className="flex gap-2">
                                <button onClick={() => onVote(item.id, 'like')} className={`rating-button text-2xl ${currentVote === 'like' ? 'selected' : ''}`}>👍</button>
                                <button onClick={() => onVote(item.id, 'dislike')} className={`rating-button text-2xl ${currentVote === 'dislike' ? 'selected' : ''}`}>👎</button>
                            </div>
                        )}
                        {isDjView && (
                            <div className="flex flex-col md:flex-row items-center gap-2">
                                {likePercentage !== null && <div className="text-sm font-bold text-green-400">{likePercentage}% 👍</div>}
                                {!item.played && (
                                    <button onClick={() => onMarkAsPlayed(item.id)} className="text-green-400 hover:text-green-300 p-1 rounded-full neon-checkmark" title="Mark as Played">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>
                                )}
                                <div className="flex flex-col">
                                    <button onClick={() => onMove(index, 'up')} className="text-gray-300 hover:text-white" disabled={item.played}>▲</button>
                                    <button onClick={() => onMove(index, 'down')} className="text-gray-300 hover:text-white" disabled={item.played}>▼</button>
                                </div>
                                <button onClick={() => onEdit(item)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs">Edit</button>
                                <button onClick={() => onDelete(item.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">Delete</button>
                            </div>
                        )}
                    </div>
                );

                if (isNowPlaying) {
                    return (
                        <div key={item.id} className="border-2 border-cyan-400 rounded-lg p-2 now-playing-glow">
                            <p className="text-center font-bold text-cyan-300 text-sm animate-pulse pb-2">NOW PLAYING</p>
                            {itemContent}
                        </div>
                    );
                }

                return <div key={item.id}>{itemContent}</div>;
            })}
        </div>
    );
};

export default QueueList;
