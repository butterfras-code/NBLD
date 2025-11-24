import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Check, X, ArrowRight, RefreshCcw, Save, ListMusic } from 'lucide-react';
import { DanceSelector } from './DanceSelector.jsx';
import { StorageService } from '../services/storage.service.js';
import { normalizeDate, parseYMD } from '../utils/helpers.js';

export const InstructorPortal = ({ instructor, month }) => {
  const [activeDays, setActiveDays] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [monthlyDances, setMonthlyDances] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dances, setDances] = useState([]);
  const [activeTab, setActiveTab] = useState('availability');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await StorageService.getMonthData(month.getMonth(), month.getFullYear());
        const avail = data?.availability || [];
        const existingSchedules = data?.schedules || [];
        const allDances = data?.dances || [];
        
        setDances(allDances || []);
        
        if (existingSchedules.length > 0) {
          const dbDates = existingSchedules
            .filter(s => !s.isHoliday)
            .map(s => normalizeDate(s.date))
            .sort();
          setActiveDays(dbDates);
        } else {
          setActiveDays([]);
        }
        
        const myAvail = avail.find(a => a.instructorId === instructor.id);
        if (myAvail) {
          setAvailableDates(myAvail.availableDates || []);
          if (myAvail.selectedDances?.length > 0) {
            setMonthlyDances(myAvail.selectedDances);
          } else {
            setMonthlyDances([]);
            const mySchedules = (existingSchedules || [])
              .flatMap(day => day.lessons || [])
              .filter(l => l.instructorId === instructor.id);
            
            if (mySchedules.length > 0) {
              const danceMap = new Map();
              mySchedules.forEach(l => {
                if (!danceMap.has(l.danceId)) {
                  const fullDance =
                    (allDances || []).find(d => d.id === l.danceId) ||
                    {
                      id: l.danceId,
                      name: l.danceName,
                      difficulty: l.difficulty,
                      artist: 'Unknown'
                    };
                  danceMap.set(l.danceId, fullDance);
                }
              });
              setMonthlyDances(Array.from(danceMap.values()));
            }
          }
        } else {
          setAvailableDates([]);
          setMonthlyDances([]);
        }
      } catch (e) {
        console.error('Failed to load data:', e);
      }
    };
    load();
  }, [month, instructor.id]);

  const toggleAvailability = (dateStr) =>
    setAvailableDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );

  const handleAddDanceToDb = async newDance => {
    try {
      await StorageService.addDance(newDance);
      setDances(prev => [...prev, newDance]);
    } catch (e) {
      alert('Could not save dance.');
    }
  };

  const handleCopyFromPrevious = async () => {
    try {
      const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
      const prevData = await StorageService.getMonthData(prevMonth.getMonth(), prevMonth.getFullYear());
      const prevAvail = prevData?.availability?.find(a => a.instructorId === instructor.id);
      
      if (prevAvail?.selectedDances?.length > 0) {
        setMonthlyDances(prevAvail.selectedDances);
        alert(`Copied ${prevAvail.selectedDances.length} dances from ${format(prevMonth, 'MMMM yyyy')}`);
      } else {
        alert('No dances found in previous month');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to copy from previous month');
    }
  };

  const handleSave = async () => {
    if (availableDates.length > 0 && monthlyDances.length === 0) {
      alert('Please select at least one dance.');
      return;
    }
    
    setIsSaving(true);
    try {
      await StorageService.saveAvailability({
        instructorId: instructor.id,
        month: month.getMonth(),
        year: month.getFullYear(),
        availableDates,
        selectedDances: monthlyDances
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      alert('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm max-w-md">
        <button
          onClick={() => setActiveTab('availability')}
          className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'availability'
              ? 'bg-indigo-100 text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Calendar size={16} className="mr-2" />
          Availability
        </button>
        <button
          onClick={() => setActiveTab('planning')}
          className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'planning'
              ? 'bg-indigo-100 text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <ListMusic size={16} className="mr-2" />
          Preferences
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            {activeTab === 'availability' ? 'When can you teach?' : 'What can you teach?'}
          </h2>
          {savedSuccess && (
            <span className="text-green-600 font-medium flex items-center bg-green-50 px-3 py-1 rounded-full">
              <Check size={16} className="mr-1" />
              Submitted
            </span>
          )}
        </div>

        {activeTab === 'availability' && (
          <div className="space-y-4">
            <p className="text-slate-500 mb-4">
              Select your available dates.
              {activeDays.length === 0 && (
                <span className="text-orange-500 ml-1 font-bold">
                  {' '}
                  No class dates scheduled yet.
                </span>
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeDays.map(dateStr => {
                const displayDate = parseYMD(dateStr);
                const isAvailable = availableDates.includes(dateStr);
                return (
                  <button
                    key={dateStr}
                    onClick={() => toggleAvailability(dateStr)}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center sm:justify-between ${
                      isAvailable
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-bold text-lg text-slate-700">
                        {format(displayDate, 'MMMM d')}
                      </div>
                      <div className="text-sm text-slate-500">{format(displayDate, 'EEEE')}</div>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ml-4 ${
                        isAvailable ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isAvailable ? <Check size={20} /> : <X size={20} />}
                    </div>
                  </button>
                );
              })}
            </div>
            {activeDays.length > 0 && (
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setActiveTab('planning')}
                  className="flex items-center bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Next: Select Dances <ArrowRight size={16} className="ml-2" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'planning' && (
          <div className="space-y-8">
            {availableDates.length === 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center text-orange-700 text-sm mb-4">
                <div className="mr-3 p-2 bg-orange-100 rounded-full">
                  <Calendar size={16} />
                </div>
                <div>
                  <strong>No dates selected.</strong> Submit to mark unavailable.
                </div>
              </div>
            )}
            
            <div className="border border-indigo-100 rounded-xl p-6 bg-indigo-50/30">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-indigo-900">
                  Dance Repertoire for {format(month, 'MMMM')}
                </h3>
                <button
                  onClick={handleCopyFromPrevious}
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200"
                >
                  <RefreshCcw size={14} className="mr-1.5" />
                  Copy from Previous
                </button>
              </div>
              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                <DanceSelector
                  dancesDatabase={dances}
                  selectedDances={monthlyDances}
                  onChange={setMonthlyDances}
                  onAddNew={handleAddDanceToDb}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col items-end border-t pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 bg-slate-900 text-white px-8 py-3 rounded-full shadow-lg hover:bg-slate-800 transform hover:scale-105 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                <span className="font-semibold">
                  {availableDates.length === 0
                    ? 'Confirm Unavailable'
                    : 'Submit Availability & Preferences'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
