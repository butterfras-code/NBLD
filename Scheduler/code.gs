
/* 
 * MAIN ENTRY POINT (ROUTER)
 */
function doGet(e) {
  // Route to this app if param exists or default
  if (e && e.parameter && e.parameter.app === 'scheduler') {
    return HtmlService.createHtmlOutputFromFile('index')
        .setTitle('Line Dance Scheduler')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  
  // Fallback logic for previous deployments
  try {
    if (typeof oldDoGet === 'function') return oldDoGet(e);
  } catch (error) {}

  // Default landing
  return HtmlService.createHtmlOutput(`
    <div style="font-family: system-ui, sans-serif; text-align: center; margin-top: 50px;">
      <h1>Line Dance Scheduler</h1>
      <a href="${ScriptApp.getService().getUrl()}?app=scheduler" 
         style="background-color: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;">
         Open App
      </a>
    </div>
  `);
}

/**
 * CONNECTS TO THE DATABASE SHEET
 */
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    // Make header bold
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
  return sheet;
}

/* --- HELPER FOR DATE NORMALIZATION --- */
function normalizeDateString(val) {
  return String(val).replace(/^'/, "").trim();
}

/* --- HELPER TO DETECT HEADER ROW --- */
function getStartRow(data, keywords) {
  if (!data || data.length === 0) return 0;
  const firstCell = String(data[0][0]).toLowerCase().trim();
  
  // If the first cell matches a known header keyword, skip row 0 (return 1)
  // Otherwise, treat row 0 as data (return 0)
  if (keywords.some(k => firstCell.includes(k))) {
    return 1;
  }
  return 0;
}

// --- API METHODS ---

function getInstructors() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Instructors');
  
  if (!sheet) {
    sheet = ensureSheet(ss, 'Instructors', ['id', 'name']);
    return []; 
  }
  
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  if (data.length === 0) return [];

  // Smart header detection
  const startRow = getStartRow(data, ['id', 'name', 'instructor']);

  for (let i = startRow; i < data.length; i++) {
    const colA = data[i][0]; // Column A
    const colB = data[i][1]; // Column B (Optional)
    
    if (!colA && !colB) continue;

    let id, name;

    if (colB) {
      // Format: Col A = ID, Col B = Name
      id = String(colA).trim();
      name = String(colB).trim();
    } else {
      // Format: Col A = Name (Auto-generate ID)
      name = String(colA).trim();
      id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    
    if (name) {
      result.push({ id: id, name: name });
    }
  }
  return result;
}

function getDances() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Dances');
  
  if (!sheet) {
    sheet = ensureSheet(ss, 'Dances', ['Dance Name', 'Level', 'Song', 'Artist', 'Stepsheet']);
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  // Smart header detection
  const startRow = getStartRow(data, ['name', 'dance', 'level']);
  
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    const name = String(row[0]);
    const levelRaw = String(row[1]);
    const song = row[2] ? String(row[2]) : '';
    const artist = String(row[3]);
    const stepsheet = row[4] ? String(row[4]) : '';

    const id = 'd_' + (name + artist).toLowerCase().replace(/[^a-z0-9]/g, '');

    result.push({
      id: id,
      name: name,
      artist: artist,
      song: song,
      difficulty: parseDifficulty(levelRaw),
      stepsheetUrl: stepsheet,
      style: '' 
    });
  }
  return result;
}

function addDance(dance) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Dances');
  if (!sheet) {
     sheet = ensureSheet(ss, 'Dances', ['Dance Name', 'Level', 'Song', 'Artist', 'Stepsheet']);
  }

  const data = sheet.getDataRange().getValues();
  const normalize = (s) => String(s).toLowerCase().trim();
  
  for (let i = 0; i < data.length; i++) {
    if (normalize(data[i][0]) === normalize(dance.name)) {
      if (data[i][3] && normalize(data[i][3]) === normalize(dance.artist)) {
        return; 
      }
    }
  }
  
  const levelStr = getDifficultyLabel(dance.difficulty);
  sheet.appendRow([
    dance.name,
    levelStr,
    dance.song || "", 
    dance.artist,
    dance.stepsheetUrl || ""
  ]);
}

function getAvailability(month, year) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Availability');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const result = [];
  const startRow = getStartRow(data, ['id', 'instructor', 'month']);
  
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    // Month and Year are stored as Numbers, so comparison is safe
    if (row[2] == month && row[3] == year) {
      try { result.push(JSON.parse(row[4])); } catch (e) {}
    }
  }
  return result;
}

function saveAvailability(availability) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Availability');
  if (!sheet) sheet = ensureSheet(ss, 'Availability', ['id', 'instructorId', 'month', 'year', 'data_json']);

  const id = availability.instructorId + '_' + availability.year + '_' + availability.month;
  const data = sheet.getDataRange().getValues();
  const startRow = getStartRow(data, ['id', 'instructor']);
  
  for (let i = startRow; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.getRange(i + 1, 5).setValue(JSON.stringify(availability));
      return;
    }
  }
  
  sheet.appendRow([id, availability.instructorId, availability.month, availability.year, JSON.stringify(availability)]);
}

function getMonthSchedule(month, year) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Schedules');
  if (!sheet) return [];
  
  // Use getDisplayValues to get strict string representations of dates
  const data = sheet.getDataRange().getDisplayValues();
  const result = [];
  const startRow = getStartRow(data, ['date']);
  
  const monthStr = (month + 1).toString().padStart(2, '0');
  const prefix = `${year}-${monthStr}`;
  
  for (let i = startRow; i < data.length; i++) {
    // Plain string comparison on what is visually in the cell
    const rowDate = normalizeDateString(data[i][0]);
    
    if (rowDate && rowDate.startsWith(prefix)) {
      try { result.push(JSON.parse(data[i][1])); } catch (e) {}
    }
  }
  return result;
}

function saveDaySchedule(payload) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Schedules');
  if (!sheet) sheet = ensureSheet(ss, 'Schedules', ['date', 'data_json']);

  let daySchedule;
  let jsonStr;
  
  if (typeof payload === 'string') {
    jsonStr = payload;
    try { daySchedule = JSON.parse(payload); } catch(e) { return; } 
  } else {
    daySchedule = payload;
    jsonStr = JSON.stringify(payload);
  }

  const id = daySchedule.date; // "YYYY-MM-DD" string
  
  // Use getDisplayValues for consistent matching
  const data = sheet.getDataRange().getDisplayValues();
  const startRow = getStartRow(data, ['date']);
  
  for (let i = startRow; i < data.length; i++) {
    const rowDate = normalizeDateString(data[i][0]);
    if (rowDate === id) {
      // Enforce string format on Column A
      sheet.getRange(i + 1, 1).setValue("'" + id);
      sheet.getRange(i + 1, 2).setValue(jsonStr);
      return;
    }
  }
  
  // Force string format with apostrophe to prevent Date object conversion
  sheet.appendRow(["'" + id, jsonStr]);
}

function deleteDaySchedule(dateStr) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Schedules');
  if (!sheet) return;

  const data = sheet.getDataRange().getDisplayValues();
  const startRow = getStartRow(data, ['date']);

  // Loop to find the date row
  for (let i = startRow; i < data.length; i++) {
    const rowDate = normalizeDateString(data[i][0]);
    if (rowDate === dateStr) {
      sheet.deleteRow(i + 1); // deleteRow is 1-based
      return;
    }
  }
}

function clearScheduleForMonth(month, year) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Schedules');
  if (!sheet) return;

  const monthStr = (month + 1).toString().padStart(2, '0');
  const prefix = `${year}-${monthStr}`;

  const data = sheet.getDataRange().getDisplayValues();
  const startRow = getStartRow(data, ['date']);

  // Iterate backwards to delete rows safely, including row 0 if it matches
  for (let i = data.length - 1; i >= startRow; i--) { 
    const rowDate = normalizeDateString(data[i][0]);
    if (rowDate.startsWith(prefix)) {
      sheet.deleteRow(i + 1); 
    }
  }
}

/* --- HELPERS --- */

function parseDifficulty(str) {
  const s = String(str).toLowerCase().trim();
  if (s.includes('high intermediate') || s.includes('high int')) return 7;
  if (s.includes('low intermediate') || s.includes('low int')) return 5;
  if (s.includes('intermediate')) return 6;
  if (s.includes('high improver') || s.includes('high imp')) return 4;
  if (s.includes('improver')) return 3;
  if (s.includes('high beginner') || s.includes('high beg')) return 2;
  if (s.includes('beginner')) return 1;
  if (s.includes('advanced')) return 8;
  
  if (s.includes('1')) return 1;
  if (s.includes('2')) return 2;
  if (s.includes('3')) return 3;
  if (s.includes('4')) return 4;
  
  return 1; // Default to Beginner
}

function getDifficultyLabel(num) {
  switch(num) {
    case 1: return 'Beginner';
    case 2: return 'High Beginner';
    case 3: return 'Improver';
    case 4: return 'High Improver';
    case 5: return 'Low Intermediate';
    case 6: return 'Intermediate';
    case 7: return 'High Intermediate';
    case 8: return 'Advanced';
    default: return 'Beginner';
  }
}
