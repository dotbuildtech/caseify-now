require('dotenv').config();
const User = require('./src/models/User');

async function listUsers() {
    try {
        const users = await User.findAll({
            where: { role: 'customer' },
            attributes: ['id', 'name', 'email', 'role', 'isVerified'],
            raw: true
        });
        
        if (users.length === 0) {
            console.log('No users found in database.');
        } else {
            console.log('JSON_OUTPUT_START');
            console.log(JSON.stringify(users, null, 2));
            console.log('JSON_OUTPUT_END');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error fetching users:', error.message);
        process.exit(1);
    }
}

listUsers();
