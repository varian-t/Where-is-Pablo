const { CronJob } = require('cron');
const { Config, User } = require('../database');
const { EmbedBuilder } = require('discord.js');

const judgeWeeklyTopPost = async (client) => {
    try {
        console.log('🔄 Judging weekly top post...');
        
        // Fetch the guild config (assuming a single configuration per guild)
        const guildConfig = await Config.findOne();
        if (!guildConfig) {
            console.error('❌ No guild configuration found!');
            return;
        }
        
        // Fetch the announcement channel – adjust channel selection as needed
        const announcementChannel = client.channels.cache.get(
            guildConfig.dailyPostChannelId || guildConfig.submissionChannelId
        );
        if (!announcementChannel) {
            console.error('❌ Announcement channel not found!');
            return;
        }
        
        // Check if a top post was recorded for the week
        if (guildConfig.topPostOfTheWeekScore === 0) {
            const embed = new EmbedBuilder()
                .setTitle('🏆 Weekly Top Photo')
                .setDescription('No photos were submitted this week!');
            await announcementChannel.send({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setTitle('🏆 Weekly Top Photo!')
                .setDescription(
                    `📸 Taken by <@${guildConfig.topPostOfTheWeekUser}> with a score of **${guildConfig.topPostOfTheWeekScore}**!\n🎉 Congrats! You earn an extra **100 points**!`
                )
                .setImage(guildConfig.topPostOfTheWeekLink);
            await announcementChannel.send({ embeds: [embed] });
            
            // Award bonus points to the user
            const topUser = await User.findOne({ where: { id: guildConfig.topPostOfTheWeekUser } });
            if (topUser) {
                topUser.points += 50;
                await topUser.save();
            }
        }
        
        // Reset the weekly top post data (reusing the same fields)
        await guildConfig.update({
            topPostOfTheWeekScore: 0,
            topPostOfTheWeekUser: '',
            topPostOfTheWeekLink: '',
        });
        
        console.log('✅ Weekly top post judged and reset!');
    } catch (error) {
        console.error('❌ Error judging weekly top post:', error);
    }
};

// Schedule the weekly top post job
console.log('🕒 Scheduling the daily top post job...');

let weeklyJob;

module.exports = {
  startResetJobWeekly: (client) => {
        console.log('🚀 Starting weekly top post job...');
        // For example, schedule for every Monday at 08:00 CET:
        weeklyJob = new CronJob('39 9 * * 1', () => {
            console.log('⏳ Running scheduled weekly top post job...');
            judgeWeeklyTopPost(client);
        }, null, false, 'CET');
        
        weeklyJob.start();
    }
};
