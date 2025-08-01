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
    .setName('warnclear')
    .setDescription('Bir kullanıcının tüm uyarılarını temizler.')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Uyarıları temizlenecek kullanıcı')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const user = interaction.options.getUser('kullanıcı');
    const warnings = loadWarnings();

    if (!warnings[user.id] || warnings[user.id].length === 0) {
      return interaction.reply({ content: `${user.tag} kullanıcısının uyarısı yok.`, ephemeral: true });
    }

    delete warnings[user.id];
    saveWarnings(warnings);

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('Uyarılar Temizlendi')
      .setDescription(`${user.tag} kullanıcısının tüm uyarıları temizlendi.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
