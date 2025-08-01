const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('komutlar')
    .setDescription('Tüm komutların sayfalı listesi'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const pages = [
        new EmbedBuilder()
          .setTitle('📜 Sayfa 1 - Moderasyon Komutları')
          .setDescription('`/ban`, `/unban`, `/mute`, `/unmute`, `/timeout`, `/untimeout`, `/warn`, `/warnings`, `/warnclear`, `/clear`, `/lock`, `/unlock`, `/slowmode`, `/unslowmode`')
          .setTimestamp(),

        new EmbedBuilder()
          .setTitle('🛡️ Sayfa 2 - Koruma Komutları')
          .setDescription('`/koruma`, `/antiraid`, `/spam-engel`, `/reklam-engel`, `/capslock-engel`, `/etiket-engel`, `/rol-koruma`, `/kanal-koruma`, `/webhook-koruma`, `/emoji-koruma`, `/koruma-durum`')
          .setTimestamp(),

        new EmbedBuilder()
          .setTitle('⚙️ Sayfa 3 - Diğer Komutlar')
          .setDescription('`/komutlar`, `/emojiekle`, `/kayıt`')
          .setTimestamp()
      ];

      let currentPage = 0;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('prev').setLabel('⬅️ Geri').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('next').setLabel('İleri ➡️').setStyle(ButtonStyle.Secondary)
      );

      const message = await interaction.editReply({ embeds: [pages[currentPage]], components: [row] });
      rpgEmbed(interaction, pages[currentPage], 500);

      const collector = message.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: 'Bu butonları sadece komutu kullanan kişi kullanabilir.', ephemeral: true });
        }
        if (i.customId === 'prev') {
          currentPage = currentPage > 0 ? --currentPage : pages.length - 1;
        } else if (i.customId === 'next') {
          currentPage = currentPage + 1 < pages.length ? ++currentPage : 0;
        }
        await i.update({ embeds: [pages[currentPage]], components: [row] });
        rpgEmbed(interaction, pages[currentPage], 500);
      });
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
