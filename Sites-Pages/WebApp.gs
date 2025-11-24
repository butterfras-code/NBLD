/**
 * TThis is the Google Apps Script code.
 * Follow the setup instructions to deploy this as a web app.
 */

// 1. IMPORTANT: Replace with your Google Sheet's ID.
// You can find this in the URL of your sheet:
// https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
const SHEET_ID = '1ZYFLKFCwY9ou5Yzx0xXz53YDjAJ-NFDbhQVL1BcIN1I';

// 2. IMPORTANT: Replace with the name of the sheet (tab) you want to get data from.
const SHEET_NAME = 'schedule';

/**
 * This function runs when your deployed URL is visited (e.g., by the fetch call).
 * It gets all data from the specified sheet and returns it as JSON.
 */
function oldDoGet(e) {
  try {
    const spreadSheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadSheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Sheet not found with name: ' + SHEET_NAME);
    }

    // Get all data from the sheet.
    // getDisplayValues() gets the formatted values (e.g., "$1.00")
    // getValues() gets the raw values (e.g., 1)
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

