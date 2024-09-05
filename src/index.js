// src/index.js

require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Carregar comandos
client.commands = new Collection();
const fs = require('fs');
const path = require('path');
const commandsPath = path.join(__dirname, 'commands');

fs.readdir(commandsPath, (err, files) => {
    if (err) console.error(err);
    files.forEach(file => {
        if (file.endsWith('.js')) {
            const command = require(path.join(commandsPath, file));
            client.commands.set(command.data.name, command);
        }
    });
});

client.once('ready', () => {
    console.log(`Bot ${client.user.tag} está pronto!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Houve um erro ao executar esse comando!', ephemeral: true });
    }
});



client.login(process.env.DISCORD_TOKEN);

// Importar e registrar comandos
require('./deploy-commands');


