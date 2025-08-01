const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emojiekle')
    .setDescription('URL ile emoji yükler ve sunucuya ekler')
    .addStringOption(option => 
      option.setName('url')
        .setDescription('Emoji URL\'si')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('isim')
        .setDescription('Emoji ismi')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers),

  async execute(interaction) {
    const url = interaction.options.getString('url');
    const isim = interaction.options.getString('isim');

    if (!url.startsWith('http')) 
      return interaction.reply({ content: 'Lütfen geçerli bir URL gir!', ephemeral: true });

    try {
      const emoji = await interaction.guild.emojis.create({ attachment: url, name: isim });
      const embed = new EmbedBuilder()
        .setTitle('Emoji Eklendi 🎉')
        .setDescription(`Başarıyla emoji eklendi: ${emoji}`)
        .setColor('Green')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'Emoji eklenirken hata oluştu.', ephemeral: true });
    }
  }
};
