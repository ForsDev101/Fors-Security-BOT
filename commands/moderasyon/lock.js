const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Kanalı kilitler')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const channel = interaction.channel;
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });

      const embed = new EmbedBuilder()
        .setTitle('🔒 Kanal Kilitlendi')
        .setDescription(`${channel} kanalı kilitlendi.`)
        .setFooter({ text: `Kilitleyen: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
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
