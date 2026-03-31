// ========== Donation Page JavaScript ==========

document.addEventListener('DOMContentLoaded', function() {
    const donationForm = document.getElementById('donationForm');
    
    let selectedPaymentMethod = 'razorpay';
    
    // Payment method selection
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', function() {
            selectedPaymentMethod = this.value;
        });
    });
    
    // Form submission
    donationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Open payment page
        window.open('https://razorpay.me/@shrishyammandirsewasamiti', '_blank');
        AppUtils.showToast('Redirecting to payment page...', 'success');
    });
    
    // Validate form
    function validateForm() {
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        
        if (!fullName) {
            AppUtils.showToast('Please enter your full name', 'error');
            return false;
        }
        
        if (!email || !AppUtils.validateEmail(email)) {
            AppUtils.showToast('Please enter a valid email address', 'error');
            return false;
        }
        
        return true;
    }
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
                window.location.href = `/donate.html?amount=${selectedQuickAmount}`;
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
    }
});
