const logSecurityEvent = (event, details = {}) => {
    const entry = {
        timestamp: new Date().toISOString(),
        event,
        ...details
    };
    console.log(`[security] ${JSON.stringify(entry)}`);
};

module.exports = logSecurityEvent;
