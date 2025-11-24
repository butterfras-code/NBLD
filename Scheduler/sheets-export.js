/**
 * GOOGLE SHEETS EXPORT MODULE
 * 
 * This module provides functions to export schedule data from the Line Dance Scheduler
 * to Google Sheets via the deployed Apps Script web app.
 * 
 * Usage:
 * 1. Update APPS_SCRIPT_URL with your deployed web app URL
 * 2. Import this module in your index.html
 * 3. Call exportScheduleToSheets(scheduleData) when user clicks export button
 */

// TODO: Replace with your deployed Apps Script web app URL
const APPS_SCRIPT_URL = 'YOUR_DEPLOYED_WEBAPP_URL_HERE';

/**
 * Exports schedule data to Google Sheets
 * @param {Array} scheduleData - Array of schedule objects with date and lessons
 * @returns {Promise<Object>} Response from the API
 * 
 * Expected scheduleData format:
 * [
 *   {
 *     date: "2025-12-01",
 *     lessons: [
 *       {
 *         timeSlot: "7:00 PM",
 *         danceName: "Dance Name",
 *         instructorId: "instructor-id",
 *         instructorName: "John Doe",
 *         difficulty: 3,
 *         artist: "Artist Name",
 *         song: "Song Name",
 *         stepsheetUrl: "https://..."
 *       }
 *     ]
 *   }
 * ]
 */
export async function exportScheduleToSheets(scheduleData, instructors = [], dances = []) {
  if (!scheduleData || !Array.isArray(scheduleData)) {
    throw new Error('Invalid schedule data format');
  }

  // Helper function to get difficulty label
  const getDifficultyLabel = (num) => {
    const labels = {
      1: 'Beginner',
      2: 'High Beginner',
      3: 'Improver',
      4: 'High Improver',
      5: 'Low Intermediate',
      6: 'Intermediate',
      7: 'High Intermediate',
      8: 'Advanced'
    };
    return labels[num] || 'Beginner';
  };

  // Transform schedule data to match Google Sheets format
  const formattedData = scheduleData
    .filter(day => day.lessons && day.lessons.length > 0) // Only include days with lessons
    .map(day => {
      return {
        date: day.date,
        lessons: day.lessons.map(lesson => {
          // Find instructor name if we have the list
          let instructorName = lesson.instructorName || lesson.instructor || '';
          if (!instructorName && lesson.instructorId && instructors) {
            const instructor = instructors.find(i => i.id === lesson.instructorId);
            instructorName = instructor ? instructor.name : '';
          }

          // Find dance details if we have the list
          let danceDetails = {};
          if (lesson.danceId && dances) {
            const dance = dances.find(d => d.id === lesson.danceId);
            if (dance) {
              danceDetails = {
                artist: dance.artist,
                song: dance.song,
                stepsheetUrl: dance.stepsheetUrl
              };
            }
          }

          return {
            timeSlot: lesson.timeSlot || '',
            danceName: lesson.danceName || lesson.name || '',
            instructor: instructorName,
            difficulty: getDifficultyLabel(lesson.difficulty),
            artist: lesson.artist || danceDetails.artist || '',
            song: lesson.song || danceDetails.song || '',
            stepsheetUrl: lesson.stepsheetUrl || danceDetails.stepsheetUrl || ''
          };
        })
      };
    });

  // Send POST request to Apps Script
  const response = await fetch(`${APPS_SCRIPT_URL}?action=saveSchedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formattedData),
    // Apps Script may require this for CORS
    mode: 'no-cors'
  });

  // Note: With mode: 'no-cors', we won't be able to read the response
  // The request will still succeed, but response will be opaque
  if (response.type === 'opaque') {
    // Request was sent, assume success
    return { success: true, message: 'Schedule export initiated' };
  }

  if (!response.ok) {
    throw new Error(`Export failed with status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetches dance data from Google Sheets
 * @returns {Promise<Array>} Array of dance objects
 */
export async function getDancesFromSheets() {
  const response = await fetch(`${APPS_SCRIPT_URL}?action=getDances`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch dances: ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetches current schedule from Google Sheets
 * @returns {Promise<Array>} Array of schedule entries
 */
export async function getScheduleFromSheets() {
  const response = await fetch(`${APPS_SCRIPT_URL}?action=getSchedule`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch schedule: ${response.status}`);
  }

  return await response.json();
}

/**
 * Test connection to Google Sheets
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection() {
  try {
    const dances = await getDancesFromSheets();
    console.log('✓ Connection successful! Found', dances.length, 'dances');
    return true;
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    return false;
  }
}

// Example usage in React component:
/*
import { exportScheduleToSheets } from './sheets-export.js';

const ExportButton = ({ schedules, instructors, dances }) => {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');

  const handleExport = async () => {
    setExporting(true);
    setMessage('');
    
    try {
      const result = await exportScheduleToSheets(schedules, instructors, dances);
      setMessage('✓ Successfully exported to Google Sheets!');
    } catch (error) {
      setMessage('✗ Export failed: ' + error.message);
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <button onClick={handleExport} disabled={exporting}>
        {exporting ? 'Exporting...' : 'Export to Sheets'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};
*/
