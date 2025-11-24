import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, X, Music, Link as LinkIcon } from 'lucide-react';
import { Difficulty } from '../constants.js';
import { getDifficultyLabel, getDifficultyColor } from '../utils/helpers.js';
import { StorageService } from '../services/storage.service.js';

export const DanceSelector = ({ dancesDatabase, selectedDances, onChange, onAddNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDance, setNewDance] = useState({
    stepsheetUrl: '',
    name: '',
    song: '',
    artist: '',
    difficulty: Difficulty.Beginner
  });
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  
  const db = Array.isArray(dancesDatabase) ? dancesDatabase : [];
  const selectedIds = useMemo(
    () => new Set((selectedDances || []).map(s => s.id)),
    [selectedDances]
  );
  
  const maxResults = 200;
  const term = (searchTerm || '').toLowerCase().trim();
  
  const filteredDances = useMemo(() => {
    if (!db || db.length === 0) return [];
    const matches = [];
    
    if (!term) {
      for (const d of db) {
        if (selectedIds.has(d.id)) continue;
        matches.push(d);
      }
      return matches
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
        .slice(0, maxResults);
    }
    
    for (const d of db) {
      if (selectedIds.has(d.id)) continue;
      const name = String(d.name || '').toLowerCase();
      const artist = String(d.artist || '').toLowerCase();
      const song = String(d.song || '').toLowerCase();
      if (name.includes(term) || artist.includes(term) || song.includes(term)) {
        matches.push(d);
      }
    }
    
    return matches
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
      .slice(0, Math.min(matches.length, maxResults));
  }, [db, selectedIds, term]);
  
  const addDance = (dance) => {
    onChange([...selectedDances, dance]);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };
  
  const removeDance = (id) => {
    onChange(selectedDances.filter(d => d.id !== id));
  };
  
  const handleCreateDance = async (e) => {
    e.preventDefault();
    if (!newDance.name || !newDance.artist) return;
    
    const dance = {
      id: `custom-${Date.now()}`,
      name: newDance.name,
      song: newDance.song || '',
      artist: newDance.artist,
      difficulty: newDance.difficulty
    };
    
    if (newDance.stepsheetUrl) dance.stepsheetUrl = newDance.stepsheetUrl;
    
    try {
      await StorageService.addDance(dance);
    } catch (e) {
      console.error('Failed to add dance:', e);
    }
    
    onAddNew(dance);
    addDance(dance);
    setShowAddForm(false);
    setNewDance({
      stepsheetUrl: '',
      name: '',
      song: '',
      artist: '',
      difficulty: Difficulty.Beginner
    });
  };
  
  // Dropdown positioning
  useEffect(() => {
    if (!isDropdownOpen) {
      setDropdownStyle(null);
      return;
    }
    
    const update = () => {
      if (!inputRef.current) return;
      const r = inputRef.current.getBoundingClientRect();
      const padding = 8;
      const width = Math.max(r.width, 200);
      let left = r.left;
      if (left + width + padding > window.innerWidth) {
        left = Math.max(padding, window.innerWidth - width - padding);
      }
      const top = r.bottom + 6;
      const bottomSpace = window.innerHeight - r.bottom;
      const maxHeight = Math.max(80, Math.min(300, bottomSpace - 16));
      setDropdownStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
        overflowY: 'auto'
      });
    };
    
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const t = setInterval(update, 250);
    
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      clearInterval(t);
    };
  }, [isDropdownOpen, searchTerm]);
  
  // Click outside handler
  useEffect(() => {
    const handler = (e) => {
      if (!isDropdownOpen) return;
      const target = e.target;
      if (inputRef.current && inputRef.current.contains(target)) return;
      if (dropdownRef.current && dropdownRef.current.contains(target)) return;
      setIsDropdownOpen(false);
    };
    
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isDropdownOpen]);
  
  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-3 mb-3">
        {selectedDances.map(dance => (
          <div
            key={dance.id}
            className="flex items-center bg-white border border-indigo-200 rounded-lg p-2 pr-3 shadow-sm"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${getDifficultyColor(
                dance.difficulty
              )}`}
            >
              L{dance.difficulty}
            </div>
            <div className="mr-3">
              <div className="text-sm font-semibold text-slate-800">{dance.name}</div>
              <div className="text-xs text-slate-500">{dance.artist}</div>
            </div>
            <button
              onClick={() => removeDance(dance.id)}
              className="text-slate-400 hover:text-red-500"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        
        {!showAddForm && (
          <div className="relative inline-block min-w-[250px] flex-grow">
            <div className="flex items-center border border-slate-300 rounded-lg px-3 py-2 bg-white focus-within:border-indigo-500 ring-0">
              <Search size={18} className="text-slate-400 mr-2" />
              <input
                ref={inputRef}
                type="text"
                className="outline-none text-sm w-full"
                placeholder="Add dance..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
              />
            </div>
            
            {isDropdownOpen && (
              <div
                className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                style={dropdownStyle ? dropdownStyle : { visibility: 'hidden' }}
                ref={dropdownRef}
                onMouseDown={e => e.preventDefault()}
              >
                {filteredDances.length > 0 ? (
                  filteredDances.map(d => (
                    <button
                      key={d.id}
                      onClick={() => addDance(d)}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50 flex items-center text-sm"
                    >
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${getDifficultyColor(d.difficulty)}`}
                      ></span>
                      <span className="font-medium mr-1">{d.name}</span>
                      <span className="text-slate-400">- {d.artist}</span>
                    </button>
                  ))
                ) : (
                  searchTerm && (
                    <div className="px-4 py-2 text-xs text-slate-400 italic">
                      No dances found
                    </div>
                  )
                )}
                
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full text-left px-4 py-2 bg-slate-50 text-indigo-600 hover:bg-indigo-50 text-sm font-medium border-t border-slate-100 flex items-center"
                >
                  <Plus size={14} className="mr-2" /> Create &quot;{searchTerm}&quot;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {showAddForm && (
        <form
          onSubmit={handleCreateDance}
          className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
        >
          <h4 className="text-sm font-bold text-slate-700 mb-3">Add New Dance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Stepsheet URL
              </label>
              <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 focus-within:border-indigo-500 transition-colors">
                <LinkIcon size={16} className="text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="url"
                  className="flex-1 outline-none text-sm min-w-0 bg-transparent"
                  placeholder="https://..."
                  value={newDance.stepsheetUrl}
                  onChange={e => setNewDance({ ...newDance, stepsheetUrl: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Dance Name
              </label>
              <input
                type="text"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                placeholder="e.g. Electric Slide"
                value={newDance.name}
                onChange={e => setNewDance({ ...newDance, name: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Song Title
              </label>
              <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 focus-within:border-indigo-500 transition-colors">
                <Music size={16} className="text-slate-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  className="flex-1 outline-none text-sm min-w-0 bg-transparent"
                  placeholder="e.g. Electric Boogie"
                  value={newDance.song}
                  onChange={e => setNewDance({ ...newDance, song: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Artist</label>
              <input
                type="text"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                placeholder="e.g. Marcia Griffiths"
                value={newDance.artist}
                onChange={e => setNewDance({ ...newDance, artist: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Difficulty Level
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:border-indigo-500 outline-none"
                  value={newDance.difficulty}
                  onChange={e => setNewDance({ ...newDance, difficulty: parseInt(e.target.value) })}
                >
                  {Object.values(Difficulty)
                    .filter(v => typeof v === 'number')
                    .map(v => (
                      <option key={v} value={v}>
                        {getDifficultyLabel(v)}
                      </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg"
            >
              Add & Select
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
