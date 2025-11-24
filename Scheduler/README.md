# Line Dance Scheduler (Firebase Version)

This directory contains the Firebase-backed rewrite of the legacy Apps Script + Google Sheets scheduler.

## Overview
Legacy backend (Apps Script + Sheets) functions have been reproduced against Firebase Firestore via `StorageService` in `data.js`. The front-end UI should mirror the original design and interactions.

## Data Model (Firestore)
Collections:
- `instructors`: { id, name }
- `dances`: { id, name, artist, song, difficulty, stepsheetUrl, style }
- `availability`: { id: `${instructorId}_${year}_${month}`, instructorId, month (0-based), year, availableDates: [YYYY-MM-DD], selectedDances: [Dance] }
- `schedules`: { date: YYYY-MM-DD, month (0-based), year, lessons: [ { id, danceId, danceName, instructorId, difficulty, timeSlot } ], isHoliday, note }

Month queries use numeric `month` and `year` fields for efficient filtering.

## API Parity
Mapped 1:1 from legacy:
- getInstructors()
- getDances(), addDance(dance)
- getAvailability(month, year), saveAvailability(obj)
- getMonthSchedule(month, year), saveDaySchedule(schedule), deleteDaySchedule(dateStr)
- clearScheduleForMonth(month, year)
- batchSaveDaySchedules(array), batchDeleteDaySchedules(array)
- getMonthData(month, year) aggregates above

## Setup
1. Ensure Firebase project exists (already configured in `firebase-init.js`).
2. Enable Firestore in the Firebase Console.
3. Deploy static files (`index.html`, `firebase-init.js`, `data.js`) using Firebase Hosting or other static server.

### Optional Seeding
Use browser devtools console:
```js
import('./data.js').then(m => {
  m.seedInstructor('alice','Alice');
  m.seedInstructor('bob','Bob');
  m.seedDance({ name:'Electric Slide', artist:'Marcia Griffiths', difficulty:1 });
});
```

## Security Rules (Baseline)
Restrict writes to authenticated admins; instructors can only modify their own availability.
Example Firestore rules sketch:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function isAdmin() { return request.auth != null && 'admin' in request.auth.token && request.auth.token.admin == true; }
    function uid() { return request.auth != null ? request.auth.uid : null; }

    match /instructors/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /dances/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /availability/{docId} {
      allow read: if true;
      allow write: if request.auth != null && docId.startsWith(uid() + '_');
    }
    match /schedules/{date} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```
Adjust for actual auth strategy (custom claims, etc.).

## Next Steps
- Complete UI migration by copying legacy React components into the new `index.html` (replace GAS bridges with Firebase `StorageService`).
- Add authentication (email/password or provider) to enforce rules.
- Add optimistic UI + error toasts.

## Notes
`firebase.config` was left untouched; actual runtime uses `firebase-init.js` for modular initialization.
