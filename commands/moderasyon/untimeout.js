const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Bir kullanıcının timeout süresini kaldırır.')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Timeout süresi kaldırılacak kullanıcı')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const member = interaction.options.getMember('kullanıcı');
    if (!member) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });

    if (!member.isCommunicationDisabled()) {
      return interaction.reply({ content: 'Bu kullanıcıda aktif bir timeout bulunmamaktadır.', ephemeral: true });
    }

    try {
      await member.timeout(null);
      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('Timeout Kaldırıldı')
        .setDescription(`${member.user.tag} kullanıcısının timeout süresi kaldırıldı.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Timeout kaldırılırken bir hata oluştu.', ephemeral: true });
    }
  }
};
