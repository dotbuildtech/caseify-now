require('dotenv').config();
const { sequelize } = require('./src/config/db');
require('./src/models/associations');
const User = require('./src/models/User');

(async () => {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email: 'himmat@gmail.com' } });
    if (!user) { console.log('USER NOT FOUND'); process.exit(1); }
    console.log('Found user:', user.email, '| role:', user.role);
    const isMatch = await user.comparePassword('Himmat@7877');
    console.log('Password match:', isMatch);
    console.log('Hash:', user.password);
    console.log('Locked:', user.isLocked());
    await sequelize.close();
    process.exit(0);
  } catch (e) { console.error(e); process.exit(1); }
})();
