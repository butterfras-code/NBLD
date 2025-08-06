// Get the API key from the .env file
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Reusable function to call the Gemini API
export const callGeminiAPI = async (prompt) => {
    if (!GEMINI_API_KEY) {
        console.error("Gemini API key is missing.");
        return "Error: Gemini API key not configured.";
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Gemini API Error:", errorBody);
            return `Error: ${errorBody.error.message}`;
        }

        const data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text;
        }
        return "No response from AI.";

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "An error occurred while contacting the AI.";
    }
};
