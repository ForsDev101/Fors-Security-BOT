const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Susturmayı kaldırır')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Susturması kaldırılacak kullanıcı')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const user = interaction.options.getUser('kullanıcı');
      const member = await interaction.guild.members.fetch(user.id);

      if (!member.moderatable) {
        return await interaction.editReply({ content: '❌ Bu kullanıcının susturmasını kaldıramıyorum.' });
      }

      await member.timeout(null);

      const embed = new EmbedBuilder()
        .setTitle('🔊 Kullanıcı Susturması Kaldırıldı')
        .setDescription(`${user} artık susturulmadı.`)
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
