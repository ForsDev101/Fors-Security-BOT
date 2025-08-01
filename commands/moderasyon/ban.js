const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı yasaklar')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Yasaklanacak kullanıcı')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Yasaklama sebebi')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const user = interaction.options.getUser('kullanıcı');
      const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
      const member = await interaction.guild.members.fetch(user.id);

      if (!member.bannable) {
        return await interaction.editReply({ content: '❌ Bu kullanıcıyı banlayamam.' });
      }

      await member.ban({ reason });

      const embed = new EmbedBuilder()
        .setTitle('⛔ Kullanıcı Banlandı')
        .setDescription(`${user} sunucudan banlandı.\n**Sebep:** ${reason}`)
        .setFooter({ text: `Banlayan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
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
