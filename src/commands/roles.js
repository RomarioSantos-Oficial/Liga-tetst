const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
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
                .setDescription('Deleta um cargo.')
                .addStringOption(option =>
                    option.setName('nome')
                        .setDescription('O nome do cargo a ser excluído.')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const roleName = interaction.options.getString('nome').toUpperCase(); // Nome do cargo em maiúsculas

        if (subcommand === 'create') {
            await interaction.deferReply(); // Notifica o Discord que estamos processando a interação

            const color = interaction.options.getString('cor') || '#000000'; // Cor padrão se não for fornecida

            try {
                // Responder a interação inicialmente
                await interaction.followUp({ content: 'Deseja que o nome do membro seja exibido separado? Responda com "sim" ou "não".', ephemeral: true });

                const filter = response => response.author.id === interaction.user.id && ['sim', 'não'].includes(response.content.toLowerCase());
                const collector = interaction.channel.createMessageCollector({ filter, time: 15000 });

                collector.on('collect', async response => {
                    const separateMembers = response.content.toLowerCase() === 'sim';

                    // Pergunta se qualquer um pode mencionar o cargo
                    await interaction.followUp({ content: 'Qualquer um pode mencionar o cargo? Responda com "sim" ou "não".', ephemeral: true });

                    collector.stop();

                    const mentionFilter = response => response.author.id === interaction.user.id && ['sim', 'não'].includes(response.content.toLowerCase());
                    const mentionCollector = interaction.channel.createMessageCollector({ mentionFilter, time: 15000 });

                    mentionCollector.on('collect', async mentionResponse => {
                        const mentionable = mentionResponse.content.toLowerCase() === 'sim';

                        try {
                            // Criar o cargo
                            await interaction.guild.roles.create({
                                name: roleName,
                                color: color,
                                mentionable: mentionable,
                                hoist: separateMembers, // Exibir nome separado
                            });
                            await interaction.followUp({ content: `Cargo **${roleName}** criado com sucesso!`, ephemeral: true });
                        } catch (error) {
                            console.error(error);
                            await interaction.followUp({ content: 'Houve um erro ao criar o cargo.', ephemeral: true });
                        }

                        mentionCollector.stop();
                    });

                    mentionCollector.on('end', collected => {
                        if (collected.size === 0) {
                            interaction.followUp({ content: 'Tempo esgotado. Por favor, use o comando novamente.', ephemeral: true });
                        }
                    });
                });

                collector.on('end', collected => {
                    if (collected.size === 0) {
                        interaction.followUp({ content: 'Tempo esgotado. Por favor, use o comando novamente.', ephemeral: true });
                    }
                });
            } catch (error) {
                console.error('Erro ao criar o cargo:', error);
                await interaction.followUp({ content: 'Houve um erro ao processar o comando. Tente novamente mais tarde.', ephemeral: true });
            }
        } else if (subcommand === 'delete') {
            await interaction.deferReply(); // Notifica o Discord que estamos processando a interação

            const roles = interaction.guild.roles.cache.filter(role => role.name === roleName);

            if (roles.size === 0) {
                await interaction.followUp({ content: `Nenhum cargo encontrado com o nome **${roleName}**.`, ephemeral: true });
                return;
            }

            try {
                if (roles.size > 1) {
                    // Ordena os cargos pela quantidade de membros de forma crescente
                    let roleList = 'Escolha um cargo para excluir:\n';
                    let index = 1;
                    roles.sort((a, b) => a.members.size - b.members.size).forEach(role => {
                        // Limita o número de membros a no máximo 2 casas decimais
                        const formattedMembersCount = role.members.size.toFixed(2);
                        roleList += `${index.toString().padStart(2, '0')}. ${role.name} - ${formattedMembersCount} membro(s)\n`;
                    });

                    // Enviar a lista de cargos
                    await interaction.editReply({ content: roleList + '\nQual cargo deseja excluir? (responda com o número)', ephemeral: true });

                    const filter = response => {
                        const choice = parseInt(response.content, 10);
                        return !isNaN(choice) && choice >= 1 && choice <= roles.size && response.author.id === interaction.user.id;
                    };

                    const collector = interaction.channel.createMessageCollector({ filter, time: 15000 });

                    collector.on('collect', async response => {
                        const choice = parseInt(response.content, 10);
                        const selectedRole = roles.sort((a, b) => a.members.size - b.members.size).at(choice - 1);
                        if (selectedRole) {
                            const confirmationMessage = await interaction.followUp({ content: `Você tem certeza que deseja excluir o cargo **${selectedRole.name}**? Responda com "sim" ou "não".`, ephemeral: true, fetchReply: true });

                            const confirmationFilter = response => ['sim', 'não'].includes(response.content.toLowerCase()) && response.author.id === interaction.user.id;
                            const confirmationCollector = interaction.channel.createMessageCollector({ confirmationFilter, time: 15000 });

                            confirmationCollector.on('collect', async confirmationResponse => {
                                if (confirmationResponse.content.toLowerCase() === 'sim') {
                                    try {
                                        await selectedRole.delete();
                                        await interaction.followUp({ content: `Cargo **${selectedRole.name}** excluído com sucesso!`, ephemeral: true });
                                    } catch (error) {
                                        console.error(error);
                                        await interaction.followUp({ content: 'Houve um erro ao excluir o cargo.', ephemeral: true });
                                    }
                                } else {
                                    await interaction.followUp({ content: 'Exclusão do cargo cancelada.', ephemeral: true });
                                }
                                confirmationCollector.stop();
                            });

                            confirmationCollector.on('end', collected => {
                                if (collected.size === 0) {
                                    interaction.followUp({ content: 'Tempo esgotado. Exclusão do cargo cancelada. Por favor, use o comando novamente.', ephemeral: true });
                                }
                            });
                        } else {
                            await interaction.followUp({ content: 'Número inválido. Tente novamente.', ephemeral: true });
                        }
                        collector.stop();
                    });

                    collector.on('end', collected => {
                        if (collected.size === 0) {
                            interaction.followUp({ content: 'Tempo esgotado. Nenhum cargo foi excluído. Por favor, use o comando novamente.', ephemeral: true });
                        }
                    });
                } else {
                    const role = roles.first();
                    const confirmationMessage = await interaction.followUp({ content: `Você tem certeza que deseja excluir o cargo **${role.name}**? Responda com "sim" ou "não".`, ephemeral: true, fetchReply: true });

                    const filter = response => ['sim', 'não'].includes(response.content.toLowerCase()) && response.author.id === interaction.user.id;
                    const collector = interaction.channel.createMessageCollector({ filter, time: 15000 });

                    collector.on('collect', async response => {
                        if (response.content.toLowerCase() === 'sim') {
                            try {
                                await role.delete();
                                await interaction.followUp({ content: `Cargo **${role.name}** excluído com sucesso!`, ephemeral: true });
                            } catch (error) {
                                console.error(error);
                                await interaction.followUp({ content: 'Houve um erro ao excluir o cargo.', ephemeral: true });
                            }
                        } else {
                            await interaction.followUp({ content: 'Exclusão do cargo cancelada.', ephemeral: true });
                        }
                        collector.stop();
                    });

                    collector.on('end', collected => {
                        if (collected.size === 0) {
                            interaction.followUp({ content: 'Tempo esgotado. Exclusão do cargo cancelada. Por favor, use o comando novamente.', ephemeral: true });
                        }
                    });
                }
            } catch (error) {
                console.error('Erro ao excluir o cargo:', error);
                await interaction.followUp({ content: 'Houve um erro ao processar o comando. Tente novamente mais tarde.', ephemeral: true });
            }
        }
    },
};
