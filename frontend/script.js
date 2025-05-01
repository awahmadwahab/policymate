document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const policyForm = document.getElementById('policyForm');
    const policyOutput = document.getElementById('policyOutput');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const cookiesYes = document.getElementById('cookiesYes');
    const cookiesNo = document.getElementById('cookiesNo');
    const cookieTypesContainer = document.querySelector('.cookie-types');
    const cookieTypes = document.getElementById('cookieTypes');
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    // Bootstrap 5 Toast instance
    const toastInstance = new bootstrap.Toast(toast);
    
    // Show/hide cookie types field based on cookie selection
    cookiesYes.addEventListener('change', toggleCookieTypes);
    cookiesNo.addEventListener('change', toggleCookieTypes);
    
    function toggleCookieTypes() {
      if (cookiesYes.checked) {
        cookieTypesContainer.classList.remove('d-none');
        cookieTypes.setAttribute('required', 'required');
      } else {
        cookieTypesContainer.classList.add('d-none');
        cookieTypes.removeAttribute('required');
      }
    }
    
    // Form submission handler
    policyForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Update UI to loading state
      const generateBtn = document.getElementById('generateBtn');
      const originalBtnText = generateBtn.textContent;
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';
      policyOutput.innerHTML = '<p class="text-center"><span class="spinner-border" role="status" aria-hidden="true"></span><br>Generating your privacy policy...</p>';
      
      // Get form data
      const formData = getFormData();
      
      try {
        // Call API to generate policy
        const response = await fetch('https://policymate.onrender.com/api/gemini', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Display the generated policy
          policyOutput.innerHTML = data.policy;
          
          // Enable copy and download buttons
          copyBtn.disabled = false;
          downloadBtn.disabled = false;
          
          // Show success message
          showToast('Success', 'Your privacy policy has been generated!', 'success');
        } else {
          // Show error
          policyOutput.innerHTML = `<div class="alert alert-danger">
            <h4>Error Generating Policy</h4>
            <p>${data.error || 'An unknown error occurred'}</p>
          </div>`;
          
          showToast('Error', data.error || 'Failed to generate policy', 'danger');
        }
      } catch (error) {
        console.error('Error:', error);
        policyOutput.innerHTML = `<div class="alert alert-danger">
          <h4>Error Generating Policy</h4>
          <p>Network error or server is not responding. Please try again later.</p>
          <p class="small text-muted">${error.message}</p>
        </div>`;
        
        showToast('Error', 'Network error. Please try again.', 'danger');
      } finally {
        // Reset button state
        generateBtn.disabled = false;
        generateBtn.textContent = originalBtnText;
      }
    });
    
    // Copy to clipboard functionality
    copyBtn.addEventListener('click', function() {
      const policyContent = policyOutput.innerHTML;
      
      try {
        // Modern clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(policyContent)
            .then(() => {
              showToast('Copied!', 'Privacy policy copied to clipboard', 'success');
            })
            .catch((err) => {
              console.error('Clipboard write failed:', err);
              fallbackCopyToClipboard(policyContent);
            });
        } else {
          fallbackCopyToClipboard(policyContent);
        }
      } catch (err) {
        console.error('Copy error:', err);
        showToast('Error', 'Failed to copy to clipboard', 'danger');
      }
    });
    
    // Fallback copy method
    function fallbackCopyToClipboard(text) {
      // Create a temporary textarea element to copy from
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';  // Prevent scrolling to bottom
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          showToast('Copied!', 'Privacy policy copied to clipboard', 'success');
        } else {
          showToast('Error', 'Failed to copy to clipboard', 'danger');
        }
      } catch (err) {
        console.error('execCommand error:', err);
        showToast('Error', 'Failed to copy to clipboard', 'danger');
      } finally {
        document.body.removeChild(textarea);
      }
    }
    
    // Download functionality
    downloadBtn.addEventListener('click', async function() {
      const websiteName = document.getElementById('websiteName').value;
      
      // Create a dropdown for download format selection
      const formatSelector = document.createElement('div');
      formatSelector.className = 'download-format-selector';
      formatSelector.style.position = 'absolute';
      formatSelector.style.zIndex = '1000';
      formatSelector.style.backgroundColor = 'white';
      formatSelector.style.border = '1px solid #ccc';
      formatSelector.style.borderRadius = '4px';
      formatSelector.style.padding = '10px';
      formatSelector.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      
      // Position the dropdown near the download button
      const btnRect = downloadBtn.getBoundingClientRect();
      formatSelector.style.top = (btnRect.bottom + window.scrollY + 5) + 'px';
      formatSelector.style.right = (window.innerWidth - btnRect.right) + 'px';
      
      formatSelector.innerHTML = `
        <p style="margin: 0 0 8px; font-weight: bold;">Choose Format:</p>
        <button class="btn btn-sm btn-outline-primary mb-2 w-100" id="download-html">HTML File</button>
        <button class="btn btn-sm btn-outline-primary w-100" id="download-pdf">PDF Document</button>
      `;
      
      document.body.appendChild(formatSelector);
      
      // Close dropdown when clicking outside
      const closeDropdown = (e) => {
        if (!formatSelector.contains(e.target) && e.target !== downloadBtn) {
          document.body.removeChild(formatSelector);
          document.removeEventListener('click', closeDropdown);
        }
      };
      
      // Add a slight delay before adding the click listener to prevent immediate closing
      setTimeout(() => {
        document.addEventListener('click', closeDropdown);
      }, 100);
      
      // HTML download handler
      document.getElementById('download-html').addEventListener('click', function() {
        const fileName = (websiteName ? websiteName.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'website') + '-privacy-policy.html';
        
        try {
          // Create a blob with the policy content
          const policyContent = policyOutput.innerHTML;
          const blob = new Blob([`<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - ${websiteName}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      h1, h2, h3 {
        color: #333;
      }
      h1 {
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
      }
      section {
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body>
    ${policyContent}
  </body>
  </html>`], { type: 'text/html' });
          
          // Create a download link
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          
          // Clean up
          setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 0);
          
          showToast('Downloaded!', 'Privacy policy HTML downloaded successfully', 'success');
        } catch (error) {
          console.error('Download error:', error);
          showToast('Error', 'Failed to download HTML', 'danger');
        }
        
        // Close dropdown
        document.body.removeChild(formatSelector);
        document.removeEventListener('click', closeDropdown);
      });
      
      // PDF download handler
      document.getElementById('download-pdf').addEventListener('click', async function() {
        try {
          showToast('Processing', 'Generating PDF, please wait...', 'primary');
          
          // Call the server to generate PDF
          const response = await fetch('https://policymate.onrender.com/api/generate-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              html: policyOutput.innerHTML,
              websiteName: websiteName
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to generate PDF');
          }
          
          // Get the PDF blob from response
          const pdfBlob = await response.blob();
          
          // Create a download link
          const url = URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${websiteName ? websiteName.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'website'}-privacy-policy.pdf`;
          document.body.appendChild(a);
          a.click();
          
          // Clean up
          setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 0);
          
          showToast('Downloaded!', 'Privacy policy PDF downloaded successfully', 'success');
        } catch (error) {
          console.error('PDF Generation error:', error);
          showToast('Error', 'Failed to generate PDF', 'danger');
        }
        
        // Close dropdown
        document.body.removeChild(formatSelector);
        document.removeEventListener('click', closeDropdown);
      });
    });
    
    // Helper function to collect form data
    function getFormData() {
      // Get selected data types
      const dataCollected = Array.from(document.querySelectorAll('input[type=checkbox]:checked'))
        .map(checkbox => checkbox.value);
      
      return {
        websiteName: document.getElementById('websiteName').value,
        contactEmail: document.getElementById('contactEmail').value,
        dataCollected: dataCollected.length > 0 ? dataCollected : ['No personal data collected'],
        dataPurpose: document.getElementById('dataPurpose').value,
        dataRetention: document.getElementById('dataRetention').value,
        dataSharing: document.getElementById('dataSharing').value,
        usesCookies: document.getElementById('cookiesYes').checked,
        cookieTypes: document.getElementById('cookieTypes').value,
        userRights: document.getElementById('userRights').value
      };
    }
    
    // Helper function to show toast notifications
    function showToast(title, message, type = 'primary') {
      toastTitle.textContent = title;
      toastMessage.textContent = message;
      
      // Clear previous classes first
      toast.className = 'toast';
      
      // Add appropriate class based on type
      if (type === 'success') {
        toast.classList.add('bg-success', 'text-white');
      } else if (type === 'danger') {
        toast.classList.add('bg-danger', 'text-white');
      } else if (type === 'warning') {
        toast.classList.add('bg-warning');
      } else {
        toast.classList.add('bg-primary', 'text-white');
      }
      
      // Show the toast
      toastInstance.show();
    }
  });