const pdf = require('html-pdf');

/**
 * Generate a PDF from HTML content
 * @param {string} html - HTML content to convert to PDF
 * @param {Object} options - PDF options
 * @returns {Promise<Buffer>} - PDF buffer
 */
function generatePDF(html, options = {}) {
  // Default options
  const defaultOptions = {
    format: 'A4',
    border: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    },
    header: {
      height: '10mm'
    },
    footer: {
      height: '10mm'
    }
  };

  // Merge default options with provided options
  const pdfOptions = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    pdf.create(html, pdfOptions).toBuffer((err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });
}

module.exports = {
  generatePDF
};