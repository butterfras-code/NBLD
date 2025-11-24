# Apps Script Integration Guide

This guide explains how to integrate the Google Apps Script backend (`code.gs`) with your Line Dance Scheduler web application.

## Setup Steps

### 1. Prepare Your Google Sheet

1. Open your Google Sheet (or create a new one)
2. Create two tabs (sheets):
   - **dances** - Contains your dance library
   - **schedule** - Will store exported schedules

#### Dances Tab Structure
The "dances" tab should have the following columns (with or without headers):
| Column | Description | Example |
|--------|-------------|---------|
| A | Dance Name | "Copperhead Road" |
| B | Artist | "Steve Earle" |
| C | Song | "Copperhead Road" |
| D | Difficulty Level | "Beginner" or "1" |
| E | Stepsheet URL | "https://..." |
| F | Style | "Country" |

#### Schedule Tab Structure
The script will automatically create this tab with headers when you first export a schedule. It will contain:
| Column | Description |
|--------|-------------|
| A | Date |
| B | Time Slot |
| C | Dance Name |
| D | Instructor |
| E | Difficulty |
| F | Artist |
| G | Song |
| H | Stepsheet URL |

### 2. Deploy the Apps Script

1. Open your Google Sheet
2. Go to **Extensions > Apps Script**
3. Delete any existing code in the editor
4. Copy the entire contents of `code.gs` and paste it into the script editor
5. In the script, replace `YOUR_SHEET_ID_HERE` with your actual Sheet ID
   - Find the Sheet ID in your URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`
6. Click the **Save** icon (💾)
7. Click **Deploy > New deployment**
8. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
9. Configure the deployment:
   - **Description**: "Line Dance Scheduler API"
   - **Execute as**: Me (your email)
   - **Who has access**: Choose based on your needs:
     - "Anyone" - No login required (less secure but easier)
     - "Anyone with Google Account" - Requires Google sign-in
10. Click **Deploy**
11. Copy the **Web app URL** that appears

### 3. Update Your Web Application

#### Option A: Using the Apps Script Backend (instead of Firebase)

If you want to use Google Sheets as your database instead of Firebase:

1. Open `index.html` in your Scheduler folder
2. Create a new file `google-sheets-init.js` with the following:

```javascript
// Replace with your deployed web app URL from Apps Script
const APPS_SCRIPT_URL = 'YOUR_DEPLOYED_WEBAPP_URL_HERE';

// Simple API wrapper for Google Apps Script backend
export const StorageService = {
  async getDances() {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getDances`);
    if (!response.ok) throw new Error('Failed to fetch dances');
    return await response.json();
  },

  async getSchedule() {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getSchedule`);
    if (!response.ok) throw new Error('Failed to fetch schedule');
    return await response.json();
  },

  async saveSchedule(scheduleData) {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=saveSchedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData)
    });
    if (!response.ok) throw new Error('Failed to save schedule');
    return await response.json();
  }
};
```

3. Update the imports in `index.html` to use `google-sheets-init.js` instead of `data.js` and `firebase-init.js`

#### Option B: Export to Sheets from Firebase App

If you want to keep using Firebase but add an export feature:

1. Add this function to your `index.html` file (in the React components section):

```javascript
const ExportToSheetsButton = ({ scheduleData }) => {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  
  const APPS_SCRIPT_URL = 'YOUR_DEPLOYED_WEBAPP_URL_HERE'; // Replace with actual URL
  
  const handleExport = async () => {
    setExporting(true);
    setMessage('');
    
    try {
      // Format schedule data for Google Sheets
      const formattedData = scheduleData.map(day => ({
        date: day.date,
        lessons: day.lessons.map(lesson => ({
          timeSlot: lesson.timeSlot,
          danceName: lesson.danceName,
          instructor: lesson.instructorName || lesson.instructor,
          difficulty: getDifficultyLabel(lesson.difficulty),
          artist: lesson.artist || '',
          song: lesson.song || '',
          stepsheetUrl: lesson.stepsheetUrl || ''
        }))
      }));
      
      const response = await fetch(`${APPS_SCRIPT_URL}?action=saveSchedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData)
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const result = await response.json();
      setMessage('✓ Exported to Google Sheets successfully!');
    } catch (error) {
      console.error('Export error:', error);
      setMessage('✗ Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <div>
      <button 
        onClick={handleExport} 
        disabled={exporting}
        className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
      >
        {exporting ? (
          <>
            <Loader2 className="animate-spin mr-2" size={16} />
            Exporting...
          </>
        ) : (
          <>
            <Download size={16} className="mr-2" />
            Export to Sheets
          </>
        )}
      </button>
      {message && (
        <p className={`text-sm mt-2 ${message.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
};
```

2. Add the button to your Admin Dashboard where appropriate

### 4. Test the Integration

1. **Test reading dances**: 
   - Visit `YOUR_DEPLOYED_WEBAPP_URL?action=getDances` in your browser
   - You should see JSON data with your dances

2. **Test in Apps Script editor**:
   - In the Apps Script editor, select `testGetDances` from the function dropdown
   - Click the Run button (▶️)
   - Check the Execution log for results

3. **Test saving schedule**:
   - Use the export button in your web app
   - Check the "schedule" tab in your Google Sheet for the exported data

## API Reference

### GET Requests

- `?action=getDances` - Retrieves all dances from the "dances" tab
- `?action=getSchedule` - Retrieves the current schedule from the "schedule" tab

### POST Requests

- `?action=saveSchedule` - Saves schedule data to the "schedule" tab
  - POST body should be JSON array of schedule objects

## Expected Data Formats

### Schedule Data Format (for POST)

```json
[
  {
    "date": "2025-12-01",
    "lessons": [
      {
        "timeSlot": "7:00 PM",
        "danceName": "Copperhead Road",
        "instructor": "John Doe",
        "difficulty": "Beginner",
        "artist": "Steve Earle",
        "song": "Copperhead Road",
        "stepsheetUrl": "https://..."
      }
    ]
  }
]
```

## Troubleshooting

### Common Issues

1. **"Sheet not found" error**
   - Make sure you have tabs named exactly "dances" and "schedule" (lowercase)
   - Check the SHEET_ID is correct in code.gs

2. **Authorization Required**
   - When first running, click "Review Permissions"
   - Sign in with your Google account
   - Click "Advanced" and "Go to [Project Name] (unsafe)" if needed
   - Click "Allow"

3. **CORS Errors**
   - Apps Script web apps should handle CORS automatically
   - Make sure you deployed as a web app, not just saved the script
   - Try redeploying with updated permissions

4. **Empty Response**
   - Check that your "dances" tab has data
   - Verify column order matches expected format
   - Check Apps Script execution logs (View > Logs)

## Security Considerations

- The deployed URL is public if you set "Who has access" to "Anyone"
- Consider using "Anyone with Google Account" for better security
- The SHEET_ID is not secret - anyone with the deployed URL can access the data
- For production use, consider implementing authentication in the script

## Updating the Script

To update the script after making changes:

1. Edit the code in Apps Script editor
2. Save the changes
3. Go to **Deploy > Manage deployments**
4. Click the edit icon (✏️) next to your deployment
5. Click **Version > New version**
6. Add description of changes
7. Click **Deploy**

The URL remains the same, but now serves the updated code.
