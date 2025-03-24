const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { URL } = require('url');
const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder 
} = require('discord.js');
const { User, Config } = require('../database');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        const userId = message.author.id;
        let user = await User.findOne({ where: { id: userId } });

        const guildConfig = await Config.findOne({ where: { guildId: message.guild.id } });
        if (!guildConfig || message.channel.id !== guildConfig.submissionChannelId) return;

        if (!message.attachments.size) return;

        const imageAttachment = message.attachments.find(attachment =>
            attachment.contentType && attachment.contentType.startsWith('image/')
        );

        if (!imageAttachment) return;

        // Initial check if the user has already submitted today.
        if (user?.submittedToday === true) {
            const embed = new EmbedBuilder()
                .setTitle('❌ eyoooo')
                .setDescription(`${message.author}, you have already submitted an approved photo today! Stalker ;(`);
            await message.reply({ embeds: [embed] });
            return;
        }

        // Embed for Moderators
        const embed = new EmbedBuilder()
            .setTitle('📷 Image Submission')
            .setDescription(`${message.author}, your image is awaiting approval.`)
            .setFooter({ text: 'Moderators, please approve or reject.' });

        // Buttons for approval & rejection
        const actionRowButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('approve')
                .setLabel('✅ Approve')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('reject')
                .setLabel('❌ Reject')
                .setStyle(ButtonStyle.Danger)
        );

        // Dropdowns for location and activity
        const actionRowLocation = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_location')
                .setPlaceholder('📍 Select a location')
                .addOptions([
                    { label: 'School cafeteria', value: 'school cafeteria' },
                    { label: 'Class', value: 'class' },
                    { label: 'Uni halls', value: 'uni halls' },
                    { label: 'Library', value: 'library' },
                    { label: 'Tengoku event', value: 'tengoku event' },
                    { label: 'Non tengoku event', value: 'non tengoku event' },
                    { label: 'Party', value: 'party' },
                    { label: 'Supermarket', value: 'supermarket' },
                    { label: 'Any college dorm', value: 'any college dorm' },
                    { label: 'Outside', value: 'outside' }
                ])
        );
        const actionRowActivity = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_activity')
                .setPlaceholder('🎭 Select an activity')
                .addOptions([
                    { label: 'Chilling', value: 'chilling' },
                    { label: 'Watching anime', value: 'watching anime' },
                    { label: 'Playing games', value: 'playing games' },
                    { label: 'Studying', value: 'studying' },
                    { label: 'Reading', value: 'reading' },
                    { label: 'With another person (the picture taker and uploader doesn’t count)', value: 'with another person' },
                    { label: 'On the bicycle', value: 'on the bicycle' },
                    { label: 'Sleeping', value: 'sleeping' },
                    { label: 'Doing the laundry', value: 'doing the laundry' }
                ])
        );

        // Bonus toggle buttons
        // We'll track these toggles with booleans
        let bonus1Selected = false;
        let bonus2Selected = false;
        
        // Function to build the bonus action row based on the toggle state
        const buildBonusActionRow = () => {
            const bonusButton1 = new ButtonBuilder()
                .setCustomId('bonus1')
                .setLabel('Distance bonus')
                .setStyle(bonus1Selected ? ButtonStyle.Success : ButtonStyle.Secondary);
            const bonusButton2 = new ButtonBuilder()
                .setCustomId('bonus2')
                .setLabel('Pablo didnt notice :3')
                .setStyle(bonus2Selected ? ButtonStyle.Success : ButtonStyle.Secondary);
            return new ActionRowBuilder().addComponents(bonusButton1, bonusButton2);
        };

        const bonusActionRow = buildBonusActionRow();

        // Send embed with buttons and bonus toggles
        const reply = await message.reply({ 
            embeds: [embed], 
            components: [actionRowLocation, actionRowActivity, actionRowButtons, bonusActionRow] 
        });

        // Variables to store the dropdown selections
        let selectedActivity = null;
        let selectedLocation = null;

        // Interaction Collector
        const collector = reply.createMessageComponentCollector({ time: 60000 });

        // Track whether the submission has been processed
        let handled = false;

        collector.on('collect', async interaction => {
            // Check for moderator role
            if (!interaction.member.roles.cache.has('1335553311771983924')) {
                return interaction.reply({ content: '❌ You are not authorized!', ephemeral: true });
            }

            if (handled) {
                return interaction.reply({ content: '⚠️ This submission has already been processed.', ephemeral: true });
            }

            if (interaction.customId === 'select_activity') {
                selectedActivity = interaction.values[0];
                await interaction.reply({ content: `🎭 Activity set to: **${selectedActivity}**`, ephemeral: true });
            }

            if (interaction.customId === 'select_location') {
                selectedLocation = interaction.values[0];
                await interaction.reply({ content: `📍 Location set to: **${selectedLocation}**`, ephemeral: true });
            }

            // Toggle bonus buttons
            if (interaction.customId === 'bonus1') {
                bonus1Selected = !bonus1Selected;
                await interaction.reply({ content: `Bonus 1 is now ${bonus1Selected ? 'enabled' : 'disabled'}.`, ephemeral: true });
                // Update bonus row
                const newBonusRow = buildBonusActionRow();
                await reply.edit({ components: [actionRowLocation, actionRowActivity, actionRowButtons, newBonusRow] });
            }

            if (interaction.customId === 'bonus2') {
                bonus2Selected = !bonus2Selected;
                await interaction.reply({ content: `Bonus 2 is now ${bonus2Selected ? 'enabled' : 'disabled'}.`, ephemeral: true });
                // Update bonus row
                const newBonusRow = buildBonusActionRow();
                await reply.edit({ components: [actionRowLocation, actionRowActivity, actionRowButtons, newBonusRow] });
            }

            // Approve submission
            if (interaction.customId === 'approve') {
                // Check if dropdown selections have been made
                if (!selectedActivity || !selectedLocation) {
                    return interaction.reply({ content: '❌ Please select an activity and location before approving.', ephemeral: true });
                }
                
                // **Additional check:** Re-fetch the user record to ensure no approved submission exists.
                user = await User.findOne({ where: { id: userId } });
                if (user?.submittedToday === true) {
                    return interaction.reply({ content: '❌ This user already has an approved submission for today!', ephemeral: true });
                }

                // Mark handled after checks pass
                handled = true;

                if (!user) user = await User.create({ id: userId, points: 0, submittedToday: false });

                let pointsForThisSubmission = 0;

                // Calculate points based on selected activity
                switch (selectedActivity) {
                    case 'chilling':
                    case 'watching anime':
                        pointsForThisSubmission = 15;
                        break;
                    case 'playing games':
                    case 'studying':
                        pointsForThisSubmission = 20;
                        break;
                    case 'reading':
                    case 'with another person':
                        pointsForThisSubmission = 50;
                        break;
                    case 'on the bicycle':
                    case 'sleeping':
                        pointsForThisSubmission = 75;
                        break;
                    case 'doing the laundry':
                        pointsForThisSubmission = 100;
                        break;
                    default:
                        pointsForThisSubmission = 10;
                }

                // Calculate additional points based on selected location
                switch (selectedLocation) {
                    case 'school cafeteria':
                    case 'class':
                    case 'uni halls':
                        pointsForThisSubmission += 15;
                        break;
                    case 'library':
                    case 'tengoku event':
                        pointsForThisSubmission += 20;
                        break;
                    case 'non tengoku event':
                    case 'party':
                        pointsForThisSubmission += 50;
                        break;
                    case 'supermarket':
                    case 'any college dorm':
                        pointsForThisSubmission += 75;
                        break;
                    case 'outside':
                        pointsForThisSubmission += 100;
                        break;
                    default:
                        pointsForThisSubmission += 10;
                }

                // Add bonus points if toggles are enabled
                if (bonus1Selected) pointsForThisSubmission += 50;
                if (bonus2Selected) pointsForThisSubmission += 50;

                // Set submission as approved
                user.points = (user.points || 0) + pointsForThisSubmission;
                user.submittedToday = true;
                user.submittedTotal += 1;
                if (user.topPostUser < pointsForThisSubmission) {user.topPostUser = pointsForThisSubmission}
                await user.save();

                // Update top post if applicable
                let currentConfig = await Config.findOne({ where: { guildId: message.guild.id } });
                if (currentConfig && pointsForThisSubmission > currentConfig.topPostOfTheDayScore) {
                    currentConfig.topPostOfTheDayScore = pointsForThisSubmission;
                    currentConfig.topPostOfTheDayUser = message.author.id;
                    currentConfig.topPostOfTheDayLink = imageAttachment.url;
                    await currentConfig.save();
                }

                await interaction.reply({ content: `✅ Approved! ${message.author} gains **${pointsForThisSubmission}** points.`, ephemeral: false });

                // Remove buttons after approval
                await reply.edit({ components: [] });

            } else if (interaction.customId === 'reject') {
                handled = true; // Ensure no further interactions happen
                await interaction.reply({ content: `❌ Rejected. No points awarded.`, ephemeral: false });

                // Remove buttons after rejection
                await reply.edit({ components: [] });
            }
        });
    }
};
