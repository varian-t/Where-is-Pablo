const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js')
const { User } = require('../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('myscore')
        .setDescription('Check your score.'),
    async execute(interaction) {
      // Fetch user data

      const id = interaction.user.id;
      const username = interaction.user.username;

      const user = await User.findOne({ where: { id } });
  
      
  
      if (!user) {
        return await interaction.reply({
          content: "You don't have a profile yet! Start playing to create one.",
          ephemeral: true,
        });
      }

      const points = user.points || 0;
      const submittedTotal = user.submittedTotal || 0;
      const topPostUser = user.topPostUser;

        const embed = new EmbedBuilder()
        .setTitle(`**${username}'s Profile**`)
        .setDescription(
          `**Points:** ${points} ✨\n` +
          `**Top post:** ${topPostUser} ✨\n` +
          `**Number of submissions** ${submittedTotal} ✨\n` 
        )
        .setColor('Random');

        const response = { embeds: [embed] };
        await interaction.reply(response);
    }
};


