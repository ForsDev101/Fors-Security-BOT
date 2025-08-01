const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readJSON } = require('../../utils/fileHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('koruma-durum')
    .setDescription('Koruma sistemlerinin aktiflik durumunu gösterir'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const guildId = interaction.guild.id;
    const korumaData = readJSON('./data/koruma.json')[guildId];

    if (!korumaData) {
      return interaction.editReply({ content: '❌ Bu sunucu için koruma ayarları bulunamadı.' });
    }

    const renkler = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Aqua', 'Orange'];
    const rastgeleRenk = renkler[Math.floor(Math.random() * renkler.length)];

    const embed = new EmbedBuilder()
      .setTitle('📊 Koruma Durumu')
      .setColor(rastgeleRenk)
      .setFooter({ text: `Komut kullanan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp()
      .addFields(
        { name: 'Genel Koruma', value: korumaData.koruma ? '✅ Açık' : '❌ Kapalı', inline: true },
        { name: 'Anti-Raid', value: korumaData.antiraid ? '✅ Açık' : '❌ Kapalı', inline: true },
        { name: 'Spam Engel', value: korumaData.spamEngel ? '✅ Açık' : '❌ Kapalı', inline: true },
        { name: 'Reklam Engel', value: korumaData.reklamEngel ? '✅ Açık' : '❌ Kapalı', inline: true },
        { name: 'Capslock Engel', value: korumaData.capslockEngel ? '✅ Açık' : '❌ Kapalı', inline: true },
        { name: 'Etiket Engel', value: korumaData.etiketEngel ? '✅ Açık' : '❌ Kapalı', inline: true },
        { name: 'Rol Koruma', value: korumaData.rolKoruma ? '✅ Açık' : '❌ Kapalı', inline: true },
        { name: 'Kanal Koruma', value: korumaData.kanalKoruma ? '✅ Açık' : '❌ Kapalı', inline: true },
        { name: 'Webhook Koruma', value: korumaData.webhookKoruma ? '✅ Açık' : '❌ Kapalı', inline: true },
        { name: 'Emoji Koruma', value: korumaData.emojiKoruma ? '✅ Açık' : '❌ Kapalı', inline: true }
      );

    await interaction.editReply({ embeds: [embed] });
  }
};
