const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { URL } = require('url'); // To properly handle URLs
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { User, Config } = require('../database');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        // Fetch guild configuration
        const guildConfig = await Config.findOne({ where: { guildId: message.guild.id } });
        if (!guildConfig || message.channel.id !== guildConfig.channelId) return;

        // Check if the message contains attachments
        if (!message.attachments.size) return;

        // Filter for only image attachments
        const imageAttachment = message.attachments.find(attachment =>
            attachment.contentType && attachment.contentType.startsWith('image/')
        );

        if (!imageAttachment) return; // Ignore non-image messages

        // Extract the image URL (remove query parameters)
        const imageUrl = new URL(imageAttachment.url);
       // imageUrl.search = ''; // Remove query parameters

        // Create an embed for approval
        const embed = new EmbedBuilder()
            .setTitle('📷 Image Submission')
            .setDescription(`${message.author}, your image is awaiting approval.`)
           // .setImage(imageAttachment.url)
            .setFooter({ text: 'Moderators, please approve or reject.' });

        // Create approval buttons
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('approve').setLabel('Approve').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('reject').setLabel('Reject').setStyle(ButtonStyle.Danger)
        );

        // Send the embed with buttons
        const reply = await message.reply({ embeds: [embed], components: [row] });

        // Create an interaction filter
        const filter = (interaction) => interaction.customId === 'approve' || interaction.customId === 'reject';
        const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (interaction) => {
            if (!interaction.member.roles.cache.some(role => role.id === '1335553311771983924')) {
                return interaction.reply({ content: '❌ You are not authorized!', ephemeral: true });
            }

            if (interaction.customId === 'approve') {
                const [user] = await User.findOrCreate({ where: { id: message.author.id } });
                await user.increment('points');

                interaction.reply({ content: `✅ Approved! ${message.author} gains a point.`, ephemeral: false });

                // 🔹 Download and save the image (Only on Approval)
                const now = new Date();
                const folderName = `${now.toLocaleString('en-US', { month: 'long' })}_${now.getFullYear()}`;
                const saveDirectory = path.join(__dirname, '../saved_images', folderName);

                // Ensure the folder exists
                if (!fs.existsSync(saveDirectory)) {
                    fs.mkdirSync(saveDirectory, { recursive: true });
                }

                // Get file extension safely
                const fileExtension = path.extname(imageUrl.pathname);
                const fileName = `${message.author.id}_${Date.now()}${fileExtension}`;
                const filePath = path.join(saveDirectory, fileName);

                // Download and save the image
                try {
                    const response = await axios.get(imageUrl.href, { responseType: 'stream' });
                    const writer = fs.createWriteStream(filePath);
                    response.data.pipe(writer);

                    writer.on('finish', () => console.log(`✅ Image saved: ${filePath}`));
                    writer.on('error', (err) => console.error('❌ Error saving image:', err));
                } catch (error) {
                    console.error('❌ Failed to download image:', error);
                }

            } else {
                interaction.reply({ content: `❌ Rejected. No points awarded.`, ephemeral: false });
            }

            collector.stop();
        });
    }
};
