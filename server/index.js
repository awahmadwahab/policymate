// server/index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/gemini', async (req, res) => {
    const formData = req.body;

    const prompt = `
A user has submitted the following form data. Please generate a friendly and informative privacy policy summary based on this:

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
- Other: ${formData.collectData.other}

Purpose of Collection:
- Service: ${formData.purpose.service}
- Communication: ${formData.purpose.communication}
- Marketing: ${formData.purpose.marketing}
- Analytics: ${formData.purpose.analytics}
- Other: ${formData.purpose.other}

Data Storage Duration: ${formData.storageDuration}
Data Storage Method: ${formData.storageMethod}

Do they share data with third parties? ${formData.shareData}
Third Parties: ${formData.thirdParties}
`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        res.json({ result: response });
    } catch (error) {
        console.error('Error calling Gemini:', error);
        res.status(500).json({ error: 'Failed to generate content' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
