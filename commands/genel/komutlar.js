const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const komutlarSayfalari = [
  {
    title: 'Koruma Komutları',
    description: `
/koruma — Tüm koruma sistemini aç/kapat
/antiraid — Raid korumasını aç/kapat
/spam-engel — Spam korumasını aç/kapat
/reklam-engel — Reklam korumasını aç/kapat
/capslock-engel — Büyük harf mesaj korumasını aç/kapat
/etiket-engel — @everyone, @here engelle
/rol-koruma — Rol silme/ekleme koruması
/kanal-koruma — Kanal silme/ekleme koruması
/webhook-koruma — Webhook koruması
/emoji-koruma — Emoji silme/ekleme koruması
    `
  },
  {
    title: 'Diğer Komutlar',
    description: `
/log-ayarla — Log kanalını ayarlar
/kayıt — Yeni gelen kullanıcıyı kayıt eder (isim ve yaşla)
/cezalar — Kişinin ceza geçmişini gösterir
/cezaişlemler — Tüm ceza geçmişini listeler
/koruma-durum — Koruma sistemlerinin aktiflik durumunu gösterir
/emojiekle — URL ile emoji yükler
/komutlar — Tüm komutları gösterir (bu sayfa)
    `
  }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('komutlar')
    .setDescription('Sayfalı ve emojili tüm komutları gösterir'),

  async execute(interaction) {
    let page = 0;

    const generateEmbed = (page) => {
      const pageData = komutlarSayfalari[page];
      return new EmbedBuilder()
        .setTitle(pageData.title)
        .setDescription(pageData.description)
        .setColor('Blue')
        .setFooter({ text: `Sayfa ${page + 1} / ${komutlarSayfalari.length}` });
    };

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('previous')
          .setLabel('⬅️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('➡️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(komutlarSayfalari.length <= 1)
      );

    const embedMessage = await interaction.reply({ embeds: [generateEmbed(page)], components: [row], fetchReply: true });

    const collector = embedMessage.createMessageComponentCollector({
      time: 60000
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'Bu butonları sadece komutu kullanan kişi kullanabilir.', ephemeral: true });
      }

      if (i.customId === 'next') {
        page++;
        if (page >= komutlarSayfalari.length) page = komutlarSayfalari.length - 1;
      } else if (i.customId === 'previous') {
        page--;
        if (page < 0) page = 0;
      }

      await i.update({ embeds: [generateEmbed(page)], components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('⬅️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('➡️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === komutlarSayfalari.length -1)
        )
      ]});
    });

    collector.on('end', async () => {
      if (!embedMessage.deleted) {
        await embedMessage.edit({ components: [] }).catch(() => {});
      }
    });
  }
};
