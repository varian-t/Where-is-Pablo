const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { User } = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Displays the top scores.'),
    async execute(interaction) {
        const topUsers = await User.findAll({ order: [['points', 'DESC']], limit: 10 });

        if (!topUsers.length) return interaction.reply('No scores recorded yet.');

        const embed = new EmbedBuilder()
            .setTitle('Leaderboard')
            .setDescription(topUsers.map((u, i) => `**${i + 1}.** <@${u.id}> - ${u.points} points`).join('\n'));

        interaction.reply({ embeds: [embed] });
    }
};
