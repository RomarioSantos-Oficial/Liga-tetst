const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete-category')
        .setDescription('Exclui uma categoria existente.'),

    async execute(interaction) {
        // Obter todas as categorias do servidor
        const categories = interaction.guild.channels.cache
            .filter(channel => channel.type === ChannelType.GuildCategory)
            .map(category => ({ id: category.id, name: category.name }));

        if (categories.length === 0) {
            return interaction.reply({ content: 'Nenhuma categoria encontrada.', ephemeral: true });
        }

        // Criar uma lista de categorias com números
        let categoryList = 'Categorias disponíveis:\n';
        categories.forEach((category, index) => {
            categoryList += `${index + 1}. ${category.name}\n`;
        });

        // Enviar a lista de categorias para o usuário
        await interaction.reply({ content: categoryList + 'Escolha o número da categoria para excluir:', ephemeral: true });

        // Coletar a resposta do usuário
        const filter = response => response.author.id === interaction.user.id && !isNaN(response.content) && response.content > 0 && response.content <= categories.length;
        const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });

        collector.on('collect', async response => {
            collector.stop();
            const index = parseInt(response.content) - 1;
            const category = categories[index];

            if (!category) {
                return interaction.followUp({ content: 'Categoria não encontrada.', ephemeral: true });
            }

            // Perguntar ao usuário se ele deseja confirmar a exclusão
            await interaction.followUp({ content: `Você realmente deseja excluir a categoria **${category.name}**? Responda com "Sim" para confirmar ou "Não" para cancelar.`, ephemeral: true });

            // Coletar a confirmação do usuário
            const confirmFilter = response => response.author.id === interaction.user.id;
            const confirmCollector = interaction.channel.createMessageCollector({ filter: confirmFilter, time: 30000 });

            confirmCollector.on('collect', async response => {
                confirmCollector.stop();

                if (response.content.toLowerCase() === 'sim') {
                    try {
                        const categoryToDelete = interaction.guild.channels.cache.get(category.id);
                        await categoryToDelete.delete();
                        await interaction.followUp({ content: `Categoria **${category.name}** excluída com sucesso!`, ephemeral: true });
                    } catch (error) {
                        console.error('Erro ao excluir a categoria:', error);
                        await interaction.followUp({ content: 'Houve um erro ao excluir a categoria.', ephemeral: true });
                    }
                } else {
                    await interaction.followUp({ content: 'Operação de exclusão cancelada.', ephemeral: true });
                }
            });

            confirmCollector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.followUp({ content: 'Tempo de resposta expirado. A operação de exclusão foi cancelada.', ephemeral: true });
                }
            });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: 'Tempo de resposta expirado. A operação de exclusão foi cancelada.', ephemeral: true });
            }
        });
    }
};
