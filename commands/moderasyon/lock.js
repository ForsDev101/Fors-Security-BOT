const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Kanalı kilitler, mesaj gönderimini engeller.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.channel;

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Kanal Kilitlendi')
        .setDescription(`${channel} kanalı mesaj gönderimine kapatıldı.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Kanal kilitlenirken bir hata oluştu.', ephemeral: true });
    }
  }
};
