const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Kanal kilidini açar, mesaj gönderimini tekrar açar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const channel = interaction.channel;

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('Kanal Kilidi Açıldı')
        .setDescription(`${channel} kanalı artık mesaj göndermeye açık.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Kanal kilidi açılırken hata oluştu.', ephemeral: true });
    }
  }
};
