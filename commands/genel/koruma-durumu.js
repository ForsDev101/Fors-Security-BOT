const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readJSON } = require('../../utils/fileHandler');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('koruma-durum')
    .setDescription('Koruma sistemlerinin aktiflik durumunu gösterir'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const guildId = interaction.guild.id;
      const korumaData = readJSON('./data/koruma.json')[guildId];

      if (!korumaData) {
        return await interaction.editReply({ content: '⚠️ Bu sunucu için koruma ayarları bulunmamaktadır.' });
      }

      const embed = new EmbedBuilder()
        .setTitle('📊 Koruma Durumu')
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
        )
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
