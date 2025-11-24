# Line Dance Scheduler - Apps Script Integration

## Summary

I've created a complete Google Apps Script backend that reads dance data from the "dances" tab and exports generated schedules to the "schedule" tab in your Google Sheet. This provides an integration layer between your web application and Google Sheets.

## Files Created

### 1. `code.gs` - Google Apps Script Backend
**Location**: `d:\NBLD\Scheduler\code.gs`

This is the main Apps Script file that you'll deploy as a web app. It provides:

#### Key Functions:
- **`doGet(e)`** - Handles GET requests with actions:
  - `getDances` - Reads all dances from the "dances" tab
  - `getSchedule` - Reads current schedule from "schedule" tab
  
- **`doPost(e)`** - Handles POST requests:
  - `saveSchedule` - Exports schedule data to "schedule" tab

- **Helper Functions**:
  - `getDances()` - Reads and parses dance data
  - `getSchedule()` - Reads and parses schedule data
  - `saveSchedule(data)` - Writes schedule to sheet
  - `parseDifficulty()` - Converts difficulty text to numbers
  - `getDifficultyLabel()` - Converts numbers to difficulty text

#### Configuration Required:
```javascript
const SHEET_ID = 'YOUR_SHEET_ID_HERE';  // Replace with your Google Sheet ID
const DEPLOYED_WEBAPP_URL = 'YOUR_DEPLOYED_WEBAPP_URL_HERE';  // Add after deployment
```

### 2. `INTEGRATION_GUIDE.md` - Setup Instructions
**Location**: `d:\NBLD\Scheduler\INTEGRATION_GUIDE.md`

Comprehensive documentation covering:
- Google Sheet structure requirements
- Step-by-step deployment instructions
- Integration options (replace Firebase OR add export feature)
- API reference and data formats
- Troubleshooting guide
- Security considerations

### 3. `sheets-export.js` - Export Module
**Location**: `d:\NBLD\Scheduler\sheets-export.js`

JavaScript module for easy integration with your existing web app:

#### Functions:
- `exportScheduleToSheets(scheduleData, instructors, dances)` - Main export function
- `getDancesFromSheets()` - Fetch dances from Sheets
- `getScheduleFromSheets()` - Fetch schedule from Sheets
- `testConnection()` - Test API connectivity

#### Usage Example:
```javascript
import { exportScheduleToSheets } from './sheets-export.js';

// In your React component
const handleExport = async () => {
  try {
    await exportScheduleToSheets(schedules, instructors, dances);
    alert('Exported successfully!');
  } catch (error) {
    alert('Export failed: ' + error.message);
  }
};
```

## Google Sheet Structure

### "dances" Tab (Input)
This tab should contain your dance library:

| Dance Name | Artist | Song | Level/Difficulty | Stepsheet URL | Style |
|------------|--------|------|------------------|---------------|-------|
| Copperhead Road | Steve Earle | Copperhead Road | Beginner | https://... | Country |
| Electric Slide | Marcia Griffiths | Electric Boogie | High Beginner | https://... | R&B |

**Note**: Header row is optional. The script detects headers automatically.

### "schedule" Tab (Output)
The script creates this automatically with the following structure:

| Date | Time Slot | Dance Name | Instructor | Difficulty | Artist | Song | Stepsheet URL |
|------|-----------|------------|------------|------------|--------|------|---------------|
| 2025-12-01 | 7:00 PM | Copperhead Road | John Doe | Beginner | Steve Earle | Copperhead Road | https://... |
| 2025-12-01 | 7:30 PM | Electric Slide | Jane Smith | High Beginner | Marcia Griffiths | Electric Boogie | https://... |

## Quick Start Guide

1. **Create/Update Google Sheet**
   - Create "dances" tab with your dance data
   - "schedule" tab will be auto-created

2. **Deploy Apps Script**
   - Open Google Sheet → Extensions → Apps Script
   - Copy contents of `code.gs` into the editor
   - Update `SHEET_ID` with your Sheet ID
   - Deploy as Web App
   - Copy the deployment URL

3. **Update Web App**
   - Open `sheets-export.js`
   - Replace `YOUR_DEPLOYED_WEBAPP_URL_HERE` with your deployment URL
   - Import and use the export function in your index.html

4. **Test**
   - Visit `YOUR_DEPLOYED_WEBAPP_URL?action=getDances` to test reading
   - Use the export button in your web app to test writing

## Integration Options

### Option A: Full Replacement (Google Sheets as Database)
Replace Firebase entirely with Google Sheets. See INTEGRATION_GUIDE.md for details.

**Pros**: 
- Simpler setup
- Data visible in spreadsheet
- Easy manual editing

**Cons**: 
- Slower than Firebase
- Limited concurrent users
- Apps Script quotas apply

### Option B: Keep Firebase + Add Export (Recommended)
Keep your current Firebase setup and add a "Export to Sheets" button.

**Pros**: 
- Keep Firebase performance
- Have shareable spreadsheet export
- Best of both worlds

**Cons**: 
- Two systems to maintain
- Data can get out of sync

## Expected Data Flow

### Reading Dances (from Sheets to App)
```
Google Sheet "dances" tab
    ↓
Apps Script reads & parses
    ↓
Returns JSON via API
    ↓
Web app displays dances
```

### Exporting Schedule (from App to Sheets)
```
User generates schedule in web app
    ↓
Clicks "Export to Sheets"
    ↓
sheets-export.js formats data
    ↓
POST request to Apps Script
    ↓
Apps Script writes to "schedule" tab
    ↓
Data visible in Google Sheet
```

## Next Steps

1. **Review** `code.gs` and make any customizations needed
2. **Read** `INTEGRATION_GUIDE.md` for detailed setup instructions
3. **Deploy** the Apps Script as a web app
4. **Test** the API endpoints
5. **Integrate** using `sheets-export.js` or custom code
6. **Share** the Google Sheet with stakeholders

## Support & Troubleshooting

Common issues and solutions are documented in `INTEGRATION_GUIDE.md` under the "Troubleshooting" section.

Key things to check:
- Sheet ID is correct
- Tab names are exactly "dances" and "schedule" (lowercase)
- Apps Script is deployed as "Web app" not just saved
- Permissions are granted when prompted
- Deployment URL is used (not editor URL)

## Additional Notes

- The script includes placeholder comments marked with `TODO:` for required configuration
- Test functions (`testGetDances`, `testGetSchedule`) are included for debugging
- All functions include JSDoc comments for better IDE support
- Error handling and logging is built-in for troubleshooting
- The script handles various data formats flexibly (dates, difficulty levels, etc.)

---

**Files in this package:**
- `code.gs` - Apps Script backend (deploy this)
- `INTEGRATION_GUIDE.md` - Detailed setup instructions
- `sheets-export.js` - JavaScript module for web app integration
- `IMPLEMENTATION_SUMMARY.md` - This file
