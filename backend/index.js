// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
// Correct require paths based on file structure
const { generatePolicy } = require('./gemini'); 
const { generatePDF } = require('./pdf'); // Assuming pdf.js was moved to backend/utils/

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes (relative to backend)
app.post('/api/gemini', async (req, res) => {
  try {
    const policyData = req.body;
    
    // Validate required fields
    if (!policyData.websiteName || !policyData.contactEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Website name and contact email are required'
      });
    }
    
    console.log('Generating policy for:', policyData.websiteName);
    const generatedPolicy = await generatePolicy(policyData);
    
    // Return success response
    res.json({ 
      success: true, 
      policy: generatedPolicy 
    });
  } catch (error) {
    console.error('Error generating policy:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate policy'
    });
  }
});

// PDF generation endpoint (relative to backend)
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { html, websiteName } = req.body;
    
    if (!html) {
      return res.status(400).json({ success: false, error: 'HTML content is required' });
    }
    
    // Add CSS styling for PDF
    const styledHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Privacy Policy - ${websiteName || 'Website'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          h1 {
            color: #2c3e50;
            font-size: 24px;
            margin-top: 20px;
            margin-bottom: 10px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          h2 {
            color: #2c3e50;
            font-size: 18px;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          p {
            margin-bottom: 10px;
          }
          ul, ol {
            margin-bottom: 10px;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            margin-top: 20px;
            color: #777;
          }
        </style>
      </head>
      <body>
        ${html}
        <div class="footer">
          <p>Privacy Policy for ${websiteName || 'Website'} - Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;
    
    // Generate PDF
    const pdfBuffer = await generatePDF(styledHtml);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="privacy-policy-${(websiteName || 'website').toLowerCase().replace(/[^a-z0-9]/gi, '-')}.pdf"`);
    
    // Send the PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate PDF'
    });
  }
});

// Fallback route: Serve index.html for any other GET request
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Frontend should be accessible at http://localhost:${PORT}`);
});