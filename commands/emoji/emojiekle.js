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
        .setDescription('Emoji URL\'si')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const isim = interaction.options.getString('isim');
      const url = interaction.options.getString('url');

      const emoji = await interaction.guild.emojis.create({ attachment: url, name: isim });

      const embed = new EmbedBuilder()
        .setTitle('🎭 Emoji Eklendi')
        .setDescription(`Yeni emoji eklendi: ${emoji}`)
        .setFooter({ text: `Ekleyen: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
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
