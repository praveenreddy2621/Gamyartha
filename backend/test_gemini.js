require('dotenv').config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log(`API Key loaded: ${GEMINI_API_KEY ? 'YES' : 'NO'}`);
if (GEMINI_API_KEY) {
    console.log(`API Key length: ${GEMINI_API_KEY.length}`);
    console.log(`API Key starts with: ${GEMINI_API_KEY.substring(0, 4)}...`);
}

async function listModels() {
    console.log("Listing models...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
        if (!response.ok) {
            console.log(`❌ FAILED to list models: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log(`Response: ${text}`);
            return;
        }
        const data = await response.json();
        console.log("Available models:");
        data.models.forEach(m => console.log(` - ${m.name}`));
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
