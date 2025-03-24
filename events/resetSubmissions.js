const { CronJob } = require('cron');
const { User } = require('../database'); // Ensure this path is correct

const resetUsersDaily = async () => {
    try {
        console.log('🔄 Resetting daily field for all users...');

        await User.update({ submittedToday: 0 }, { where: {} });

        console.log('✅ All users have been reset for the day!');
    } catch (error) {
        console.error('❌ Error resetting users:', error);
    }
};

// Check if the job starts
console.log('🕒 Scheduling the daily reset job...');

const job = new CronJob('22 11 * * *', () => {
    console.log('⏳ Running scheduled reset job...');
    resetUsersDaily();
}, null, false, 'CET'); // 'GMT' ensures consistent scheduling

module.exports = { 
    startResetJob: () => {
        console.log('🚀 Starting reset job...');
        job.start();
    } 
};
