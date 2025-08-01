const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'data', 'koruma.json');

function loadConfig() {
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath));
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('capslock-engel')
    .setDescription('Büyük harf mesaj korumasını aç/kapat')
    .addStringOption(option =>
      option.setName('durum')
        .setDescription('Aç veya kapat')
        .setRequired(true)
        .addChoices(
          { name: 'Aç', value: 'ac' },
          { name: 'Kapat', value: 'kapat' }
        ))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const durum = interaction.options.getString('durum');
    const guildId = interaction.guildId;
    let config = loadConfig();

    if (!config[guildId]) config[guildId] = {};

    config[guildId].capslockEngel = durum === 'ac';

    saveConfig(config);

    const embed = new EmbedBuilder()
      .setTitle('Büyük Harf Koruması')
      .setDescription(`Büyük harf mesaj koruması başarıyla **${durum === 'ac' ? 'açıldı' : 'kapatıldı'}**.`)
      .setColor(durum === 'ac' ? 'Green' : 'Red')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
