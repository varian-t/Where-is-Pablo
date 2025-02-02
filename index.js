require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials, Events } = require('discord.js');
//const { token } = require('./config.json');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./database');
//const  schedulePhoto  = require('../Where is Pablo/commands/setPhotoDay');


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Load Commands
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// Load Events
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    client.on(event.name, (...args) => event.execute(...args, client));
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await sequelize.sync({ alter: true });

    /*const schedulePhoto = require('../Where is Pablo/commands/setPhotoDay');
    schedulePhoto.startPhotoJob(client);*/
});

client.login(process.env.TOKEN);

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
      await command.execute(interaction);
  } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ An error occurred while executing this command!', ephemeral: true });
  }
});
