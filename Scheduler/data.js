import { db } from './firebase-init.js';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';

// Utility to sanitize IDs similar to legacy implementation
const sanitizeId = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

// Collections names
const COL_INSTRUCTORS = 'instructors';
const COL_DANCES = 'dances';
const COL_AVAIL = 'availability';
const COL_SCHEDULES = 'schedules';

// Difficulty label mapping (kept here for dance creation consistency)
const getDifficultyLabel = (diff) => {
  switch (diff) {
    case 1: return 'Beginner';
    case 2: return 'High Beginner';
    case 3: return 'Improver';
    case 4: return 'High Improver';
    case 5: return 'Low Intermediate';
    case 6: return 'Intermediate';
    case 7: return 'High Intermediate';
    case 8: return 'Advanced';
    default: return 'Unknown';
  }
};

// --- Data Access Layer mirroring legacy GAS API ---
export const StorageService = {
  // Instructors
  async getInstructors() {
    const snap = await getDocs(collection(db, COL_INSTRUCTORS));
    return snap.docs.map(d => ({ id: d.id, ...(d.data()) }));
  },

  async addInstructor(name) {
    name = String(name || '').trim();
    if (!name) return null;
    const id = sanitizeId(name);
    const ref = doc(db, COL_INSTRUCTORS, id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      // If same (case-insensitive) name already exists, return existing
      return { id, ...(existing.data()) };
    }
    await setDoc(ref, { id, name });
    return { id, name };
  },

  async renameInstructor(id, newName) {
    id = String(id || '').trim();
    newName = String(newName || '').trim();
    if (!id || !newName) return false;
    const ref = doc(db, COL_INSTRUCTORS, id);
    await setDoc(ref, { id, name: newName }, { merge: true });
    return true;
  },

  async deleteInstructor(id) {
    id = String(id || '').trim();
    if (!id) return false;
    // Also remove availability records for this instructor to avoid orphans
    const availQ = query(collection(db, COL_AVAIL), where('instructorId', '==', id));
    const availSnap = await getDocs(availQ);
    const batch = writeBatch(db);
    availSnap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, COL_INSTRUCTORS, id));
    await batch.commit();
    return true;
  },

  // Dances
  async getDances() {
    const snap = await getDocs(collection(db, COL_DANCES));
    return snap.docs.map(d => ({ id: d.id, ...(d.data()) }));
  },

  async addDance(dance) {
    const name = dance.name?.trim();
    const artist = (dance.artist || '').trim();
    if (!name || !artist) return;
    const id = dance.id || ('d_' + sanitizeId(name + artist));
    const ref = doc(db, COL_DANCES, id);
    const existing = await getDoc(ref);
    if (existing.exists()) return; // Skip duplicate
    await setDoc(ref, {
      id,
      name,
      artist,
      song: dance.song || '',
      difficulty: dance.difficulty || 1,
      stepsheetUrl: dance.stepsheetUrl || '',
      style: dance.style || ''
    });
  },

  async clearAllDances() {
    const snap = await getDocs(collection(db, COL_DANCES));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  },

  // Availability
  async getAvailability(month, year) {
    const q = query(collection(db, COL_AVAIL), where('month', '==', month), where('year', '==', year));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  },

  async saveAvailability(avail) {
    const id = `${avail.instructorId}_${avail.year}_${avail.month}`;
    await setDoc(doc(db, COL_AVAIL, id), {
      id,
      instructorId: avail.instructorId,
      month: avail.month,
      year: avail.year,
      availableDates: avail.availableDates || [],
      selectedDances: (avail.selectedDances || []).map(d => ({
        id: d.id,
        name: d.name,
        artist: d.artist || '',
        song: d.song || '',
        difficulty: d.difficulty || 1,
        stepsheetUrl: d.stepsheetUrl || ''
      }))
    });
  },

  // Schedules
  async getMonthSchedule(month, year) {
    const q = query(collection(db, COL_SCHEDULES), where('month', '==', month), where('year', '==', year));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  },

  async saveDaySchedule(daySchedule) {
    const dateStr = daySchedule.date; // YYYY-MM-DD
    if (!dateStr) return;
    const [y, m] = dateStr.split('-');
    const month = parseInt(m, 10) - 1;
    const year = parseInt(y, 10);
    await setDoc(doc(db, COL_SCHEDULES, dateStr), {
      date: dateStr,
      month,
      year,
      lessons: (daySchedule.lessons || []).map(l => ({
        id: l.id,
        danceId: l.danceId,
        danceName: l.danceName,
        instructorId: l.instructorId,
        difficulty: l.difficulty,
        timeSlot: l.timeSlot || ''
      })),
      isHoliday: !!daySchedule.isHoliday,
      note: daySchedule.note || ''
    });
  },

  async deleteDaySchedule(dateStr) {
    await deleteDoc(doc(db, COL_SCHEDULES, dateStr));
  },

  async clearScheduleForMonth(month, year) {
    const q = query(collection(db, COL_SCHEDULES), where('month', '==', month), where('year', '==', year));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  },

  async batchSaveDaySchedules(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return;
    const batch = writeBatch(db);
    arr.forEach(s => {
      const dateStr = s.date;
      if (!dateStr) return;
      const [y, m] = dateStr.split('-');
      const month = parseInt(m, 10) - 1;
      const year = parseInt(y, 10);
      const ref = doc(db, COL_SCHEDULES, dateStr);
      batch.set(ref, {
        date: dateStr,
        month,
        year,
        lessons: (s.lessons || []).map(l => ({
          id: l.id,
          danceId: l.danceId,
          danceName: l.danceName,
          instructorId: l.instructorId,
          difficulty: l.difficulty,
          timeSlot: l.timeSlot || ''
        })),
        isHoliday: !!s.isHoliday,
        note: s.note || ''
      });
    });
    await batch.commit();
  },

  async batchDeleteDaySchedules(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return;
    const batch = writeBatch(db);
    arr.forEach(dateStr => { if (typeof dateStr === 'string' && dateStr) batch.delete(doc(db, COL_SCHEDULES, dateStr)); });
    await batch.commit();
  },

  async getMonthData(month, year) {
    const [schedules, availability, dances, instructors] = await Promise.all([
      this.getMonthSchedule(month, year),
      this.getAvailability(month, year),
      this.getDances(),
      this.getInstructors()
    ]);
    return { schedules, availability, dances, instructors };
  }
};

// Optional: seed helpers (manually invoke in console if needed)
export async function seedInstructor(id, name) {
  await setDoc(doc(db, COL_INSTRUCTORS, id), { id, name });
}

export async function seedDance(d) {
  const id = d.id || ('d_' + sanitizeId((d.name || '') + (d.artist || '')));
  await setDoc(doc(db, COL_DANCES, id), {
    id,
    name: d.name,
    artist: d.artist || '',
    song: d.song || '',
    difficulty: d.difficulty || 1,
    stepsheetUrl: d.stepsheetUrl || ''
  });
}
