require('dotenv').config();
const { sequelize } = require('./src/config/db');
require('./src/models/associations');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to Neon DB');

        await sequelize.sync({ force: false });
        console.log('All tables synced');

        const [user, created] = await User.findOrCreate({
            where: { email: 'himmat@gmail.com' },
            defaults: {
                name: 'Himmat Admin',
                email: 'himmat@gmail.com',
                password: 'Himmat@7877',
                role: 'admin',
                isVerified: true,
                phone: null
            }
        });

        if (created) {
            console.log('Admin user created: himmat@gmail.com');
        } else {
            user.password = 'Himmat@7877';
            user.role = 'admin';
            user.isVerified = true;
            await user.save();
            console.log('Admin user updated: himmat@gmail.com');
        }

        console.log('Setup complete');
        process.exit(0);
    } catch (err) {
        console.error('Setup failed:', err);
        process.exit(1);
    }
})();
