import { db } from '../config/firebase.js';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import { COLLECTIONS } from '../constants.js';

// Utility to sanitize IDs
const sanitizeId = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Storage Service - Data Access Layer for Firebase Firestore
 * Provides all CRUD operations for instructors, dances, availability, and schedules
 */
export const StorageService = {
  // ==================== INSTRUCTORS ====================
  
  async getInstructors() {
    const snap = await getDocs(collection(db, COLLECTIONS.INSTRUCTORS));
    return snap.docs.map(d => ({ id: d.id, ...(d.data()) }));
  },

  async addInstructor(name) {
    name = String(name || '').trim();
    if (!name) return null;
    const id = sanitizeId(name);
    const ref = doc(db, COLLECTIONS.INSTRUCTORS, id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      return { id, ...(existing.data()) };
    }
    await setDoc(ref, { id, name });
    return { id, name };
  },

  async renameInstructor(id, newName) {
    id = String(id || '').trim();
    newName = String(newName || '').trim();
    if (!id || !newName) return false;
    const ref = doc(db, COLLECTIONS.INSTRUCTORS, id);
    await setDoc(ref, { id, name: newName }, { merge: true });
    return true;
  },

  async deleteInstructor(id) {
    id = String(id || '').trim();
    if (!id) return false;
    // Also remove availability records for this instructor
    const availQ = query(collection(db, COLLECTIONS.AVAILABILITY), where('instructorId', '==', id));
    const availSnap = await getDocs(availQ);
    const batch = writeBatch(db);
    availSnap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, COLLECTIONS.INSTRUCTORS, id));
    await batch.commit();
    return true;
  },

  // ==================== DANCES ====================

  async getDances() {
    const snap = await getDocs(collection(db, COLLECTIONS.DANCES));
    return snap.docs.map(d => ({ id: d.id, ...(d.data()) }));
  },

  async addDance(dance) {
    const name = dance.name?.trim();
    const artist = (dance.artist || '').trim();
    if (!name || !artist) return;
    const id = dance.id || ('d_' + sanitizeId(name + artist));
    const ref = doc(db, COLLECTIONS.DANCES, id);
    const existing = await getDoc(ref);
    if (existing.exists()) return;
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
    const snap = await getDocs(collection(db, COLLECTIONS.DANCES));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  },

  // ==================== AVAILABILITY ====================

  async getAvailability(month, year) {
    const q = query(
      collection(db, COLLECTIONS.AVAILABILITY),
      where('month', '==', month),
      where('year', '==', year)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  },

  async saveAvailability(avail) {
    const id = `${avail.instructorId}_${avail.year}_${avail.month}`;
    await setDoc(doc(db, COLLECTIONS.AVAILABILITY, id), {
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

  // ==================== SCHEDULES ====================

  async getMonthSchedule(month, year) {
    const q = query(
      collection(db, COLLECTIONS.SCHEDULES),
      where('month', '==', month),
      where('year', '==', year)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  },

  async saveDaySchedule(daySchedule) {
    const dateStr = daySchedule.date;
    if (!dateStr) return;
    const [y, m] = dateStr.split('-');
    const month = parseInt(m, 10) - 1;
    const year = parseInt(y, 10);
    await setDoc(doc(db, COLLECTIONS.SCHEDULES, dateStr), {
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
    await deleteDoc(doc(db, COLLECTIONS.SCHEDULES, dateStr));
  },

  async clearScheduleForMonth(month, year) {
    const q = query(
      collection(db, COLLECTIONS.SCHEDULES),
      where('month', '==', month),
      where('year', '==', year)
    );
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
      const ref = doc(db, COLLECTIONS.SCHEDULES, dateStr);
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
    arr.forEach(dateStr => {
      if (typeof dateStr === 'string' && dateStr) {
        batch.delete(doc(db, COLLECTIONS.SCHEDULES, dateStr));
      }
    });
    await batch.commit();
  },

  // ==================== COMPOSITE DATA ====================

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
