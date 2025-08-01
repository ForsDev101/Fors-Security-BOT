const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Bir kullanıcıyı susturur')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Susturulacak kullanıcı')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Susturma sebebi')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const user = interaction.options.getUser('kullanıcı');
      const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
      const member = await interaction.guild.members.fetch(user.id);

      if (!member.moderatable) {
        return await interaction.editReply({ content: '❌ Bu kullanıcıyı susturamıyorum.' });
      }

      await member.timeout(15 * 60 * 1000, reason); // 15 dk timeout

      const embed = new EmbedBuilder()
        .setTitle('🔇 Kullanıcı Susturuldu')
        .setDescription(`${user} susturuldu.\n**Sebep:** ${reason}`)
        .setFooter({ text: `Susturan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
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
