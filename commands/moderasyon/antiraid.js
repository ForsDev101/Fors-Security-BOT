const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readJSON, writeJSON } = require('../../utils/fileHandler');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Anti-raid korumasını aç/kapat')
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
    try {
      await interaction.deferReply();
      const durum = interaction.options.getString('durum');
      const guildId = interaction.guild.id;

      let config = readJSON('./data/koruma.json');
      if (!config[guildId]) config[guildId] = {};
      config[guildId].antiraid = durum === 'ac';
      writeJSON('./data/koruma.json', config);

      const embed = new EmbedBuilder()
        .setTitle('🚨 Anti-Raid Koruması')
        .setDescription(`${interaction.user} Anti-Raid korumasını **${durum === 'ac' ? 'AÇTI' : 'KAPATTI'}**.`)
        .setFooter({ text: `Komut kullanan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await rpgEmbed(interaction, embed, 500);
    } catch (error) {
      console.error(error);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: 'Komut çalıştırılırken hata oluştu.', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Komut çalıştırılırken hata oluştu.', ephemeral: true });
      }
    }
  }
};
