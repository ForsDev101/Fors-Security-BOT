const { EmbedBuilder } = require('discord.js');
const { readJSON } = require('./fileHandler');

async function sendLog(client, guildId, type, description) {
  const config = readJSON('./data/config.json')[guildId];
  if (!config || !config.logChannelId) return;

  const logChannel = client.channels.cache.get(config.logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle(`📢 ${type}`)
    .setDescription(description)
    .setColor('Orange')
    .setTimestamp();

  try {
    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Log gönderme hatası:', error);
  }
}

module.exports = { sendLog };
