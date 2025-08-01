const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unslowmode')
    .setDescription('Kanalın yavaş modunu sıfırlar (kaldırır).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      await interaction.channel.setRateLimitPerUser(0);
      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('Yavaş Mod Kaldırıldı')
        .setDescription(`${interaction.channel} kanalındaki yavaş mod kaldırıldı.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Yavaş mod kaldırılırken hata oluştu.', ephemeral: true });
    }
  }
};
