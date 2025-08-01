const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readJSON, writeJSON } = require('../../utils/fileHandler');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnclear')
    .setDescription('Bir kullanıcının uyarı geçmişini temizler')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Uyarıları temizlenecek kullanıcı')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const user = interaction.options.getUser('kullanıcı');
      const guildId = interaction.guild.id;
      let warnings = readJSON('./data/warnings.json');

      if (!warnings[guildId] || !warnings[guildId][user.id]) {
        return await interaction.editReply({ content: `${user} kullanıcısının uyarı kaydı bulunmamaktadır.` });
      }

      delete warnings[guildId][user.id];
      writeJSON('./data/warnings.json', warnings);

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Uyarılar Temizlendi')
        .setDescription(`${user} kullanıcısının tüm uyarı geçmişi temizlendi.`)
        .setFooter({ text: `Temizleyen: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
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
