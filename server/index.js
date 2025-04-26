import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and request parsing
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the project root directory
app.use(express.static(path.join(__dirname, '..')));

// Initialize Gemini API with hardcoded key (for development only)
// In production, use environment variables instead
const GEMINI_API_KEY = "AIzaSyBStk4tI5-qdSS7Fp1k7fagrHJELGw_IYU";
console.log('Gemini API key configured:', GEMINI_API_KEY ? 'Yes' : 'No');

// Initialize the Gemini API client
let genAI = null;
try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log('Gemini API client initialized successfully');
} catch (error) {
    console.error('Failed to initialize Gemini API client:', error);
}

// API endpoint for generating policy with Gemini
app.post('/api/gemini', async (req, res) => {
    const formData = req.body;
    
    // Validate required fields
    if (!formData.companyName) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    // Check if API key is available
    if (!genAI) {
        return res.status(503).json({ error: 'Gemini API is not configured' });
    }

    // THIS IS THE PROMPT THAT GETS SENT TO THE GEMINI API
    const prompt = `
A user has submitted the following form data. Please generate a friendly and informative privacy policy summary based on this and generate directly the policy text.

Company Name: ${formData.companyName}
Website URL: ${formData.websiteUrl}
Contact Email: ${formData.contactEmail}

Data Collected:
- Name: ${formData.collectData.name}
- Email: ${formData.collectData.email}
- Phone: ${formData.collectData.phone}
- Address: ${formData.collectData.address}
- Cookies: ${formData.collectData.cookies}
- IP Address: ${formData.collectData.ip}
- Other: ${formData.collectData.other || 'None specified'}

Purpose of Collection:
- Service: ${formData.purpose.service}
- Communication: ${formData.purpose.communication}
- Marketing: ${formData.purpose.marketing}
- Analytics: ${formData.purpose.analytics}
- Other: ${formData.purpose.other || 'None specified'}

Data Storage Duration: ${formData.storageDuration}
Data Storage Method: ${formData.storageMethod || 'Not specified'}

Do they share data with third parties? ${formData.shareData}
Third Parties: ${formData.shareData === 'yes' ? formData.thirdParties || 'Not specified' : 'No'}

Format the policy in plain text with proper sections and headings. Make it comprehensive yet easy to understand.
`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        res.json({ result: response });
    } catch (error) {
        console.error('Error calling Gemini:', error);
        res.status(500).json({ error: 'Failed to generate content' });
    }
});

// Default route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
