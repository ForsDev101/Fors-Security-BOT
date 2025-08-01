const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsPath = path.resolve(__dirname, '../../data/warnings.json');

function loadWarnings() {
  if (!fs.existsSync(warningsPath)) return {};
  return JSON.parse(fs.readFileSync(warningsPath));
}

function saveWarnings(warnings) {
  fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Bir kullanıcıyı uyarır.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Uyarılacak kullanıcı').setRequired(true))
    .addStringOption(option => option.setName('sebep').setDescription('Uyarı sebebi').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('kullanıcı');
    const reason = interaction.options.getString('sebep');

    const warnings = loadWarnings();

    if (!warnings[user.id]) warnings[user.id] = [];

    warnings[user.id].push({
      moderator: interaction.user.id,
      reason,
      date: new Date().toISOString(),
    });

    saveWarnings(warnings);

    const embed = new EmbedBuilder()
      .setColor('Yellow')
      .setTitle('Uyarı Verildi')
      .setDescription(`${user.tag} kullanıcısına uyarı verildi.\nSebep: ${reason}`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
