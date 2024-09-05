const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Limpa um número específico de mensagens no canal atual.')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Número de mensagens a serem excluídas (1-100)')
                .setRequired(true)),
    async execute(interaction) {
        const amount = interaction.options.getInteger('quantidade');

        if (amount < 1 || amount > 100) {
            return interaction.reply({ content: 'Você precisa inserir um número entre 1 e 100.', ephemeral: true });
        }

        try {
            await interaction.deferReply({ ephemeral: true }); // Adia a resposta para evitar múltiplas respostas
            const deletedMessages = await interaction.channel.bulkDelete(amount, true); // Executa o bulkDelete e armazena o resultado
            await interaction.editReply({ content: `Foram excluídas ${deletedMessages.size} mensagens.` }); // Usa deletedMessages.size para mostrar o número real de mensagens deletadas
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Houve um erro ao tentar limpar as mensagens neste canal.' });
        }
    },
};
