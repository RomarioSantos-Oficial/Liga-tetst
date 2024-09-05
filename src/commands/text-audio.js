const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, ChannelType } = require('discord.js');
require('dotenv').config(); // Carrega as variáveis do arquivo .env

const GUILD_ID = process.env.GUILD_ID;
let adminRoles = [];

// Função para atualizar a lista de IDs de cargos com permissões de administrador
const updateAdminRoles = (guild) => {
    adminRoles = guild.roles.cache.filter(role => role.permissions.has(PermissionsBitField.Flags.Administrator)).map(role => role.id);
};

// Verifica a cada 10 minutos se há novos cargos com permissões de administrador
setInterval(() => {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (guild) {
        updateAdminRoles(guild);
    }
}, 600000); // 600000 ms = 10 minutos

module.exports = {
    data: new SlashCommandBuilder()
        .setName('canal')
        .setDescription('Cria canais de texto ou de áudio.')
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Escolha o tipo de canal: texto ou áudio')
                .setRequired(true)
                .addChoices(
                    { name: 'Texto', value: 'texto' },
                    { name: 'Áudio', value: 'audio' }
                )),

    async execute(interaction) {
        const type = interaction.options.getString('tipo');
        const filter = response => response.author.id === interaction.user.id;

        await interaction.reply({ content: 'Deseja criar uma nova categoria (1) ou escolher uma existente (2)?', ephemeral: true });

        const categoryCollector = interaction.channel.createMessageCollector({ filter, time: 15000 });

        categoryCollector.on('collect', async categoryResponse => {
            const categoryOption = categoryResponse.content.trim();
            categoryCollector.stop();

            if (categoryOption === '1') {
                // Criar uma nova categoria
                await interaction.followUp({ content: 'Qual o nome da nova categoria?', ephemeral: true });

                const newCategoryCollector = interaction.channel.createMessageCollector({ filter, time: 15000 });

                newCategoryCollector.on('collect', async newCategoryResponse => {
                    const categoryName = newCategoryResponse.content.trim();
                    newCategoryCollector.stop();

                    if (!categoryName) {
                        await interaction.followUp({ content: 'Nome da categoria não fornecido. O comando foi cancelado.', ephemeral: true });
                        return;
                    }

                    try {
                        const newCategory = await interaction.guild.channels.create({
                            name: categoryName,
                            type: ChannelType.GuildCategory,
                            permissionOverwrites: [
                                {
                                    id: interaction.guild.id, // Todos os membros do servidor
                                    deny: [PermissionsBitField.Flags.ViewChannel], // Negar a visualização para todos
                                },
                                ...adminRoles.map(roleId => ({
                                    id: roleId,
                                    allow: [PermissionsBitField.Flags.ViewChannel], // Permitir visualização para administradores
                                })),
                            ],
                        });

                        if (newCategory && newCategory.id) {
                            const categoryId = newCategory.id;

                            await interaction.followUp({ content: `Categoria **${categoryName}** criada com sucesso!`, ephemeral: true });

                            // Perguntar o nome do canal após a criação da categoria
                            await interaction.followUp({ content: 'Qual será o nome do canal?', ephemeral: true });

                            const channelNameCollector = interaction.channel.createMessageCollector({ filter, time: 15000 });

                            channelNameCollector.on('collect', async channelNameResponse => {
                                const channelName = channelNameResponse.content.trim();
                                channelNameCollector.stop();

                                if (!channelName) {
                                    await interaction.followUp({ content: 'Nome do canal não fornecido. O comando foi cancelado.', ephemeral: true });
                                    return;
                                }

                                try {
                                    await interaction.guild.channels.create({
                                        name: channelName,
                                        type: type === 'texto' ? ChannelType.GuildText : ChannelType.GuildVoice,
                                        parent: categoryId, // Associar o canal à categoria
                                    });
                                    await interaction.followUp({ content: `Canal ${type === 'texto' ? 'de texto' : 'de áudio'} **${channelName}** criado na categoria **${categoryName}** com sucesso!`, ephemeral: true });
                                } catch (error) {
                                    console.error('Erro ao criar o canal:', error);
                                    await interaction.followUp({ content: 'Houve um erro ao criar o canal.', ephemeral: true });
                                }
                            });

                        } else {
                            await interaction.followUp({ content: 'Falha ao criar a categoria. O comando foi cancelado.', ephemeral: true });
                        }
                    } catch (error) {
                        console.error('Erro ao criar a categoria:', error);
                        await interaction.followUp({ content: 'Houve um erro ao criar a categoria.', ephemeral: true });
                    }
                });

            } else if (categoryOption === '2') {
                // Escolher uma categoria existente
                const categories = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
                let categoriesList = categories.map((cat, index) => `${index.toString().padStart(2, '0')}. ${cat.name}`).join('\n');
                categoriesList += '\n00. Criar sem categoria';

                await interaction.followUp({ content: `Categorias disponíveis:\n${categoriesList}`, ephemeral: true });

                const categorySelectionCollector = interaction.channel.createMessageCollector({ filter, time: 15000 });

                categorySelectionCollector.on('collect', async categorySelectionResponse => {
                    const selection = categorySelectionResponse.content.trim();
                    categorySelectionCollector.stop();

                    if (!selection) {
                        await interaction.followUp({ content: 'Seleção de categoria não fornecida. O comando foi cancelado.', ephemeral: true });
                        return;
                    }

                    let selectedCategory;

                    if (selection === '00') {
                        selectedCategory = null; // Criar sem categoria
                    } else {
                        const selectedIndex = parseInt(selection, 10);
                        const categoriesArray = Array.from(categories.values());
                        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= categoriesArray.length) {
                            await interaction.followUp({ content: 'Categoria inválida selecionada.', ephemeral: true });
                            return;
                        }
                        selectedCategory = categoriesArray[selectedIndex];
                    }

                    // Perguntar o nome do canal
                    await interaction.followUp({ content: 'Qual será o nome do canal?', ephemeral: true });

                    const channelNameCollector = interaction.channel.createMessageCollector({ filter, time: 15000 });

                    channelNameCollector.on('collect', async channelNameResponse => {
                        const channelName = channelNameResponse.content.trim();
                        channelNameCollector.stop();

                        if (!channelName) {
                            await interaction.followUp({ content: 'Nome do canal não fornecido. O comando foi cancelado.', ephemeral: true });
                            return;
                        }

                        try {
                            await interaction.guild.channels.create({
                                name: channelName,
                                type: type === 'texto' ? ChannelType.GuildText : ChannelType.GuildVoice,
                                parent: selectedCategory ? selectedCategory.id : undefined,
                            });
                            await interaction.followUp({ content: `Canal ${type === 'texto' ? 'de texto' : 'de áudio'} **${channelName}** ${selectedCategory ? `criado na categoria **${selectedCategory.name}**` : 'criado com sucesso!'} `, ephemeral: true });
                        } catch (error) {
                            console.error('Erro ao criar o canal:', error);
                            await interaction.followUp({ content: 'Houve um erro ao criar o canal.', ephemeral: true });
                        }
                    });

                });

            } else {
                await interaction.followUp({ content: 'Resposta inválida. O comando foi cancelado.', ephemeral: true });
            }
        });
    }
};
