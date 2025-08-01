const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readJSON, writeJSON } = require('../../utils/fileHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('etiket-engel')
    .setDescription('@everyone, @here engelleme sistemini aç/kapat')
    .addStringOption(option =>
      option.setName('durum')
        .setDescription('Aç veya kapat')
        .setRequired(true)
        .addChoices(
          { name: 'Aç', value: 'ac' },
          { name: 'Kapat', value: 'kapat' }
        ))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply();

    const durum = interaction.options.getString('durum');
    const guildId = interaction.guild.id;

    let config = readJSON('./data/koruma.json');
    if (!config[guildId]) config[guildId] = {};

    config[guildId].etiketEngel = durum === 'ac';
    writeJSON('./data/koruma.json', config);

    const renkler = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Aqua', 'Orange'];
    const rastgeleRenk = renkler[Math.floor(Math.random() * renkler.length)];

    const embed = new EmbedBuilder()
      .setTitle('📛 Etiket Koruması')
      .setDescription(`${interaction.user} @everyone ve @here etiket engellemesini **${durum === 'ac' ? 'AÇTI' : 'KAPATTI'}**.`)
      .setColor(rastgeleRenk)
      .setFooter({ text: `Komut kullanan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
