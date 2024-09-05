const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Responde com um pong!'),

    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Limpa um número específico de mensagens no canal atual.')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Número de mensagens a serem excluídas (1-100)')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('role')
        .setDescription('Gerencia cargos no servidor.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Cria um novo cargo.')
                .addStringOption(option =>
                    option.setName('nome')
                        .setDescription('O nome do cargo.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('cor')
                        .setDescription('A cor do cargo (hexadecimal, por exemplo #ff0000).')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Deleta um cargo existente.')
                .addStringOption(option =>
                    option.setName('nome')
                        .setDescription('O nome do cargo a ser deletado.')
                        .setRequired(true))),

    new SlashCommandBuilder()
        .setName('canal')
        .setDescription('Cria canais de texto ou de áudio.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('criar')
                .setDescription('Cria um canal de texto ou de áudio.')
                .addStringOption(option =>
                    option.setName('tipo')
                        .setDescription('Escolha o tipo de canal: texto ou áudio')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Texto', value: 'texto' },
                            { name: 'Áudio', value: 'audio' }
                        ))),

    new SlashCommandBuilder()
        .setName('delete-channel')
        .setDescription('Exclui um canal de texto ou de áudio.')
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Escolha o tipo de canal: texto ou áudio')
                .setRequired(true)
                .addChoices(
                    { name: 'Texto', value: 'texto' },
                    { name: 'Áudio', value: 'audio' }
                )),

    new SlashCommandBuilder()
        .setName('delete-category')
        .setDescription('Exclui uma categoria existente.'),

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Começando a atualizar comandos do bot...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
            body: commands,
        });
        console.log('Comandos atualizados com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar comandos:', error);
    }
})();
