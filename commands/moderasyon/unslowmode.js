const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unslowmode')
    .setDescription('Kanaldaki yavaş modu kaldırır')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      await interaction.channel.setRateLimitPerUser(0);

      const embed = new EmbedBuilder()
        .setTitle('🐇 Slowmode Kaldırıldı')
        .setDescription(`${interaction.channel} kanalındaki yavaş mod kaldırıldı.`)
        .setFooter({ text: `İşlemi yapan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
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
