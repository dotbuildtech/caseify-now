const PAYU_FORM_FIELDS = [
    'key', 'txnid', 'amount', 'productinfo', 'firstname', 'email', 'phone',
    'surl', 'furl', 'hash',
    'udf1', 'udf2', 'udf3', 'udf4', 'udf5', 'udf6', 'udf7', 'udf8', 'udf9', 'udf10'
];

export const PAYU_RESPONSE_FIELDS = [
    'key', 'txnid', 'amount', 'productinfo', 'firstname', 'email',
    'udf1', 'udf2', 'udf3', 'udf4', 'udf5', 'udf6', 'udf7', 'udf8', 'udf9', 'udf10',
    'status', 'mihpayid', 'hash', 'error', 'error_message', 'mode', 'bank_ref_num',
    'unmappedstatus', 'payuMoneyId', 'net_amount_debit'
];

// Dynamically builds and submits the PayU redirect form.
// The hash is generated server-side; the salt never reaches the browser.
export const submitPayuForm = (params) => {
    if (typeof document === 'undefined') return;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = params.payuUrl;
    form.style.display = 'none';
    for (const field of PAYU_FORM_FIELDS) {
        const value = params[field];
        if (value == null) continue;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = field;
        input.value = String(value);
        form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
};

// Collects the gateway response fields PayU echoes back to the redirect URLs
export const collectPayuResponse = (searchParams) => {
    const out = {};
    for (const field of PAYU_RESPONSE_FIELDS) {
        const value = searchParams.get(field);
        if (value != null) out[field] = value;
    }
    return out;
};
