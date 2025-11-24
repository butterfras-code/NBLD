/**
 * LINE DANCE SCHEDULER - Google Apps Script Backend
 * 
 * This script provides the backend functionality for the Line Dance Scheduler app.
 * It reads dance data from the "dances" tab and exports generated schedules to the "schedule" tab.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Replace SHEET_ID with your Google Sheet ID
 * 2. Deploy as a web app (Deploy > New deployment > Web app)
 * 3. Set "Execute as" to your account
 * 4. Set "Who has access" as needed (Anyone or specific users)
 * 5. Copy the deployed web app URL and paste it in the index.html file
 */

// ====================
// CONFIGURATION
// ====================

// TODO: Replace with your actual Google Sheet ID
// Find this in your sheet URL: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
const SHEET_ID = '1ZYFLKFCwY9ou5Yzx0xXz53YDjAJ-NFDbhQVL1BcIN1I';

// Sheet (tab) names
const DANCES_TAB = 'dances';
const SCHEDULE_TAB = 'schedule';

// ====================
// MAIN ENTRY POINT
// ====================

/**
 * Handles HTTP GET requests to the deployed web app
 * Routes different actions based on query parameters
 */
function doGet(e) {
  const action = e?.parameter?.action || 'getDances';
  const callback = e?.parameter?.callback; // For JSONP support
  
  try {
    let response;
    switch (action) {
      case 'getDances':
        response = getDancesResponse(callback);
        break;
      case 'getSchedule':
        response = getScheduleResponse(callback);
        break;
      case 'saveSchedule':
        // Allow GET for saving via JSONP (data passed as URL parameter)
        const dataParam = e?.parameter?.data;
        if (dataParam) {
          const scheduleData = JSON.parse(dataParam);
          saveSchedule(scheduleData);
          response = createJsonResponse({ success: true, message: 'Schedule saved successfully' }, 200, callback);
        } else {
          response = createJsonResponse({ error: 'Missing data parameter' }, 400, callback);
        }
        break;
      case 'clearDances':
        // This just acknowledges - actual clearing happens in Firebase on client side
        response = createJsonResponse({ success: true, message: 'Clear dances acknowledged' }, 200, callback);
        break;
      default:
        response = createJsonResponse({ error: 'Invalid action parameter' }, 400, callback);
    }
    return response;
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return createJsonResponse({ error: error.toString() }, 500, callback);
  }
}

/**
 * Legacy function for backward compatibility
 * Returns all data from the "schedule" tab
 */
function oldDoGet(e) {
  try {
    const spreadSheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadSheet.getSheetByName(SCHEDULE_TAB);
    
    if (!sheet) {
      throw new Error('Sheet not found with name: ' + SCHEDULE_TAB);
    }

    // Get all data from the sheet.
    const data = sheet.getDataRange().getDisplayValues();

    // Prepare the data to be sent as JSON.
    const jsonData = JSON.stringify(data);
    
    // Return the JSON data.
    return ContentService.createTextOutput(jsonData)
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Log the error for debugging
    Logger.log(error.toString());
    
    // Return an error message as JSON
    const errorJson = JSON.stringify({ error: error.toString() });
    return ContentService.createTextOutput(errorJson)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles HTTP POST requests to the deployed web app
 * Used for saving schedule data
 */
function doPost(e) {
  try {
    const action = e?.parameter?.action || 'saveSchedule';
    
    if (action === 'saveSchedule') {
      const postData = JSON.parse(e.postData.contents);
      saveSchedule(postData);
      return createJsonResponse({ success: true, message: 'Schedule saved successfully' });
    } else {
      return createJsonResponse({ error: 'Invalid action parameter' }, 400);
    }
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

// ====================
// DANCE DATA FUNCTIONS
// ====================

/**
 * Reads all dances from the "dances" tab
 * Returns an array of dance objects
 */
function getDances() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(DANCES_TAB);
  
  if (!sheet) {
    throw new Error(`Sheet "${DANCES_TAB}" not found. Please create a tab named "${DANCES_TAB}" in your spreadsheet.`);
  }

  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    // Only header row or empty sheet
    return [];
  }

  const dances = [];
  
  // Detect header row (skip it if present)
  const startRow = isHeaderRow(data[0]) ? 1 : 0;
  
  // Expected columns: Dance Name, Level, Song, Artist, Stepsheet URL
  // Based on the actual sheet structure shown in the spreadsheet
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    
    // Skip empty rows
    if (!row[0] && !row[1]) continue;
    
    const danceName = String(row[0] || '').trim();
    const difficultyRaw = String(row[1] || '').trim();
    const song = String(row[2] || '').trim();
    const artist = String(row[3] || '').trim();
    const stepsheetUrl = String(row[4] || '').trim();
    
    if (!danceName) continue; // Must have at least name
    
    // Generate unique ID based on name and difficulty
    const id = 'd_' + sanitizeForId(danceName + difficultyRaw);
    
    dances.push({
      id: id,
      name: danceName,
      artist: artist,
      song: song,
      difficulty: parseDifficulty(difficultyRaw),
      stepsheetUrl: stepsheetUrl,
      style: ''
    });
  }
  
  return dances;
}

/**
 * Returns dance data as JSON response
 */
function getDancesResponse(callback) {
  const dances = getDances();
  return createJsonResponse(dances, 200, callback);
}

// ====================
// SCHEDULE FUNCTIONS
// ====================

/**
 * Reads the current schedule from the "schedule" tab
 * Returns an array of schedule entries
 */
function getSchedule() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SCHEDULE_TAB);
  
  if (!sheet) {
    // Create the schedule tab if it doesn't exist
    sheet = spreadsheet.insertSheet(SCHEDULE_TAB);
    sheet.appendRow(['Date', 'Time Slot', 'Dance Name', 'Instructor', 'Difficulty', 'Artist', 'Song', 'Stepsheet URL']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
    return [];
  }

  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return [];
  }

  const schedule = [];
  const startRow = isHeaderRow(data[0]) ? 1 : 0;
  
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    
    if (!row[0]) continue; // Skip rows without a date
    
    schedule.push({
      date: formatDateString(row[0]),
      timeSlot: String(row[1] || '').trim(),
      danceName: String(row[2] || '').trim(),
      instructor: String(row[3] || '').trim(),
      difficulty: String(row[4] || '').trim(),
      artist: String(row[5] || '').trim(),
      song: String(row[6] || '').trim(),
      stepsheetUrl: String(row[7] || '').trim()
    });
  }
  
  return schedule;
}

/**
 * Returns schedule data as JSON response
 */
function getScheduleResponse(callback) {
  const schedule = getSchedule();
  return createJsonResponse(schedule, 200, callback);
}

/**
 * Saves schedule data to the "schedule" tab
 * Expects an array of schedule objects with the following structure:
 * [
 *   {
 *     date: "2025-12-01",
 *     lessons: [
 *       {
 *         timeSlot: "7:00 PM",
 *         danceName: "Dance Name",
 *         instructor: "Instructor Name",
 *         difficulty: "Beginner",
 *         artist: "Artist Name",
 *         song: "Song Name",
 *         stepsheetUrl: "https://..."
 *       }
 *     ]
 *   }
 * ]
 */
function saveSchedule(scheduleData) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SCHEDULE_TAB);
  
  if (!sheet) {
    // Create the schedule tab with headers
    sheet = spreadsheet.insertSheet(SCHEDULE_TAB);
    sheet.appendRow(['Date', 'Time Slot', 'Dance Name', 'Instructor', 'Difficulty', 'Artist', 'Song', 'Stepsheet URL']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
  } else {
    // Clear existing data (keep headers)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
  }
  
  // Flatten the schedule data into rows
  const rows = [];
  
  if (Array.isArray(scheduleData)) {
    for (const daySchedule of scheduleData) {
      const date = daySchedule.date;
      const lessons = daySchedule.lessons || [];
      
      for (const lesson of lessons) {
        rows.push([
          date,
          lesson.timeSlot || '',
          lesson.danceName || '',
          lesson.instructor || '',
          lesson.difficulty || '',
          lesson.artist || '',
          lesson.song || '',
          lesson.stepsheetUrl || ''
        ]);
      }
    }
  }
  
  // Write all rows at once if we have data
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }
  
  return true;
}

// ====================
// HELPER FUNCTIONS
// ====================

/**
 * Creates a JSON or JSONP response for the web app
 */
function createJsonResponse(data, statusCode = 200, callback = null) {
  const jsonString = JSON.stringify(data);
  
  // If callback is provided, return JSONP
  if (callback) {
    const output = ContentService.createTextOutput(`${callback}(${jsonString})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
    return output;
  }
  
  // Otherwise return JSON
  const output = ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
  
  return output;
}

/**
 * Checks if a row appears to be a header row
 */
function isHeaderRow(row) {
  if (!row || row.length === 0) return false;
  
  const firstCell = String(row[0]).toLowerCase().trim();
  const headerKeywords = ['dance', 'name', 'id', 'date', 'time', 'instructor'];
  
  return headerKeywords.some(keyword => firstCell.includes(keyword));
}

/**
 * Sanitizes a string to create a valid ID
 * Removes special characters and converts to lowercase
 */
function sanitizeForId(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Formats a date value to YYYY-MM-DD string
 */
function formatDateString(dateValue) {
  if (!dateValue) return '';
  
  // If it's already a string in the right format, return it
  if (typeof dateValue === 'string') {
    const normalized = dateValue.replace(/^'/, '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized;
    }
  }
  
  // If it's a Date object, format it
  if (dateValue instanceof Date) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return String(dateValue).trim();
}

/**
 * Parses difficulty level from various text formats to a number (1-8)
 * 1 = Beginner
 * 2 = High Beginner
 * 3 = Improver
 * 4 = High Improver
 * 5 = Low Intermediate
 * 6 = Intermediate
 * 7 = High Intermediate
 * 8 = Advanced
 */
function parseDifficulty(difficultyStr) {
  const str = String(difficultyStr).toLowerCase().trim();
  
  // Check for specific levels
  if (str.includes('high intermediate') || str.includes('high int')) return 7;
  if (str.includes('low intermediate') || str.includes('low int')) return 5;
  if (str.includes('intermediate') || str.includes('int')) return 6;
  if (str.includes('high improver') || str.includes('high imp')) return 4;
  if (str.includes('improver') || str.includes('imp')) return 3;
  if (str.includes('high beginner') || str.includes('high beg')) return 2;
  if (str.includes('beginner') || str.includes('beg')) return 1;
  if (str.includes('advanced') || str.includes('adv')) return 8;
  
  // Check for numeric values
  const num = parseInt(str);
  if (num >= 1 && num <= 8) return num;
  
  // Default to Beginner
  return 1;
}

/**
 * Gets the difficulty label for a numeric difficulty level
 */
function getDifficultyLabel(difficultyNum) {
  switch (difficultyNum) {
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

// ====================
// EXPORT FUNCTION FOR MANUAL TRIGGER
// ====================

/**
 * Manual function to export current Firebase data to the schedule tab
 * This can be called from the Apps Script editor or triggered by a button
 * 
 * Note: This function expects you to manually provide the schedule data
 * since it can't directly access Firebase from Apps Script.
 * 
 * You would typically call this from your web app after generating a schedule.
 */
function manualExportSchedule() {
  // Example schedule data structure - replace with actual data
  const exampleScheduleData = [
    {
      date: "2025-12-01",
      lessons: [
        {
          timeSlot: "7:00 PM",
          danceName: "Example Dance",
          instructor: "John Doe",
          difficulty: "Beginner",
          artist: "Artist Name",
          song: "Song Name",
          stepsheetUrl: "https://example.com"
        }
      ]
    }
  ];
  
  Logger.log('This is a template function. Replace exampleScheduleData with actual schedule data.');
  Logger.log('To export from your web app, use the doPost endpoint with action=saveSchedule');
  
  // Uncomment the line below and provide real data to test:
  // saveSchedule(exampleScheduleData);
}

/**
 * Test function to verify sheet connection and read dances
 */
function testGetDances() {
  try {
    const dances = getDances();
    Logger.log('Successfully read ' + dances.length + ' dances from the "' + DANCES_TAB + '" tab');
    Logger.log('Sample: ' + JSON.stringify(dances.slice(0, 3)));
    return dances;
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    throw error;
  }
}

/**
 * Test function to verify schedule reading
 */
function testGetSchedule() {
  try {
    const schedule = getSchedule();
    Logger.log('Successfully read ' + schedule.length + ' schedule entries from the "' + SCHEDULE_TAB + '" tab');
    Logger.log('Sample: ' + JSON.stringify(schedule.slice(0, 3)));
    return schedule;
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    throw error;
  }
}
