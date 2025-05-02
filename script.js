// Enhanced form handling for the privacy policy generator
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('policyForm');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContainer = document.getElementById('resultContainer');
    
    // Show/hide conditional fields based on selections
    const dataStorage = document.getElementById('dataStorage');
    const storageDetails = document.querySelector('.storage-details');
    const thirdPartySharing = document.getElementById('thirdPartySharing');
    const thirdPartyDetails = document.querySelector('.third-party-details');
    const otherCompliance = document.getElementById('otherCompliance');
    const otherComplianceDetails = document.querySelector('.other-compliance-details');

    // Event listeners for conditional fields
    if (dataStorage) {
        dataStorage.addEventListener('change', function() {
            if (this.value === 'limited-time') {
                storageDetails.classList.remove('d-none');
            } else {
                storageDetails.classList.add('d-none');
            }
        });
    }

    if (thirdPartySharing) {
        thirdPartySharing.addEventListener('change', function() {
            if (this.value === 'none' || this.value === 'service-providers') {
                thirdPartyDetails.classList.add('d-none');
            } else {
                thirdPartyDetails.classList.remove('d-none');
            }
        });
    }

    if (otherCompliance) {
        otherCompliance.addEventListener('change', function() {
            if (this.checked) {
                otherComplianceDetails.classList.remove('d-none');
            } else {
                otherComplianceDetails.classList.add('d-none');
            }
        });
    }

    // Form validation
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Basic validation for required fields
        let valid = true;
        
        // Check if at least one data type is selected
        const dataCheckboxes = document.querySelectorAll('[name="dataCollected"]');
        const atLeastOneChecked = Array.from(dataCheckboxes).some(checkbox => checkbox.checked);
        
        if (!atLeastOneChecked) {
            valid = false;
            // You might want to show an error message here
            alert("Please select at least one type of data that you collect.");
        }
        
        // Add Bootstrap's validation classes
        form.classList.add('was-validated');
        
        if (!form.checkValidity() || !valid) {
            e.stopPropagation();
            return;
        }
        
        // Show loading indicator
        loadingIndicator.classList.remove('d-none');
        resultContainer.innerHTML = '';
        copyBtn.disabled = true;
        generateBtn.disabled = true;
        
        // Collect form data - enhanced to handle all form fields
        const formData = {
            // Basic Information
            websiteName: document.getElementById('websiteName').value,
            websiteUrl: document.getElementById('websiteUrl')?.value || '',
            businessType: document.getElementById('businessType')?.value || 'business',
            
            // Data Collection
            dataCollected: getCheckedValues('dataCollected'),
            otherDataCollected: document.getElementById('otherDataCollected')?.value || '',
            dataUsage: document.getElementById('dataUsage').value,
            dataStorage: document.getElementById('dataStorage')?.value || 'service-duration',
            storageDetails: document.getElementById('storageDetails')?.value || '',
            
            // Data Sharing
            thirdPartySharing: document.getElementById('thirdPartySharing').value,
            thirdPartyDetails: document.getElementById('thirdPartyDetails')?.value || '',
            internationalTransfers: document.getElementById('internationalTransfers')?.value || 'no',
            
            // User Rights
            userRights: getCheckedValues('userRights'),
            
            // Contact Information
            contactEmail: document.getElementById('contactEmail').value,
            contactPhone: document.getElementById('contactPhone')?.value || '',
            contactAddress: document.getElementById('contactAddress')?.value || '',
            
            // Additional Options
            compliance: getCheckedValues('compliance'),
            otherComplianceDetails: document.getElementById('otherComplianceDetails')?.value || '',
            effectiveDate: document.getElementById('effectiveDate')?.value || new Date().toISOString().split('T')[0]
        };
        
        try {
            // Call the serverless function
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            // Hide loading indicator
            loadingIndicator.classList.add('d-none');

            if (response.ok) {
                // Try parsing JSON only if response is OK
                const result = await response.json(); // This might still fail if the OK response isn't JSON
                // Display the generated policy with formatting
                resultContainer.innerHTML = `
                    <div class="success-indicator">✅ Policy Generated Successfully</div>
                    <div class="generated-policy">${formatPolicyText(result.text)}</div>
                `;
                copyBtn.disabled = false;
                saveFormData(formData);
            } else {
                // Handle error response - try reading as text first
                let errorText = 'An error occurred while generating the privacy policy.';
                try {
                    // Attempt to get more specific error from response body
                    const errorResult = await response.text(); // Read as text first
                    // Try parsing as JSON *if* it looks like JSON, otherwise use the text
                    if (errorResult && response.headers.get('content-type')?.includes('application/json')) {
                         const jsonError = JSON.parse(errorResult);
                         errorText = jsonError.error || errorResult; // Use specific error if available
                    } else if (errorResult) {
                        errorText = errorResult; // Use the raw text if not JSON
                    } else {
                        errorText = `Server responded with status ${response.status}`;
                    }
                } catch (parseError) {
                    console.error("Could not parse error response:", parseError);
                    errorText = `Server responded with status ${response.status}. Unable to parse error details.`;
                }

                // Show error message
                resultContainer.innerHTML = `
                    <div class="error-message">
                        <p>⚠️ ${errorText}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error:', error);
            
            // Hide loading indicator
            loadingIndicator.classList.add('d-none');
            
            // Show fallback message
            resultContainer.innerHTML = `
                <div class="error-message">
                    <p>⚠️ We couldn't get a response from Gemini, but here's your input:</p>
                    <div class="mt-3">
                        <strong>Website:</strong> ${formData.websiteName}<br>
                        <strong>Data Collected:</strong> ${formData.dataCollected.join(', ')}<br>
                        <strong>Data Usage:</strong> ${formData.dataUsage}<br>
                        <strong>Contact Email:</strong> ${formData.contactEmail}
                    </div>
                    <p class="mt-3">Please try again later or contact support.</p>
                </div>
            `;
        } finally {
            // Re-enable the generate button
            generateBtn.disabled = false;
            
            // Scroll to the result
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
    
    // Helper function to get checked values from checkboxes
    function getCheckedValues(name) {
        const checkboxes = document.querySelectorAll(`[name="${name}"]`);
        return Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
    }
    
    // Helper function to format policy text with Markdown-like formatting
    function formatPolicyText(text) {
        // Replace newlines with <br> tags
        let formatted = text.replace(/\n/g, '<br>');
        
        // Format headings (assuming # style headings)
        formatted = formatted.replace(/#{1,6}\s+(.*?)(?:<br>)/g, (match, heading) => {
            const level = match.indexOf(' ');
            return `<h${level} class="mt-4 mb-3">${heading}</h${level}><br>`;
        });
        
        // Format bold text
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Format italic text
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return formatted;
    }
    
    // Save form data to localStorage for future use
    function saveFormData(data) {
        try {
            localStorage.setItem('policyFormData', JSON.stringify(data));
        } catch (error) {
            console.warn('Could not save form data to localStorage:', error);
        }
    }
    
    // Load saved form data if available
    function loadSavedFormData() {
        try {
            const savedData = localStorage.getItem('policyFormData');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // Fill in form fields
                document.getElementById('websiteName').value = data.websiteName || '';
                if (document.getElementById('websiteUrl')) {
                    document.getElementById('websiteUrl').value = data.websiteUrl || '';
                }
                
                // Fill other fields as needed
                // ... (additional code to populate form fields)
                
                console.log('Loaded saved form data');
            }
        } catch (error) {
            console.warn('Could not load saved form data:', error);
        }
    }
    
    // Try to load saved data when page loads
    loadSavedFormData();
    
    // Handle copy button click
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const policyText = document.querySelector('.generated-policy')?.innerText;
            
            if (policyText) {
                navigator.clipboard.writeText(policyText)
                    .then(() => {
                        // Temporarily change button text to indicate success
                        const originalText = copyBtn.textContent;
                        copyBtn.textContent = 'Copied!';
                        
                        setTimeout(() => {
                            copyBtn.textContent = originalText;
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Failed to copy text: ', err);
                        alert('Failed to copy policy text. Please try again.');
                    });
            }
        });
    }
});