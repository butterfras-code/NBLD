# 🎯 Line Dance Scheduler - Modern React Application

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit: **http://localhost:3000**

---

## ✨ What's New?

This app has been **refactored** from a monolithic 784-line HTML file into a **modern, modular React application**. See `QUICKSTART.md` for detailed migration info.

### Two Versions Available
- **Modern** (`index-new.html`) - Modular React with Vite
- **Legacy** (`index.html`) - Full-featured monolithic version

Both share the same Firebase backend!

---

## 📁 Project Structure

```
src/
├── components/       # React UI components
├── services/         # Firebase operations
├── utils/           # Helper functions
├── config/          # Configuration
└── styles/          # CSS & Tailwind
```

See `README-REFACTOR.md` for complete architecture details.

---

## Overview
Firebase-backed line dance scheduling app with instructor portal and admin dashboard. Modular architecture with proper separation of concerns.

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

## Firebase Setup

To set up Firebase, create a `firebase-init.js` file in the `Scheduler` directory with the following structure:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

export default firebaseConfig;
```

Replace the placeholder values with your Firebase project credentials.

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
