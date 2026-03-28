// ========== Donation Page JavaScript ==========

document.addEventListener('DOMContentLoaded', function() {
    const donationForm = document.getElementById('donationForm');
    const amountInput = document.getElementById('amount');
    const categorySelect = document.getElementById('category');
    const summaryCategory = document.getElementById('summaryCategory');
    const summaryAmount = document.getElementById('summaryAmount');
    const summaryTotal = document.getElementById('summaryTotal');
    const upiModal = document.getElementById('upiModal');
    const thankYouModal = document.getElementById('thankYouModal');
    
    let selectedAmount = 0;
    let selectedPaymentMethod = 'razorpay';
    
    // Amount button selection
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const amount = this.getAttribute('data-amount');
            if (amount) {
                amountInput.value = amount;
                selectedAmount = parseInt(amount);
                updateSummary();
            }
        });
    });
    
    // Amount input change
    amountInput.addEventListener('input', function() {
        document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
        selectedAmount = parseInt(this.value) || 0;
        updateSummary();
    });
    
    // Category change
    categorySelect.addEventListener('change', updateSummary);
    
    // Payment method selection
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', function() {
            selectedPaymentMethod = this.value;
        });
    });
    
    // Update summary
    function updateSummary() {
        const category = categorySelect.value || '-';
        summaryCategory.textContent = category;
        summaryAmount.textContent = AppUtils.formatCurrency(selectedAmount);
        summaryTotal.textContent = AppUtils.formatCurrency(selectedAmount);
    }
    
    // Form submission
    donationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        const formData = getFormData();
        
        if (selectedPaymentMethod === 'razorpay') {
            await processRazorpayPayment(formData);
        } else {
            showUPIModal(formData);
        }
    });
    
    // Validate form
    function validateForm() {
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const category = categorySelect.value;
        const amount = parseInt(amountInput.value);
        const pan = document.getElementById('pan').value.trim();
        
        if (!fullName) {
            AppUtils.showToast('Please enter your full name', 'error');
            return false;
        }
        
        if (!email || !AppUtils.validateEmail(email)) {
            AppUtils.showToast('Please enter a valid email address', 'error');
            return false;
        }
        
        if (!phone || !AppUtils.validatePhone(phone)) {
            AppUtils.showToast('Please enter a valid 10-digit phone number', 'error');
            return false;
        }
        
        if (!category) {
            AppUtils.showToast('Please select a donation category', 'error');
            return false;
        }
        
        if (!amount || amount < 1) {
            AppUtils.showToast('Please enter a valid donation amount', 'error');
            return false;
        }
        
        if (pan && !AppUtils.validatePAN(pan.toUpperCase())) {
            AppUtils.showToast('Please enter a valid PAN number (e.g., ABCDE1234F)', 'error');
            return false;
        }
        
        return true;
    }
    
    // Get form data
    function getFormData() {
        return {
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            pan: document.getElementById('pan').value.trim().toUpperCase(),
            address: document.getElementById('address').value.trim(),
            category: categorySelect.value,
            amount: parseInt(amountInput.value),
            dedication: document.getElementById('dedication').value.trim(),
            paymentMethod: selectedPaymentMethod
        };
    }
    
    // Process Razorpay payment
    async function processRazorpayPayment(formData) {
        try {
            AppUtils.showLoading();
            
            // Create order
            const orderResponse = await AppUtils.API.post('/api/donations/create-order', formData);
            
            AppUtils.hideLoading();
            
            // Razorpay options
            const options = {
                key: orderResponse.razorpayKeyId,
                amount: orderResponse.amount,
                currency: 'INR',
                name: 'Shri Shyam Mandir',
                description: formData.category,
                order_id: orderResponse.orderId,
                prefill: {
                    name: formData.fullName,
                    email: formData.email,
                    contact: formData.phone
                },
                theme: {
                    color: '#FF6600'
                },
                handler: async function(response) {
                    await verifyPayment(response, orderResponse.donationId);
                },
                modal: {
                    ondismiss: function() {
                        AppUtils.showToast('Payment cancelled', 'error');
                    }
                }
            };
            
            const rzp = new Razorpay(options);
            rzp.open();
            
        } catch (error) {
            AppUtils.hideLoading();
            AppUtils.showToast(error.message || 'Failed to initiate payment', 'error');
        }
    }
    
    // Verify Razorpay payment
    async function verifyPayment(paymentResponse, donationId) {
        try {
            AppUtils.showLoading();
            
            const verifyResponse = await AppUtils.API.post('/api/donations/verify-payment', {
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature,
                donationId: donationId
            });
            
            AppUtils.hideLoading();
            
            if (verifyResponse.success) {
                showThankYou(verifyResponse.donation);
            } else {
                AppUtils.showToast('Payment verification failed', 'error');
            }
            
        } catch (error) {
            AppUtils.hideLoading();
            AppUtils.showToast(error.message || 'Payment verification failed', 'error');
        }
    }
    
    // Show UPI modal
    function showUPIModal(formData) {
        const upiId = 'shrishyammandir@ybl'; // Will be fetched from env
        const amount = formData.amount;
        const trustName = 'Shri Shyam Mandir';
        
        // Generate UPI string
        const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(trustName)}&am=${amount}&cu=INR`;
        
        // Generate QR code
        const qrCanvas = document.getElementById('qrCode');
        QRCode.toCanvas(qrCanvas, upiString, {
            width: 250,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        
        // Update amount display
        document.getElementById('upiAmount').textContent = AppUtils.formatCurrency(amount);
        document.getElementById('upiIdDisplay').value = upiId;
        
        // Show modal
        upiModal.classList.add('show');
        
        // Save pending donation
        savePendingDonation(formData);
    }
    
    // Save pending UPI donation
    async function savePendingDonation(formData) {
        try {
            await AppUtils.API.post('/api/donations/upi-pending', formData);
        } catch (error) {
            console.error('Error saving pending donation:', error);
        }
    }
    
    // UPI modal controls
    document.getElementById('modalClose')?.addEventListener('click', () => {
        upiModal.classList.remove('show');
    });
    
    document.getElementById('modalOverlay')?.addEventListener('click', () => {
        upiModal.classList.remove('show');
    });
    
    // Copy UPI ID
    document.getElementById('copyUpiBtn')?.addEventListener('click', function() {
        const upiIdInput = document.getElementById('upiIdDisplay');
        upiIdInput.select();
        document.execCommand('copy');
        AppUtils.showToast('UPI ID copied to clipboard', 'success');
    });
    
    // UPI app deep links
    const upiId = 'shrishyammandir@ybl';
    const amount = selectedAmount;
    const trustName = 'Shri Shyam Mandir';
    
    document.getElementById('gpayBtn')?.addEventListener('click', () => {
        const gpayUrl = `tez://upi/pay?pa=${upiId}&pn=${encodeURIComponent(trustName)}&am=${amount}&cu=INR`;
        window.location.href = gpayUrl;
    });
    
    document.getElementById('phonepeBtn')?.addEventListener('click', () => {
        const phonepeUrl = `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(trustName)}&am=${amount}&cu=INR`;
        window.location.href = phonepeUrl;
    });
    
    document.getElementById('paytmBtn')?.addEventListener('click', () => {
        const paytmUrl = `paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(trustName)}&am=${amount}&cu=INR`;
        window.location.href = paytmUrl;
    });
    
    document.getElementById('upiDoneBtn')?.addEventListener('click', () => {
        upiModal.classList.remove('show');
        AppUtils.showToast('Thank you! We will verify your payment and send you a receipt shortly.', 'success');
        donationForm.reset();
        updateSummary();
    });
    
    // Show thank you modal
    function showThankYou(donation) {
        document.getElementById('receiptNumber').textContent = donation.receiptNumber || '-';
        document.getElementById('txAmount').textContent = AppUtils.formatCurrency(donation.amount);
        document.getElementById('txDate').textContent = AppUtils.formatDate(donation.createdAt);
        document.getElementById('paymentId').textContent = donation.razorpayPaymentId || '-';
        
        thankYouModal.classList.add('show');
        
        // Reset form
        donationForm.reset();
        updateSummary();
    }
    
    // Download receipt
    document.getElementById('downloadReceiptBtn')?.addEventListener('click', async function() {
        const receiptNumber = document.getElementById('receiptNumber').textContent;
        try {
            window.open(`${API_BASE_URL}/api/donations/receipt/${receiptNumber}`, '_blank');
        } catch (error) {
            AppUtils.showToast('Error downloading receipt', 'error');
        }
    });
});

// Quick donate widget on homepage
document.addEventListener('DOMContentLoaded', function() {
    const quickDonateBtn = document.getElementById('quickDonateBtn');
    const customAmountBtn = document.getElementById('customAmountBtn');
    const customAmountInput = document.getElementById('customAmountInput');
    
    let selectedQuickAmount = 101;
    
    if (quickDonateBtn) {
        // Amount selection
        document.querySelectorAll('.quick-donate .amount-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.quick-donate .amount-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const amount = this.getAttribute('data-amount');
                if (amount) {
                    selectedQuickAmount = parseInt(amount);
                    customAmountInput.style.display = 'none';
                }
            });
        });
        
        // Custom amount
        customAmountBtn?.addEventListener('click', function() {
            document.querySelectorAll('.quick-donate .amount-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            customAmountInput.style.display = 'block';
            document.getElementById('customAmount').focus();
        });
        
        document.getElementById('customAmount')?.addEventListener('input', function() {
            selectedQuickAmount = parseInt(this.value) || 0;
        });
        
        // Quick donate button
        quickDonateBtn.addEventListener('click', function() {
            if (selectedQuickAmount > 0) {
                window.location.href = `/TempleTrust-frontend/donate.html?amount=${selectedQuickAmount}`;
            } else {
                AppUtils.showToast('Please select or enter an amount', 'error');
            }
        });
    }
    
    // Pre-fill amount from URL
    const urlParams = new URLSearchParams(window.location.search);
    const prefilAmount = urlParams.get('amount');
    if (prefilAmount && document.getElementById('amount')) {
        document.getElementById('amount').value = prefilAmount;
        selectedAmount = parseInt(prefilAmount);
        document.getElementById('summaryAmount').textContent = AppUtils.formatCurrency(selectedAmount);
        document.getElementById('summaryTotal').textContent = AppUtils.formatCurrency(selectedAmount);
    }
});
