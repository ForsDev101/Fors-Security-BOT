const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emojiekle')
    .setDescription('URL ile emoji ekler')
    .addStringOption(option =>
      option.setName('isim')
        .setDescription('Emoji ismi')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('url')
        .setDescription('Emoji URL\'si (png, jpg, gif)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const isim = interaction.options.getString('isim');
      const url = interaction.options.getString('url');

      if (!url.match(/\.(jpg|jpeg|png|gif)$/)) {
        return await interaction.editReply('❌ Geçerli bir resim URL\'si giriniz (jpg, png, gif).');
      }

      const emoji = await interaction.guild.emojis.create({ attachment: url, name: isim });

      const embed = new EmbedBuilder()
        .setTitle('🎭 Emoji Eklendi')
        .setDescription(`Yeni emoji eklendi: ${emoji}`)
        .addFields(
          { name: 'İsim', value: isim, inline: true },
          { name: 'URL', value: url, inline: true }
        )
        .setFooter({ text: `Ekleyen: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await rpgEmbed(interaction, embed, 500);

    } catch (error) {
      console.error(error);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: '⚠️ Emoji eklenirken hata oluştu.', ephemeral: true });
      } else {
        await interaction.reply({ content: '⚠️ Emoji eklenirken hata oluştu.', ephemeral: true });
      }
    }
  }
};
