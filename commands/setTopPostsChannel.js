const { SlashCommandBuilder } = require('discord.js');
const { Config } = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settoppostschannel')
        .setDescription('Set the channel for top image announcements.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Select a channel')
                .setRequired(true)
        ),
    async execute(interaction) {
        // Change this to the exact role ID you want to check
        const requiredRoleId = "1335553311771983924"; // Role ID 

        // Check if the user has the required role
        const hasRole = interaction.member.roles.cache.some(role =>
           role.id === requiredRoleId
        );

        if (!hasRole) {
            return interaction.reply({ 
                content: 'You do not have permission to set the top image announcements channel.', 
                ephemeral: true 
            });
        }

        const channel = interaction.options.getChannel('channel');
        await Config.upsert({ guildId: interaction.guild.id, dailyPostChannelId: channel.id });

        interaction.reply(`✅ Submission channel set to ${channel}.`);
    }
};
