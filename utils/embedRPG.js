const renkler = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Aqua', 'Orange'];

async function rpgEmbed(interaction, embed, süre = 500) {
  let i = 0;
  const msg = await interaction.editReply({ embeds: [embed.setColor(renkler[i])] });

  const interval = setInterval(async () => {
    i = (i + 1) % renkler.length;
    try {
      await msg.edit({ embeds: [embed.setColor(renkler[i])] });
    } catch {
      clearInterval(interval);
    }
  }, süre);

  setTimeout(() => clearInterval(interval), 5000); // 5 saniye sonra durdur
}

module.exports = { rpgEmbed };
