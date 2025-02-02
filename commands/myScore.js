const { SlashCommandBuilder } = require('discord.js');
const { User } = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('myscore')
        .setDescription('Check your score.'),
    async execute(interaction) {
        const user = await User.findByPk(interaction.user.id);
        interaction.reply(`You have ${user ? user.points : 0} points.`);
    }
};
