import { config } from 'dotenv';
config(); // Load environment variables from .env file

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY is not set in the environment variables.');
    process.exit(1);
}

// Initialize the Gemini API client
let genAI = null;
try {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log('Gemini API client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Gemini API client:', error);
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const formData = req.body;

    // Validate required fields
    if (!formData.companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    if (!genAI) {
      return res.status(503).json({ error: 'Gemini API is not configured properly' });
    }

    // Prepare the prompt for Gemini API
    const prompt = `
A user has submitted the following form data. Please generate a friendly and informative privacy policy summary based on this and generate directly the policy text without your any additional text other than policy.

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

      return res.json({ result: response });
    } catch (error) {
      console.error('Error calling Gemini:', error);
      return res.status(500).json({ error: 'Failed to generate content' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
