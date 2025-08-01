const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Bir kullanıcıya timeout verir')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Timeout verilecek kullanıcı')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('süre')
        .setDescription('Süre (dakika cinsinden)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Timeout sebebi')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const user = interaction.options.getUser('kullanıcı');
      const sure = interaction.options.getInteger('süre');
      const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
      const member = await interaction.guild.members.fetch(user.id);

      if (!member.moderatable) {
        return await interaction.editReply({ content: '❌ Bu kullanıcıya timeout veremiyorum.' });
      }

      await member.timeout(sure * 60 * 1000, reason);

      const embed = new EmbedBuilder()
        .setTitle('⏳ Kullanıcıya Timeout Verildi')
        .setDescription(`${user} kullanıcısına ${sure} dakika timeout verildi.\n**Sebep:** ${reason}`)
        .setFooter({ text: `Timeout veren: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await rpgEmbed(interaction, embed, 500);
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
