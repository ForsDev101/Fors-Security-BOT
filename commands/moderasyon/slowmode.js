const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Kanal için yavaş modu ayarlar (saniye cinsinden).')
    .addIntegerOption(option =>
      option.setName('saniye')
        .setDescription('Yavaş mod süresi (0 ile 21600 saniye arası)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('saniye');

    if (seconds < 0 || seconds > 21600) {
      return interaction.reply({ content: 'Lütfen 0 ile 21600 arasında bir değer girin.', ephemeral: true });
    }

    try {
      await interaction.channel.setRateLimitPerUser(seconds);
      const embed = new EmbedBuilder()
        .setColor('Orange')
        .setTitle('Yavaş Mod Ayarlandı')
        .setDescription(`${interaction.channel} kanalı için yavaş mod süresi ${seconds} saniye olarak ayarlandı.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Yavaş mod ayarlanırken hata oluştu.', ephemeral: true });
    }
  }
};
