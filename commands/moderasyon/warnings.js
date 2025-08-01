const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readJSON } = require('../../utils/fileHandler');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Bir kullanıcının uyarı geçmişini gösterir')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Uyarı geçmişi gösterilecek kullanıcı')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const user = interaction.options.getUser('kullanıcı');
      const guildId = interaction.guild.id;
      const warnings = readJSON('./data/warnings.json');
      const userWarnings = warnings[guildId]?.[user.id] || [];

      if (userWarnings.length === 0) {
        return await interaction.editReply({ content: `${user} kullanıcısının uyarı geçmişi bulunmamaktadır.` });
      }

      const embed = new EmbedBuilder()
        .setTitle(`${user.tag} - Uyarı Geçmişi`)
        .setDescription(userWarnings.map((w, i) => `\`${i + 1}.\` ${w.reason} - <t:${Math.floor(new Date(w.date).getTime() / 1000)}:R> (${w.moderator})`).join('\n'))
        .setFooter({ text: `İsteyen: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await rpgEmbed(interaction, embed, 700);
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
