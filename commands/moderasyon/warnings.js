const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsPath = path.resolve(__dirname, '../../data/warnings.json');

function loadWarnings() {
  if (!fs.existsSync(warningsPath)) return {};
  return JSON.parse(fs.readFileSync(warningsPath));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Bir kullanıcının uyarılarını listeler.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Uyarıları gösterilecek kullanıcı').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('kullanıcı');
    const warnings = loadWarnings();

    if (!warnings[user.id] || warnings[user.id].length === 0) {
      return interaction.reply({ content: `${user.tag} kullanıcısının uyarısı yok.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('Yellow')
      .setTitle(`${user.tag} kullanıcısının uyarıları`)
      .setDescription(warnings[user.id].map((w, i) => `${i + 1}. Sebep: ${w.reason} | Tarih: ${new Date(w.date).toLocaleString()}`).join('\n'))
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
