const validateEnv = () => {
    const errors = [];
    const warnings = [];

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        errors.push('JWT_SECRET is not set');
    } else if (jwtSecret.length < 32) {
        errors.push('JWT_SECRET must be at least 32 characters long');
    } else if (jwtSecret === 'secret' || jwtSecret === 'changeme' || jwtSecret === 'your-secret-key') {
        errors.push('JWT_SECRET is set to a well-known default value; replace it with a strong random secret');
    }

    if (!process.env.DATABASE_URL) {
        errors.push('DATABASE_URL is not set');
    }

    if (process.env.NODE_ENV === 'production') {
        if (!process.env.CORS_ORIGIN) {
            warnings.push('CORS_ORIGIN is not set in production; using a strict default is recommended');
        }
    }

    if (errors.length > 0) {
        console.error('\nFATAL: Invalid environment configuration:');
        for (const e of errors) console.error(`  - ${e}`);
        console.error('\nServer cannot start. Fix the above and retry.\n');
        process.exit(1);
    }

    if (warnings.length > 0) {
        console.warn('\nEnvironment warnings:');
        for (const w of warnings) console.warn(`  - ${w}`);
        console.warn('');
    }
};

module.exports = validateEnv;
