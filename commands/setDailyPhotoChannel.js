const { SlashCommandBuilder } = require('discord.js');
const { CronJob } = require('cron');
const { Config, ApprovedImages } = require('../database');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

const jobs = new Map(); // Store active scheduled jobs

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setdailyphotocahnnel')
        .setDescription('Set the channel to post the daily top photo in.')
        .addChannelOption(option =>
          option.setName('channel')
              .setDescription('Channel to post the photo of the week')
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
              content: 'You do not have permission to set the submission channel.', 
              ephemeral: true 
          });
      }

      const channel = interaction.options.getChannel('channel');
      await Config.upsert({ guildId: interaction.guild.id, dailyPostChannelId: channel.id });

      interaction.reply(`✅ Daily top posts channel set to ${channel}.`);
      }
};