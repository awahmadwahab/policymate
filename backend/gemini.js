const axios = require('axios');
require('dotenv').config();

async function generatePolicy(policyData) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    if (!apiKey) {
      throw new Error('Gemini API key is missing. Please check your .env file.');
    }

    const prompt = constructPrompt(policyData);

    console.log('Sending request to Gemini API...');

    const response = await axios.post(
      `${apiUrl}?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
        ]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.data || !response.data.candidates || !response.data.candidates[0]?.content?.parts) {
      throw new Error('Invalid Gemini API response structure.');
    }

    let generatedContent = response.data.candidates[0].content.parts[0].text;
    generatedContent = generatedContent.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();

    return generatedContent;
  } catch (error) {
    console.error('Gemini API Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    throw new Error('Failed to generate privacy policy: ' + (error.response?.data?.error?.message || error.message));
  }
}

function constructPrompt(data) {
  if (!data.websiteName || !data.contactEmail || !data.dataCollected || !data.dataPurpose) {
    throw new Error('Missing required policy data fields.');
  }

  return `...`;  // As before
}

module.exports = { generatePolicy };
