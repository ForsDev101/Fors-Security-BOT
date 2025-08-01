const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Kullanıcının timeout süresini kaldırır')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Timeout kaldırılacak kullanıcı')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const user = interaction.options.getUser('kullanıcı');
      const member = await interaction.guild.members.fetch(user.id);

      if (!member.moderatable) {
        return await interaction.editReply({ content: '❌ Timeout kaldırma işlemi yapılamıyor.' });
      }

      await member.timeout(null);

      const embed = new EmbedBuilder()
        .setTitle('⏱️ Timeout Kaldırıldı')
        .setDescription(`${user} kullanıcısının timeout süresi kaldırıldı.`)
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
