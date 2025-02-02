const { SlashCommandBuilder } = require('discord.js');
const { CronJob } = require('cron');
const { Config, ApprovedImages } = require('../database');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

const jobs = new Map(); // Store active scheduled jobs

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setphotoday')
        .setDescription('Schedule the photo of the week post.')
        .addStringOption(option =>
            option.setName('day')
                .setDescription('Day of the week (e.g., Monday)')
                .setRequired(true)
                .addChoices(
                    { name: 'Monday', value: '1' },
                    { name: 'Tuesday', value: '2' },
                    { name: 'Wednesday', value: '3' },
                    { name: 'Thursday', value: '4' },
                    { name: 'Friday', value: '5' },
                    { name: 'Saturday', value: '6' },
                    { name: 'Sunday', value: '0' }
                )
        )
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Time in 24-hour format (HH:MM)')
                .setRequired(true)
        )
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

        const day = interaction.options.getString('day');
        const time = interaction.options.getString('time');
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;

        const [hours, minutes] = time.split(':');
        if (isNaN(hours) || isNaN(minutes)) {
            return interaction.reply({ content: '❌ Invalid time format! Use HH:MM.', ephemeral: true });
        }

        // Store schedule in the database
        await Config.upsert({
            guildId,
            photoDay: day,
            photoTime: time,
            channelId: channel.id
        });

        // Stop any existing job before scheduling a new one
        if (jobs.has(guildId)) {
            jobs.get(guildId).stop();
            jobs.delete(guildId);
            console.log(`🔄 Updated schedule: Stopped previous job for guild ${guildId}`);
        }

        // Start a new scheduled job
        startPhotoJob(guildId, day, hours, minutes, channel.id, interaction.client);

        interaction.reply({ content: `✅ Photo of the week scheduled for **${time} on ${interaction.options.getString('day')}** in ${channel}.`, ephemeral: false });
    }
};

// Function to get the most recent subfolder in `saved_images`
const getLatestFolder = (basePath) => {
  const subfolders = fs.readdirSync(basePath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory()) // Get only directories
      .map(dirent => ({
          name: dirent.name,
          time: fs.statSync(path.join(basePath, dirent.name)).mtimeMs
      }))
      .sort((a, b) => b.time - a.time); // Sort newest first

  return subfolders.length > 0 ? subfolders[0].name : null;
};

// Function to get images from the latest folder, filtering by last-modified time
const getRecentImages = (folderPath, oneWeekAgo) => {
  return fs.readdirSync(folderPath)
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)) // Only image files
      .map(file => ({
          name: file,
          time: fs.statSync(path.join(folderPath, file)).mtimeMs
      }))
      .filter(file => file.time >= oneWeekAgo) // Only files modified in the last week
      .map(file => file.name);
};

// Updated photo posting job
const startPhotoJob = (guildId, day, hours, minutes, channelId, client) => {
  console.log(`📆 Scheduling new job for Guild: ${guildId} | Day: ${day} | Time: ${hours}:${minutes}`);

  const job = new CronJob(
      `${minutes} ${hours} * * ${day}`,
      async () => {
          console.log(`🚀 Running scheduled job for guild: ${guildId}`);

          const channel = await client.channels.fetch(channelId);
          if (!channel) {
              console.log(`❌ Channel not found: ${channelId}`);
              return;
          }

          const baseFolder = path.join(__dirname, '../saved_images');
          const latestFolder = getLatestFolder(baseFolder);

          if (!latestFolder) {
              console.log(`⚠️ No valid image folders found in: ${baseFolder}`);
              await channel.send({
                embeds: [{
                    title: `📷 No submitted photos this week! The mythical Pablo is a rare sighting these days...`,
                    color: 0x00ff00
                }],
            });
              return;
          }

          const folderPath = path.join(baseFolder, latestFolder);
          const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000; // One week ago in ms

          const recentImages = getRecentImages(folderPath, oneWeekAgo);

          if (recentImages.length === 0) {
              console.log(`⚠️ No recent images found in folder: ${latestFolder}`);
              await channel.send({
                embeds: [{
                    title: `📷 No submitted photos this week! The mythical Pablo is a rare sighting these days...`,
                    color: 0x00ff00
                }],
            });
              return;
          }

          const randomImage = recentImages[Math.floor(Math.random() * recentImages.length)];
          const imagePath = path.join(folderPath, randomImage);

          console.log(`📸 Posting image: ${randomImage} in guild: ${guildId}`);

          await channel.send({
              embeds: [{
                  title: `📷 This was the photo of the week! Happy ${day}!`,
                  image: { url: `attachment://${randomImage}` },
                  color: 0x00ff00
              }],
              files: [imagePath]
          });
      },
      null,
      true
  );

  job.start();
  jobs.set(guildId, job);
};