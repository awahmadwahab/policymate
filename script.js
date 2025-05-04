// Enhanced form handling for the privacy policy generator
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('policyForm');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const downloadTxtBtn = document.getElementById('downloadTxtBtn');
    const actionButtons = document.getElementById('actionButtons');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContainer = document.getElementById('resultContainer');
    const formProgress = document.getElementById('formProgress');
    
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
                storageDetails.classList.add('field-fade-in');
            } else {
                storageDetails.classList.add('d-none');
                storageDetails.classList.remove('field-fade-in');
            }
            updateProgress();
        });
    }

    if (thirdPartySharing) {
        thirdPartySharing.addEventListener('change', function() {
            if (this.value === 'none' || this.value === 'service-providers') {
                thirdPartyDetails.classList.add('d-none');
                thirdPartyDetails.classList.remove('field-fade-in');
            } else {
                thirdPartyDetails.classList.remove('d-none');
                thirdPartyDetails.classList.add('field-fade-in');
            }
            updateProgress();
        });
    }

    if (otherCompliance) {
        otherCompliance.addEventListener('change', function() {
            if (this.checked) {
                otherComplianceDetails.classList.remove('d-none');
                otherComplianceDetails.classList.add('field-fade-in');
            } else {
                otherComplianceDetails.classList.add('d-none');
                otherComplianceDetails.classList.remove('field-fade-in');
            }
            updateProgress();
        });
    }

    // Add event listeners to all form elements to update progress
    const formElements = form.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
        element.addEventListener('change', updateProgress);
        element.addEventListener('input', updateProgress);
    });

    // Update progress bar based on form completion
    function updateProgress() {
        const totalFields = form.querySelectorAll('input:not([type="checkbox"]), select, textarea').length;
        const filledFields = Array.from(form.querySelectorAll('input:not([type="checkbox"]), select, textarea'))
            .filter(element => {
                if (element.classList.contains('d-none') || element.parentElement.classList.contains('d-none')) {
                    return false;
                }
                return element.value.trim() !== '';
            }).length;
        
        const checkedBoxes = Array.from(form.querySelectorAll('input[type="checkbox"]'))
            .filter(checkbox => checkbox.checked).length;
        const totalCheckboxGroups = new Set(Array.from(form.querySelectorAll('input[type="checkbox"]'))
            .map(checkbox => checkbox.name)).size;
        
        // Calculate weighted progress (form fields + at least one checkbox per group)
        const filledProgress = (filledFields / totalFields) * 70; // 70% weight for text fields
        const checkboxProgress = (Math.min(checkedBoxes, totalCheckboxGroups) / totalCheckboxGroups) * 30; // 30% weight for checkboxes
        
        const totalProgress = Math.min(100, Math.floor(filledProgress + checkboxProgress));
        
        formProgress.style.width = `${totalProgress}%`;
        formProgress.setAttribute('aria-valuenow', totalProgress);
    }

    // Initialize progress on page load
    setTimeout(updateProgress, 500);

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
            const firstCheckbox = dataCheckboxes[0].closest('.card');
            showValidationError("Please select at least one type of data that you collect.");
            smoothScrollTo(firstCheckbox);
        }
        
        // Add Bootstrap's validation classes
        form.classList.add('was-validated');
        
        if (!form.checkValidity() || !valid) {
            // Find the first invalid element and scroll to it
            const firstInvalid = form.querySelector(':invalid');
            if (firstInvalid) {
                showValidationError("Please fill in all required fields.");
                smoothScrollTo(firstInvalid);
            }
            e.stopPropagation();
            return;
        }
        
        // Show loading indicator with animation
        resultContainer.classList.add('result-fade-out');
        setTimeout(() => {
            loadingIndicator.classList.remove('d-none');
            resultContainer.innerHTML = '';
            resultContainer.classList.remove('result-fade-out');
            actionButtons.classList.add('d-none');
            copyBtn.disabled = true;
            downloadPdfBtn.disabled = true;
            downloadTxtBtn.disabled = true;
            generateBtn.disabled = true;
            
            // Process form after brief delay for better UX
            setTimeout(processForm, 500);
        }, 300);
        
        async function processForm() {
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
                    const result = await response.json();
                    
                    // Display the generated policy with formatting and fade-in animation
                    resultContainer.innerHTML = `
                        <div class="success-indicator">Policy Generated Successfully</div>
                        <div class="generated-policy">${formatPolicyText(result.text)}</div>
                    `;
                    resultContainer.classList.add('result-fade-in');
                    
                    // Show action buttons with animation
                    setTimeout(() => {
                        actionButtons.classList.remove('d-none');
                        actionButtons.classList.add('buttons-fade-in');
                        copyBtn.disabled = false;
                        downloadPdfBtn.disabled = false;
                        downloadTxtBtn.disabled = false;
                    }, 400);
                    
                    // Save form data
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
                            <p><i class="fas fa-exclamation-triangle me-2"></i>${errorText}</p>
                        </div>
                    `;
                    resultContainer.classList.add('result-fade-in');
                }
            } catch (error) {
                console.error('Error:', error);
                
                // Hide loading indicator
                loadingIndicator.classList.add('d-none');
                
                // Show fallback message
                resultContainer.innerHTML = `
                    <div class="error-message">
                        <p><i class="fas fa-exclamation-triangle me-2"></i>We couldn't get a response from the server.</p>
                        <div class="mt-3">
                            <strong>Website:</strong> ${formData.websiteName}<br>
                            <strong>Data Collected:</strong> ${formData.dataCollected.join(', ')}<br>
                            <strong>Data Usage:</strong> ${formData.dataUsage}<br>
                            <strong>Contact Email:</strong> ${formData.contactEmail}
                        </div>
                        <p class="mt-3">Please try again later or contact support.</p>
                    </div>
                `;
                resultContainer.classList.add('result-fade-in');
            } finally {
                // Re-enable the generate button
                generateBtn.disabled = false;
                
                // Scroll to the result on mobile screens
                if (window.innerWidth < 992) {
                    smoothScrollTo(resultContainer);
                }
            }
        }
    });
    
    // Helper function for smooth scrolling
    function smoothScrollTo(element) {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const offset = 100; // Add some offset from the top
        const targetPosition = window.pageYOffset + rect.top - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
    
    // Show validation error 
    function showValidationError(message) {
        // Flash the generate button briefly to indicate error
        generateBtn.classList.add('btn-shake');
        setTimeout(() => {
            generateBtn.classList.remove('btn-shake');
        }, 600);
        
        // Could also show a toast/snackbar here
    }
    
    // Helper function to get checked values from checkboxes
    function getCheckedValues(name) {
        const checkboxes = document.querySelectorAll(`[name="${name}"]`);
        return Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
    }
    
    // Helper function to format policy text with Markdown-like formatting
    function formatPolicyText(text) {
        if (!text) return '';
        
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
        
        // Format lists
        formatted = formatted.replace(/^- (.*?)(?:<br>)/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
        
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
                
                // Fill in business type
                if (data.businessType && document.getElementById('businessType')) {
                    document.getElementById('businessType').value = data.businessType;
                }
                
                // Fill in checkboxes for data collected
                if (data.dataCollected && data.dataCollected.length) {
                    data.dataCollected.forEach(type => {
                        const checkbox = document.querySelector(`[name="dataCollected"][value="${type}"]`);
                        if (checkbox) checkbox.checked = true;
                    });
                }
                
                // Fill in other fields
                if (document.getElementById('otherDataCollected')) {
                    document.getElementById('otherDataCollected').value = data.otherDataCollected || '';
                }
                
                if (document.getElementById('dataUsage')) {
                    document.getElementById('dataUsage').value = data.dataUsage || '';
                }
                
                // Set data storage options
                if (data.dataStorage && document.getElementById('dataStorage')) {
                    document.getElementById('dataStorage').value = data.dataStorage;
                    // Show storage details if needed
                    if (data.dataStorage === 'limited-time' && document.getElementById('storageDetails')) {
                        storageDetails.classList.remove('d-none');
                        document.getElementById('storageDetails').value = data.storageDetails || '';
                    }
                }
                
                // Set data sharing options
                if (data.thirdPartySharing && document.getElementById('thirdPartySharing')) {
                    document.getElementById('thirdPartySharing').value = data.thirdPartySharing;
                    // Show third party details if needed
                    if (['partners', 'advertisers', 'affiliates', 'extensive'].includes(data.thirdPartySharing) && 
                        document.getElementById('thirdPartyDetails')) {
                        thirdPartyDetails.classList.remove('d-none');
                        document.getElementById('thirdPartyDetails').value = data.thirdPartyDetails || '';
                    }
                }
                
                // Set international transfers
                if (data.internationalTransfers && document.getElementById('internationalTransfers')) {
                    document.getElementById('internationalTransfers').value = data.internationalTransfers;
                }
                
                // Fill in user rights
                if (data.userRights && data.userRights.length) {
                    data.userRights.forEach(right => {
                        const checkbox = document.querySelector(`[name="userRights"][value="${right}"]`);
                        if (checkbox) checkbox.checked = true;
                    });
                }
                
                // Fill in contact information
                if (document.getElementById('contactEmail')) {
                    document.getElementById('contactEmail').value = data.contactEmail || '';
                }
                
                if (document.getElementById('contactPhone')) {
                    document.getElementById('contactPhone').value = data.contactPhone || '';
                }
                
                if (document.getElementById('contactAddress')) {
                    document.getElementById('contactAddress').value = data.contactAddress || '';
                }
                
                // Fill in compliance information
                if (data.compliance && data.compliance.length) {
                    data.compliance.forEach(comp => {
                        const checkbox = document.querySelector(`[name="compliance"][value="${comp}"]`);
                        if (checkbox) checkbox.checked = true;
                        
                        // Handle other compliance details
                        if (comp === 'other' && document.getElementById('otherComplianceDetails')) {
                            otherComplianceDetails.classList.remove('d-none');
                            document.getElementById('otherComplianceDetails').value = data.otherComplianceDetails || '';
                        }
                    });
                }
                
                // Set effective date
                if (data.effectiveDate && document.getElementById('effectiveDate')) {
                    document.getElementById('effectiveDate').value = data.effectiveDate;
                }
                
                // Update progress bar after loading saved data
                setTimeout(updateProgress, 500);
                
                console.log('Successfully loaded saved form data');
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
                        // Show success animation
                        copyBtn.classList.add('btn-success');
                        copyBtn.innerHTML = '<i class="fas fa-check me-1"></i> Copied!';
                        
                        setTimeout(() => {
                            copyBtn.classList.remove('btn-success');
                            copyBtn.innerHTML = '<i class="fas fa-copy me-1"></i> Copy Text';
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Failed to copy text: ', err);
                        showValidationError('Failed to copy policy text. Please try again.');
                    });
            }
        });
    }

    // Handle PDF download button click
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', function() {
            const policyElement = document.querySelector('.generated-policy');
            const websiteName = document.getElementById('websiteName').value || 'Website';
            const fileName = `${websiteName.replace(/\s+/g, '-').toLowerCase()}-privacy-policy.pdf`;
            
            if (policyElement) {
                // Show loading state
                const originalHtml = downloadPdfBtn.innerHTML;
                downloadPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Creating PDF...';
                downloadPdfBtn.disabled = true;
                
                setTimeout(() => {
                    try {
                        // Fix for jsPDF initialization
                        if (typeof window.jspdf !== 'undefined') {
                            const { jsPDF } = window.jspdf;
                            createAndDownloadPDF(jsPDF);
                        } else if (typeof jspdf !== 'undefined') {
                            // Try global jspdf variable
                            const { jsPDF } = jspdf;
                            createAndDownloadPDF(jsPDF);
                        } else {
                            console.error('jsPDF library not found');
                            showValidationError('PDF library not loaded. Please try again or refresh the page.');
                            downloadPdfBtn.innerHTML = originalHtml;
                            downloadPdfBtn.disabled = false;
                        }
                        
                    } catch (error) {
                        console.error('Failed to generate PDF:', error);
                        downloadPdfBtn.innerHTML = originalHtml;
                        downloadPdfBtn.disabled = false;
                        showValidationError('Failed to generate PDF. Please try again.');
                    }
                }, 300);
                
                // Function to create and download the PDF
                function createAndDownloadPDF(jsPDFClass) {
                    const doc = new jsPDFClass({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4',
                    });
                    
                    // Get plain text version of the policy
                    const policyText = policyElement.innerText;
                    
                    // Set up the PDF with reasonable margins
                    const pageWidth = doc.internal.pageSize.width;
                    const pageHeight = doc.internal.pageSize.height;
                    const margin = 15; // standard margins
                    
                    // Add title
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(18); // larger title font for better readability
                    doc.setTextColor(16, 185, 129); // Use accent green color
                    doc.text(`${websiteName}: Privacy Policy`, margin, margin + 5);
                    
                    // Add effective date
                    const effectiveDate = document.getElementById('effectiveDate')?.value || 
                                        new Date().toISOString().split('T')[0];
                    doc.setFont("helvetica", "italic");
                    doc.setFontSize(10);
                    doc.setTextColor(100, 100, 100); // Gray
                    doc.text(`Effective Date: ${effectiveDate}`, margin, margin + 12);
                    
                    // Add content with readable font size
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(10); // more readable font size
                    doc.setTextColor(20, 20, 20); // Black color
                    
                    // Calculate the maximum height for content on page 1
                    const titleHeight = 20; // space taken by the title section
                    const footerHeight = 10; // space for footer
                    const contentHeight = pageHeight - titleHeight - footerHeight - (2 * margin);
                    
                    // Split the text into lines that fit within the PDF page width
                    const contentWidth = pageWidth - (2 * margin);
                    const splitText = doc.splitTextToSize(policyText, contentWidth);
                    
                    // Calculate lines per page with standard line height
                    const lineHeight = 4.5; // standard line height in mm
                    const maxLinesPerPage = Math.floor(contentHeight / lineHeight);
                    
                    // First page content
                    const firstPageLines = splitText.slice(0, maxLinesPerPage);
                    doc.text(firstPageLines, margin, margin + titleHeight);
                    
                    // Check if we need a second page
                    if (splitText.length > maxLinesPerPage) {
                        // Add second page
                        doc.addPage();
                        
                        // Add a small header on the second page
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(12);
                        doc.setTextColor(16, 185, 129);
                        doc.text(`${websiteName}: Privacy Policy (Continued)`, margin, margin + 5);
                        
                        // Continue with the rest of the content on page 2
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(10);
                        doc.setTextColor(20, 20, 20);
                        
                        const secondPageLines = splitText.slice(maxLinesPerPage);
                        doc.text(secondPageLines, margin, margin + 15);
                    }
                    
                    // Add footer with website URL and page numbers
                    const websiteUrl = document.getElementById('websiteUrl')?.value || '';
                    const pageCount = doc.internal.getNumberOfPages();
                    
                    // Add footer on each page
                    for (let i = 1; i <= pageCount; i++) {
                        doc.setPage(i);
                        doc.setFont("helvetica", "italic");
                        doc.setFontSize(8);
                        doc.setTextColor(100, 100, 100);
                        
                        if (websiteUrl) {
                            doc.text(websiteUrl, margin, pageHeight - margin);
                        }
                        
                        // Add page numbers
                        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 25, pageHeight - margin);
                    }
                    
                    // Save the PDF
                    doc.save(fileName);
                    
                    // Show success state
                    downloadPdfBtn.innerHTML = '<i class="fas fa-check me-1"></i> PDF Created!';
                    setTimeout(() => {
                        downloadPdfBtn.innerHTML = originalHtml;
                        downloadPdfBtn.disabled = false;
                    }, 2000);
                }
            } else {
                showValidationError('Please generate a privacy policy first before downloading as PDF.');
            }
        });
    }

    // Handle text download button click
    if (downloadTxtBtn) {
        downloadTxtBtn.addEventListener('click', function() {
            const policyText = document.querySelector('.generated-policy')?.innerText;
            const websiteName = document.getElementById('websiteName').value || 'Website';
            const fileName = `${websiteName.replace(/\s+/g, '-').toLowerCase()}-privacy-policy.txt`;
            
            if (policyText) {
                // Show loading state
                const originalHtml = downloadTxtBtn.innerHTML;
                downloadTxtBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Creating TXT...';
                downloadTxtBtn.disabled = true;
                
                setTimeout(() => {
                    try {
                        // Add header info to the text file
                        const effectiveDate = document.getElementById('effectiveDate')?.value || 
                                            new Date().toISOString().split('T')[0];
                        const websiteUrl = document.getElementById('websiteUrl')?.value || '';
                        
                        let fullText = `${websiteName.toUpperCase()}: PRIVACY POLICY\n`;
                        fullText += `Effective Date: ${effectiveDate}\n`;
                        if (websiteUrl) fullText += `Website: ${websiteUrl}\n`;
                        fullText += `\n${'='.repeat(60)}\n\n`;
                        fullText += policyText;
                        
                        // Create a blob with the text content
                        const blob = new Blob([fullText], { type: 'text/plain' });
                        
                        // Create a temporary download link
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = fileName;
                        
                        // Append to the document, click it, and then remove it
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        // Show success state
                        downloadTxtBtn.innerHTML = '<i class="fas fa-check me-1"></i> TXT Created!';
                        setTimeout(() => {
                            downloadTxtBtn.innerHTML = originalHtml;
                            downloadTxtBtn.disabled = false;
                        }, 2000);
                        
                    } catch (error) {
                        console.error('Failed to generate TXT:', error);
                        downloadTxtBtn.innerHTML = originalHtml;
                        downloadTxtBtn.disabled = false;
                        showValidationError('Failed to download text file. Please try again.');
                    }
                }, 300);
            }
        });
    }

    // Adjust the layout on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth < 992) {
            // Mobile view: disable fixed positioning for result container
            document.querySelector('.sticky-top')?.classList.add('position-relative');
        } else {
            // Desktop view: enable fixed positioning for result container
            document.querySelector('.sticky-top')?.classList.remove('position-relative');
        }
    });

    // Initialize layout based on current window size
    if (window.innerWidth < 992) {
        document.querySelector('.sticky-top')?.classList.add('position-relative');
    }
});