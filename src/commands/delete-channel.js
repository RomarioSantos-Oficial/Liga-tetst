const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
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

    async execute(interaction) {
        const tipoCanal = interaction.options.getString('tipo');
        const canais = interaction.guild.channels.cache.filter(c => 
            (tipoCanal === 'texto' && c.type === ChannelType.GuildText) ||
            (tipoCanal === 'audio' && c.type === ChannelType.GuildVoice)
        );

        if (canais.size === 0) {
            return interaction.reply({ content: `Nenhum canal ${tipoCanal} encontrado.`, ephemeral: true });
        }

        const listaCanais = canais.map((c, index) => `${index + 1}. ${c.name}`).join('\n');
        await interaction.reply({ content: `Escolha um canal para excluir:\n${listaCanais}`, ephemeral: true });

        const filtro = response => response.author.id === interaction.user.id && !isNaN(response.content) && parseInt(response.content) > 0 && parseInt(response.content) <= canais.size;
        const coletor = interaction.channel.createMessageCollector({ filter: filtro, time: 30000 });

        coletor.on('collect', async resposta => {
            const index = parseInt(resposta.content) - 1;
            const canal = canais.at(index);

            coletor.stop();

            if (canal) {
                await interaction.followUp({ content: `Você realmente deseja excluir o canal **${canal.name}**? Responda com "Sim" para confirmar ou "Não" para cancelar.`, ephemeral: true });

                const filtroConfirmacao = response => response.author.id === interaction.user.id;
                const coletorConfirmacao = interaction.channel.createMessageCollector({ filter: filtroConfirmacao, time: 30000 });

                coletorConfirmacao.on('collect', async confirmacao => {
                    coletorConfirmacao.stop();

                    if (confirmacao.content.toLowerCase() === 'sim') {
                        try {
                            await canal.delete();
                            await interaction.followUp({ content: `Canal **${canal.name}** excluído com sucesso!`, ephemeral: true });
                        } catch (error) {
                            console.error('Erro ao excluir o canal:', error);
                            await interaction.followUp({ content: 'Houve um erro ao excluir o canal.', ephemeral: true });
                        }
                    } else {
                        await interaction.followUp({ content: 'Operação de exclusão cancelada.', ephemeral: true });
                    }
                });

                coletorConfirmacao.on('end', collected => {
                    if (collected.size === 0) {
                        interaction.followUp({ content: 'Tempo de resposta expirado. A operação de exclusão foi cancelada.', ephemeral: true });
                    }
                });
            }
        });

        coletor.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'Tempo de resposta expirado. A operação de exclusão foi cancelada.', ephemeral: true });
            }
        });
    }
};
