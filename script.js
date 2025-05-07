document.addEventListener('DOMContentLoaded', function() {
    // Input sanitization functions
    function sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        // Basic sanitization to prevent HTML/script injection
        return input.replace(/[<>]/g, '');
    }

    function sanitizeNumericInput(input) {
        if (typeof input !== 'string') return input;
        // Only allow digits
        return input.replace(/[^0-9]/g, '');
    }
    
    function sanitizeAlphanumericInput(input) {
        if (typeof input !== 'string') return input;
        // Only allow alphanumeric characters, spaces and basic punctuation
        return input.replace(/[^a-zA-Z0-9\s.,;:_\-]/g, '');
    }

    // Add sanitization to all input fields
    const allInputs = document.querySelectorAll('input[type="text"], input[type="url"], input[type="email"], textarea');
    allInputs.forEach(input => {
        input.addEventListener('change', function() {
            this.value = sanitizeInput(this.value);
        });
    });

    // Specifically sanitize numeric fields
    const numericInputs = document.querySelectorAll('input[type="tel"], input[pattern*="[0-9]"]');
    numericInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (input.id === 'contactPhone') {
                this.value = sanitizeNumericInput(this.value);
            }
        });
    });
    
    // Add alphanumeric sanitization to specific fields
    const alphaNumericInputs = document.querySelectorAll('#storageDetails, #otherComplianceDetails');
    alphaNumericInputs.forEach(input => {
        input.addEventListener('change', function() {
            this.value = sanitizeAlphanumericInput(this.value);
        });
    });

    const form = document.getElementById('policyForm');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const downloadTxtBtn = document.getElementById('downloadTxtBtn');
    const actionButtons = document.getElementById('actionButtons');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContainer = document.getElementById('resultContainer');
    const formProgress = document.getElementById('formProgress');
    const dataStorage = document.getElementById('dataStorage');
    const storageDetails = document.querySelector('.storage-details');
    const thirdPartySharing = document.getElementById('thirdPartySharing');
    const thirdPartyDetails = document.querySelector('.third-party-details');
    const otherCompliance = document.getElementById('otherCompliance');
    const otherComplianceDetails = document.querySelector('.other-compliance-details');

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

    const formElements = form.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
        element.addEventListener('change', updateProgress);
        element.addEventListener('input', updateProgress);
    });

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
        
        const filledProgress = (filledFields / totalFields) * 70;
        const checkboxProgress = (Math.min(checkedBoxes, totalCheckboxGroups) / totalCheckboxGroups) * 30;
        
        const totalProgress = Math.min(100, Math.floor(filledProgress + checkboxProgress));
        
        formProgress.style.width = `${totalProgress}%`;
        formProgress.setAttribute('aria-valuenow', totalProgress);
    }

    setTimeout(updateProgress, 500);

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        let valid = true;
        
        const dataCheckboxes = document.querySelectorAll('[name="dataCollected"]');
        const atLeastOneChecked = Array.from(dataCheckboxes).some(checkbox => checkbox.checked);
        
        if (!atLeastOneChecked) {
            valid = false;
            const firstCheckbox = dataCheckboxes[0].closest('.card');
            showValidationError("Please select at least one type of data that you collect.");
            smoothScrollTo(firstCheckbox);
        }
        
        form.classList.add('was-validated');
        
        if (!form.checkValidity() || !valid) {
            const firstInvalid = form.querySelector(':invalid');
            if (firstInvalid) {
                showValidationError("Please fill in all required fields.");
                smoothScrollTo(firstInvalid);
            }
            e.stopPropagation();
            return;
        }
        
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
            
            setTimeout(processForm, 500);
        }, 300);
        
        async function processForm() {
            // Sanitize all form data before submission
            const formData = {
                websiteName: sanitizeInput(document.getElementById('websiteName').value),
                websiteUrl: sanitizeInput(document.getElementById('websiteUrl')?.value || ''),
                businessType: sanitizeInput(document.getElementById('businessType')?.value || 'business'),
                dataCollected: getCheckedValues('dataCollected').map(sanitizeInput),
                otherDataCollected: sanitizeInput(document.getElementById('otherDataCollected')?.value || ''),
                dataUsage: sanitizeInput(document.getElementById('dataUsage').value),
                dataStorage: sanitizeInput(document.getElementById('dataStorage')?.value || 'service-duration'),
                storageDetails: sanitizeAlphanumericInput(document.getElementById('storageDetails')?.value || ''),
                thirdPartySharing: sanitizeInput(document.getElementById('thirdPartySharing').value),
                thirdPartyDetails: sanitizeInput(document.getElementById('thirdPartyDetails')?.value || ''),
                internationalTransfers: sanitizeInput(document.getElementById('internationalTransfers')?.value || 'no'),
                userRights: getCheckedValues('userRights').map(sanitizeInput),
                contactEmail: sanitizeInput(document.getElementById('contactEmail').value),
                contactPhone: sanitizeNumericInput(document.getElementById('contactPhone')?.value || ''),
                contactAddress: sanitizeInput(document.getElementById('contactAddress')?.value || ''),
                compliance: getCheckedValues('compliance').map(sanitizeInput),
                otherComplianceDetails: sanitizeAlphanumericInput(document.getElementById('otherComplianceDetails')?.value || ''),
                effectiveDate: sanitizeInput(document.getElementById('effectiveDate')?.value || new Date().toISOString().split('T')[0])
            };
            
            try {
                const response = await fetch('/api/gemini', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                loadingIndicator.classList.add('d-none');

                if (response.ok) {
                    const result = await response.json();
                    
                    resultContainer.innerHTML = `
                        <div class="success-indicator">Policy Generated Successfully</div>
                        <div class="generated-policy">${formatPolicyText(result.text)}</div>
                    `;
                    resultContainer.classList.add('result-fade-in');
                    
                    setTimeout(() => {
                        actionButtons.classList.remove('d-none');
                        actionButtons.classList.add('buttons-fade-in');
                        copyBtn.disabled = false;
                        downloadPdfBtn.disabled = false;
                        downloadTxtBtn.disabled = false;
                    }, 400);
                    
                    saveFormData(formData);
                } else {
                    let errorText = 'An error occurred while generating the privacy policy.';
                    try {
                        const errorResult = await response.text();
                        if (errorResult && response.headers.get('content-type')?.includes('application/json')) {
                            const jsonError = JSON.parse(errorResult);
                            errorText = jsonError.error || errorResult;
                        } else if (errorResult) {
                            errorText = errorResult;
                        } else {
                            errorText = `Server responded with status ${response.status}`;
                        }
                    } catch (parseError) {
                        console.error("Could not parse error response:", parseError);
                        errorText = `Server responded with status ${response.status}. Unable to parse error details.`;
                    }

                    resultContainer.innerHTML = `
                        <div class="error-message">
                            <p><i class="fas fa-exclamation-triangle me-2"></i>${errorText}</p>
                        </div>
                    `;
                    resultContainer.classList.add('result-fade-in');
                }
            } catch (error) {
                console.error('Error:', error);
                
                loadingIndicator.classList.add('d-none');
                
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
                generateBtn.disabled = false;
                
                if (window.innerWidth < 992) {
                    smoothScrollTo(resultContainer);
                }
            }
        }
    });
    
    function smoothScrollTo(element) {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const offset = 100;
        const targetPosition = window.pageYOffset + rect.top - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
    
    function showValidationError(message) {
        generateBtn.classList.add('btn-shake');
        setTimeout(() => {
            generateBtn.classList.remove('btn-shake');
        }, 600);
    }
    
    function getCheckedValues(name) {
        const checkboxes = document.querySelectorAll(`[name="${name}"]`);
        return Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
    }
    
    function formatPolicyText(text) {
        if (!text) return '';
        
        let formatted = text.replace(/\n/g, '<br>');
        
        formatted = formatted.replace(/#{1,6}\s+(.*?)(?:<br>)/g, (match, heading) => {
            const level = match.indexOf(' ');
            return `<h${level} class="mt-4 mb-3">${heading}</h${level}><br>`;
        });
        
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        formatted = formatted.replace(/^- (.*?)(?:<br>)/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
        
        return formatted;
    }
    
    function saveFormData(data) {
        try {
            localStorage.setItem('policyFormData', JSON.stringify(data));
        } catch (error) {
            console.warn('Could not save form data to localStorage:', error);
        }
    }
    
    function loadSavedFormData() {
        try {
            const savedData = localStorage.getItem('policyFormData');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                document.getElementById('websiteName').value = data.websiteName || '';
                if (document.getElementById('websiteUrl')) {
                    document.getElementById('websiteUrl').value = data.websiteUrl || '';
                }
                
                if (data.businessType && document.getElementById('businessType')) {
                    document.getElementById('businessType').value = data.businessType;
                }
                
                if (data.dataCollected && data.dataCollected.length) {
                    data.dataCollected.forEach(type => {
                        const checkbox = document.querySelector(`[name="dataCollected"][value="${type}"]`);
                        if (checkbox) checkbox.checked = true;
                    });
                }
                
                if (document.getElementById('otherDataCollected')) {
                    document.getElementById('otherDataCollected').value = data.otherDataCollected || '';
                }
                
                if (document.getElementById('dataUsage')) {
                    document.getElementById('dataUsage').value = data.dataUsage || '';
                }
                
                if (data.dataStorage && document.getElementById('dataStorage')) {
                    document.getElementById('dataStorage').value = data.dataStorage;
                    if (data.dataStorage === 'limited-time' && document.getElementById('storageDetails')) {
                        storageDetails.classList.remove('d-none');
                        document.getElementById('storageDetails').value = data.storageDetails || '';
                    }
                }
                
                if (data.thirdPartySharing && document.getElementById('thirdPartySharing')) {
                    document.getElementById('thirdPartySharing').value = data.thirdPartySharing;
                    if (['partners', 'advertisers', 'affiliates', 'extensive'].includes(data.thirdPartySharing) && 
                        document.getElementById('thirdPartyDetails')) {
                        thirdPartyDetails.classList.remove('d-none');
                        document.getElementById('thirdPartyDetails').value = data.thirdPartyDetails || '';
                    }
                }
                
                if (data.internationalTransfers && document.getElementById('internationalTransfers')) {
                    document.getElementById('internationalTransfers').value = data.internationalTransfers;
                }
                
                if (data.userRights && data.userRights.length) {
                    data.userRights.forEach(right => {
                        const checkbox = document.querySelector(`[name="userRights"][value="${right}"]`);
                        if (checkbox) checkbox.checked = true;
                    });
                }
                
                if (document.getElementById('contactEmail')) {
                    document.getElementById('contactEmail').value = data.contactEmail || '';
                }
                
                if (document.getElementById('contactPhone')) {
                    document.getElementById('contactPhone').value = data.contactPhone || '';
                }
                
                if (document.getElementById('contactAddress')) {
                    document.getElementById('contactAddress').value = data.contactAddress || '';
                }
                
                if (data.compliance && data.compliance.length) {
                    data.compliance.forEach(comp => {
                        const checkbox = document.querySelector(`[name="compliance"][value="${comp}"]`);
                        if (checkbox) checkbox.checked = true;
                        
                        if (comp === 'other' && document.getElementById('otherComplianceDetails')) {
                            otherComplianceDetails.classList.remove('d-none');
                            document.getElementById('otherComplianceDetails').value = data.otherComplianceDetails || '';
                        }
                    });
                }
                
                if (data.effectiveDate && document.getElementById('effectiveDate')) {
                    document.getElementById('effectiveDate').value = data.effectiveDate;
                }
                
                setTimeout(updateProgress, 500);
                
                console.log('Successfully loaded saved form data');
            }
        } catch (error) {
            console.warn('Could not load saved form data:', error);
        }
    }
    
    loadSavedFormData();
    
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const policyText = document.querySelector('.generated-policy')?.innerText;
            
            if (policyText) {
                navigator.clipboard.writeText(policyText)
                    .then(() => {
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

    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', function() {
            const policyElement = document.querySelector('.generated-policy');
            const websiteName = document.getElementById('websiteName').value || 'Website';
            const fileName = `${websiteName.replace(/\s+/g, '-').toLowerCase()}-privacy-policy.pdf`;
            
            if (policyElement) {
                const originalHtml = downloadPdfBtn.innerHTML;
                downloadPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Creating PDF...';
                downloadPdfBtn.disabled = true;
                
                setTimeout(() => {
                    try {
                        if (typeof window.jspdf !== 'undefined') {
                            const { jsPDF } = window.jspdf;
                            createAndDownloadPDF(jsPDF);
                        } else if (typeof jspdf !== 'undefined') {
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
                
                function createAndDownloadPDF(jsPDFClass) {
                    const doc = new jsPDFClass({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4',
                    });
                    
                    const policyText = policyElement.innerText;
                    
                    const pageWidth = doc.internal.pageSize.width;
                    const pageHeight = doc.internal.pageSize.height;
                    const margin = 15;
                    
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(18);
                    doc.setTextColor(16, 185, 129);
                    doc.text(`${websiteName}: Privacy Policy`, margin, margin + 5);
                    
                    const effectiveDate = document.getElementById('effectiveDate')?.value || 
                                        new Date().toISOString().split('T')[0];
                    doc.setFont("helvetica", "italic");
                    doc.setFontSize(10);
                    doc.setTextColor(100, 100, 100);
                    doc.text(`Effective Date: ${effectiveDate}`, margin, margin + 12);
                    
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(10);
                    doc.setTextColor(20, 20, 20);
                    
                    const titleHeight = 20;
                    const footerHeight = 10;
                    const contentHeight = pageHeight - titleHeight - footerHeight - (2 * margin);
                    
                    const contentWidth = pageWidth - (2 * margin);
                    const splitText = doc.splitTextToSize(policyText, contentWidth);
                    
                    const lineHeight = 4.5;
                    const maxLinesPerPage = Math.floor(contentHeight / lineHeight);
                    
                    const firstPageLines = splitText.slice(0, maxLinesPerPage);
                    doc.text(firstPageLines, margin, margin + titleHeight);
                    
                    if (splitText.length > maxLinesPerPage) {
                        doc.addPage();
                        
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(12);
                        doc.setTextColor(16, 185, 129);
                        doc.text(`${websiteName}: Privacy Policy (Continued)`, margin, margin + 5);
                        
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(10);
                        doc.setTextColor(20, 20, 20);
                        
                        const secondPageLines = splitText.slice(maxLinesPerPage);
                        doc.text(secondPageLines, margin, margin + 15);
                    }
                    
                    const websiteUrl = document.getElementById('websiteUrl')?.value || '';
                    const pageCount = doc.internal.getNumberOfPages();
                    
                    for (let i = 1; i <= pageCount; i++) {
                        doc.setPage(i);
                        doc.setFont("helvetica", "italic");
                        doc.setFontSize(8);
                        doc.setTextColor(100, 100, 100);
                        
                        if (websiteUrl) {
                            doc.text(websiteUrl, margin, pageHeight - margin);
                        }
                        
                        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 25, pageHeight - margin);
                    }
                    
                    doc.save(fileName);
                    
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

    if (downloadTxtBtn) {
        downloadTxtBtn.addEventListener('click', function() {
            const policyText = document.querySelector('.generated-policy')?.innerText;
            const websiteName = document.getElementById('websiteName').value || 'Website';
            const fileName = `${websiteName.replace(/\s+/g, '-').toLowerCase()}-privacy-policy.txt`;
            
            if (policyText) {
                const originalHtml = downloadTxtBtn.innerHTML;
                downloadTxtBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Creating TXT...';
                downloadTxtBtn.disabled = true;
                
                setTimeout(() => {
                    try {
                        const effectiveDate = document.getElementById('effectiveDate')?.value || 
                                            new Date().toISOString().split('T')[0];
                        const websiteUrl = document.getElementById('websiteUrl')?.value || '';
                        
                        let fullText = `${websiteName.toUpperCase()}: PRIVACY POLICY\n`;
                        fullText += `Effective Date: ${effectiveDate}\n`;
                        if (websiteUrl) fullText += `Website: ${websiteUrl}\n`;
                        fullText += `\n${'='.repeat(60)}\n\n`;
                        fullText += policyText;
                        
                        const blob = new Blob([fullText], { type: 'text/plain' });
                        
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = fileName;
                        
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
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

    window.addEventListener('resize', function() {
        if (window.innerWidth < 992) {
            document.querySelector('.sticky-top')?.classList.add('position-relative');
        } else {
            document.querySelector('.sticky-top')?.classList.remove('position-relative');
        }
    });

    if (window.innerWidth < 992) {
        document.querySelector('.sticky-top')?.classList.add('position-relative');
    }
});