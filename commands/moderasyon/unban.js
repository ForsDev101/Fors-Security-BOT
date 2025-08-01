
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Ban kaldırır')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('Banı kaldırılacak kullanıcının ID\'si')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const userId = interaction.options.getString('id');
      await interaction.guild.members.unban(userId);

      const embed = new EmbedBuilder()
        .setTitle('✅ Ban Kaldırıldı')
        .setDescription(`Kullanıcı ID: **${userId}** banı kaldırıldı.`)
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
