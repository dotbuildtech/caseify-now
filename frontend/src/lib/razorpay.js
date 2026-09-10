/**
 * Dynamically loads the official Razorpay Checkout SDK script.
 */
export const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') {
            return resolve(false);
        }
        if (window.Razorpay) {
            return resolve(true);
        }
        const existingScript = document.getElementById('razorpay-checkout-script');
        if (existingScript) {
            existingScript.onload = () => resolve(true);
            existingScript.onerror = () => resolve(false);
            return;
        }
        const script = document.createElement('script');
        script.id = 'razorpay-checkout-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

/**
 * Opens the Razorpay payment modal with tailored options.
 */
export const openRazorpayModal = async ({
    keyId,
    orderId,
    amount,
    currency = 'INR',
    name = 'Caseify Now',
    description = 'Custom Phone Case Purchase',
    prefill = {},
    themeColor = '#111827',
    onSuccess,
    onFailure,
    onDismiss
}) => {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded || !window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
    }

    const options = {
        key: keyId,
        amount,
        currency,
        name,
        description,
        order_id: orderId,
        prefill: {
            name: prefill.name || '',
            email: prefill.email || '',
            contact: prefill.contact || ''
        },
        theme: {
            color: themeColor
        },
        handler: function (response) {
            if (typeof onSuccess === 'function') {
                onSuccess({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                });
            }
        },
        modal: {
            ondismiss: function () {
                if (typeof onDismiss === 'function') {
                    onDismiss();
                }
            },
            escape: true,
            backdropclose: false
        }
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', function (response) {
        if (typeof onFailure === 'function') {
            onFailure(response.error);
        }
    });

    rzp.open();
    return rzp;
};
