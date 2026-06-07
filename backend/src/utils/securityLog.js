const logSecurityEvent = (event, details = {}) => {
    const entry = {
        timestamp: new Date().toISOString(),
        event,
        requestId: details.requestId || null,
        userId: details.userId || null,
        ip: details.ip || null,
        method: details.method || null,
        path: details.path || null,
        ...details
    };
    console.log(`[security] ${JSON.stringify(entry)}`);
};

const audit = (req, action, target, extra = {}) => {
    logSecurityEvent('audit', {
        requestId: req.id,
        userId: req.user ? req.user.id : null,
        role: req.user ? req.user.role : null,
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
        action,
        target,
        ...extra
    });
};

module.exports = logSecurityEvent;
module.exports.logSecurityEvent = logSecurityEvent;
module.exports.audit = audit;
