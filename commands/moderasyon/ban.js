import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Kullanıcıyı sunucudan yasaklar')
  .addUserOption(option =>
    option.setName('kullanıcı')
      .setDescription('Banlanacak kullanıcı')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('sebep')
      .setDescription('Ban sebebi')
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction) {
  const user = interaction.options.getUser('kullanıcı');
  const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

  if (!interaction.guild) return interaction.reply({ content: 'Bu komut sadece sunucularda kullanılabilir.', ephemeral: true });

  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });

  if (!member.bannable) return interaction.reply({ content: 'Bu kullanıcıyı yasaklayamam.', ephemeral: true });

  try {
    await member.ban({ reason: sebep });
  } catch (error) {
    return interaction.reply({ content: 'Banlama sırasında hata oluştu.', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('Bir kullanıcı yasaklandı')
    .setColor('Red')
    .addFields(
      { name: 'Kullanıcı', value: `${user.tag} (${user.id})` },
      { name: 'Yetkili', value: `${interaction.user.tag}` },
      { name: 'Sebep', value: sebep }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });

  // Log kanalı varsa logla
  const logModID = process.env.LOG_MOD;
  if (logModID) {
    const logChannel = interaction.guild.channels.cache.get(logModID);
    if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});
  }
}
