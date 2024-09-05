const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Responde com o tempo de resposta do bot!'),
    async execute(interaction) {
        // Enviar uma resposta inicial para medir o tempo
        const sent = await interaction.reply({ content: 'Calculando o tempo de resposta...', fetchReply: true });
        
        // Calcular o tempo de resposta
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiPing = interaction.client.ws.ping;

        // Editar a resposta com o tempo de resposta e o ping da API
        await interaction.editReply(`🏓 Pong! Latência: ${latency}ms. Ping da API: ${apiPing}ms.`);
    },
};
