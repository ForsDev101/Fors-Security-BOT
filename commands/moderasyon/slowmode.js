const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Kanala yavaş mod ayarlar')
    .addIntegerOption(option =>
      option.setName('süre')
        .setDescription('Yavaş mod süresi (saniye)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const sure = interaction.options.getInteger('süre');
      if (sure < 0 || sure > 21600) return await interaction.editReply('❌ Süre 0 ile 21600 saniye arasında olmalı.');

      await interaction.channel.setRateLimitPerUser(sure);

      const embed = new EmbedBuilder()
        .setTitle('🐢 Slowmode Ayarlandı')
        .setDescription(`${interaction.channel} kanalına ${sure} saniye yavaş mod ayarlandı.`)
        .setFooter({ text: `Ayarlayan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await rpgEmbed(interaction, embed, 500);
    } catch (err) {
      console.error(err);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: 'Komut çalıştırılırken hata oluştu.', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Komut çalıştırılırken hata oluştu.', ephemeral: true });
      }
    }
  }
};
