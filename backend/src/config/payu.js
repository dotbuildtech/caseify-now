const isPlaceholder = (val) => !val || /your_|placeholder|changeme/i.test(String(val));

const config = {
    key: process.env.PAYU_MERCHANT_KEY || '',
    salt: process.env.PAYU_SALT || '',
    mode: process.env.PAYU_MODE === 'production' ? 'production' : 'test',
    successUrl: process.env.PAYU_SUCCESS_URL || '',
    failureUrl: process.env.PAYU_FAILURE_URL || ''
};

config.payuUrl = config.mode === 'production'
    ? 'https://secure.payu.in/_payment'
    : 'https://test.payu.in/_payment';

const isConfigured = () =>
    config.key.length > 0 && config.salt.length > 0 &&
    !isPlaceholder(config.key) && !isPlaceholder(config.salt);

const assertConfigured = () => {
    if (!isConfigured()) {
        const err = new Error('PayU is not configured. Set PAYU_MERCHANT_KEY and PAYU_SALT in the environment');
        err.status = 503;
        throw err;
    }
    if (!config.successUrl || !config.failureUrl) {
        const err = new Error('PayU callback URLs not configured. Set PAYU_SUCCESS_URL and PAYU_FAILURE_URL');
        err.status = 503;
        throw err;
    }
};

module.exports = { config, isConfigured, assertConfigured };
