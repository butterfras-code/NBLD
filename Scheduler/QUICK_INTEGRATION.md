# Quick Integration: Adding Google Sheets Export to Existing App

This guide shows how to add Google Sheets export to your existing Line Dance Scheduler without changing the current Firebase/CSV functionality.

## Step 1: Deploy the Apps Script

1. Open your Google Sheet with "dances" and "schedule" tabs
2. Go to **Extensions > Apps Script**
3. Copy the entire contents of `code.gs` into the script editor
4. Update line 18: Replace `'YOUR_SHEET_ID_HERE'` with your Sheet ID
5. Save and deploy as Web App (see INTEGRATION_GUIDE.md for detailed steps)
6. Copy the deployed web app URL

## Step 2: Add Export Function to index.html

Open `d:\NBLD\Scheduler\index.html` and add this code after the existing `handleExport` function (around line 361):

```javascript
// Add this new function for Google Sheets export
const handleExportToSheets = async () => {
  const APPS_SCRIPT_URL = 'YOUR_DEPLOYED_WEBAPP_URL_HERE'; // Replace with your URL
  
  if (!schedules || schedules.length === 0) {
    alert('No schedule data to export');
    return;
  }

  setStatusMsg('Exporting to Google Sheets...');
  
  try {
    // Helper function to get difficulty label
    const getDifficultyLabel = (num) => {
      const labels = {
        1: 'Beginner', 2: 'High Beginner', 3: 'Improver', 
        4: 'High Improver', 5: 'Low Intermediate', 6: 'Intermediate',
        7: 'High Intermediate', 8: 'Advanced'
      };
      return labels[num] || 'Beginner';
    };

    // Format schedule data for Google Sheets
    const formattedData = schedules
      .filter(day => day.lessons && day.lessons.length > 0)
      .map(day => ({
        date: day.date,
        lessons: day.lessons.map(lesson => {
          const instructor = instructors.find(i => i.id === lesson.instructorId);
          const dance = allDances.find(d => d.id === lesson.danceId);
          
          return {
            timeSlot: lesson.timeSlot || '',
            danceName: lesson.danceName || dance?.name || '',
            instructor: instructor?.name || 'Unknown',
            difficulty: getDifficultyLabel(lesson.difficulty),
            artist: dance?.artist || '',
            song: dance?.song || '',
            stepsheetUrl: dance?.stepsheetUrl || ''
          };
        })
      }));

    // Send to Google Sheets
    const response = await fetch(`${APPS_SCRIPT_URL}?action=saveSchedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedData)
    });

    if (response.ok || response.type === 'opaque') {
      setStatusMsg('✓ Exported to Google Sheets!');
      setTimeout(() => setStatusMsg(''), 3000);
    } else {
      throw new Error('Export failed');
    }
  } catch (error) {
    console.error('Export error:', error);
    setStatusMsg('✗ Google Sheets export failed');
    alert('Failed to export to Google Sheets: ' + error.message);
  }
};
```

## Step 3: Add the Export Button

Find the existing Export button (around line 433) and add the Google Sheets export button next to it:

**Find this code:**
```javascript
<button onClick={handleExport} className="text-sm flex items-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg">
  <Download size={16} className="mr-2"/> Export
</button>
```

**Replace with:**
```javascript
<button onClick={handleExport} className="text-sm flex items-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg" title="Export as CSV">
  <Download size={16} className="mr-2"/> Export CSV
</button>
<button onClick={handleExportToSheets} className="text-sm flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg" title="Export to Google Sheets">
  <Download size={16} className="mr-2"/> Export to Sheets
</button>
```

## Step 4: Test the Integration

1. Open your index.html in a browser
2. Log in as Admin
3. Generate or modify a schedule
4. Click "Export to Sheets" button
5. Check your Google Sheet's "schedule" tab for the exported data

## Complete Button Group Example

Here's the complete button group with both export options:

```javascript
<div className="flex items-center gap-2">
  {statusMsg && <span className="text-sm text-indigo-600 font-medium mr-2">{statusMsg}</span>}
  <button onClick={handleClearSchedule} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Reset">
    <Trash2 size={18}/>
  </button>
  <div className="h-4 w-px bg-slate-200 mx-1"/>
  <ManageInstructorsButton refreshInstructors={refreshData} />
  <button onClick={()=>setShowCalendarModal(true)} className="flex items-center text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg">
    <Settings size={16} className="mr-2"/> Manage Dates
  </button>
  <button onClick={handleAutoGenerate} disabled={isGenerating} className="text-sm flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50">
    {isGenerating? <RefreshCcw className="animate-spin mr-2" size={16}/>: <Wand2 size={16} className="mr-2"/>}
    Generate
  </button>
  <button onClick={handleExport} className="text-sm flex items-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg" title="Export as CSV">
    <Download size={16} className="mr-2"/> CSV
  </button>
  <button onClick={handleExportToSheets} className="text-sm flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg" title="Export to Google Sheets">
    <Download size={16} className="mr-2"/> Sheets
  </button>
</div>
```

## What This Does

- **Keeps existing functionality**: Your Firebase database and CSV export continue to work as before
- **Adds Google Sheets export**: New button exports current schedule to your Google Sheet
- **Non-invasive**: Doesn't modify any existing code, just adds new functionality
- **Visual feedback**: Shows status messages during export
- **Error handling**: Alerts user if export fails

## Alternative: Import Dances from Sheets

If you also want to load dances from the Google Sheet instead of Firebase, add this function:

```javascript
const handleImportDancesFromSheets = async () => {
  const APPS_SCRIPT_URL = 'YOUR_DEPLOYED_WEBAPP_URL_HERE';
  
  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getDances`);
    if (!response.ok) throw new Error('Failed to fetch dances');
    
    const sheetDances = await response.json();
    
    // Add these dances to your Firebase dances collection
    for (const dance of sheetDances) {
      await StorageService.addDance(dance);
    }
    
    alert(`Imported ${sheetDances.length} dances from Google Sheets`);
    // Refresh your dances list
    await refreshData();
  } catch (error) {
    console.error('Import error:', error);
    alert('Failed to import from Google Sheets: ' + error.message);
  }
};
```

Add a button for this in the admin dashboard if needed.

## Troubleshooting

### Export button does nothing
- Check browser console for errors
- Verify APPS_SCRIPT_URL is correct
- Make sure Apps Script is deployed as Web App (not just saved)

### "CORS error"
- Apps Script should handle CORS automatically
- Try adding `mode: 'no-cors'` to the fetch options if needed
- Verify deployment has correct permissions

### Empty schedule tab
- Check that formattedData has content (add `console.log(formattedData)`)
- Verify schedule has lessons before clicking export
- Check Apps Script execution logs in Apps Script editor

### Permission denied
- Re-authorize the Apps Script
- Check "Who has access" setting in deployment
- Make sure you're using the deployment URL, not the editor URL

## Summary

You now have:
1. ✓ Existing Firebase + CSV export (unchanged)
2. ✓ New Google Sheets export button
3. ✓ Data flows to "schedule" tab in your Google Sheet
4. ✓ Stakeholders can view/share the Google Sheet

Both systems work independently - use whichever fits your needs!
