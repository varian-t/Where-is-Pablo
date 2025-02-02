const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');


const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`⏳ Deploying ${commands.length} commands...`);

        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

        console.log('✅ Slash commands deployed successfully!');
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
    }
})();

