const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Bir kullanıcının susturulmasını kaldırır.')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Susturulması kaldırılacak kullanıcı')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('kullanıcı');
    if (!member) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });

    if (!member.isCommunicationDisabled()) {
      return interaction.reply({ content: 'Bu kullanıcı susturulmamış.', ephemeral: true });
    }

    try {
      await member.timeout(null);
      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('Unmute Başarılı')
        .setDescription(`${member.user.tag} kullanıcısının susturulması kaldırıldı.`)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Susturma kaldırılırken hata oluştu.', ephemeral: true });
    }
  }
};
