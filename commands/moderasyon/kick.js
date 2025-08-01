import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Kullanıcıyı sunucudan atar')
  .addUserOption(option =>
    option.setName('kullanıcı')
      .setDescription('Atılacak kullanıcı')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('sebep')
      .setDescription('Atılma sebebi')
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction) {
  const user = interaction.options.getUser('kullanıcı');
  const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

  if (!interaction.guild) return interaction.reply({ content: 'Bu komut sadece sunucularda kullanılabilir.', ephemeral: true });

  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });

  if (!member.kickable) return interaction.reply({ content: 'Bu kullanıcıyı atamam.', ephemeral: true });

  try {
    await member.kick(sebep);
  } catch {
    return interaction.reply({ content: 'Atma sırasında hata oluştu.', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('Bir kullanıcı atıldı')
    .setColor('Orange')
    .addFields(
      { name: 'Kullanıcı', value: `${user.tag} (${user.id})` },
      { name: 'Yetkili', value: `${interaction.user.tag}` },
      { name: 'Sebep', value: sebep }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });

  const logModID = process.env.LOG_MOD;
  if (logModID) {
    const logChannel = interaction.guild.channels.cache.get(logModID);
    if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});
  }
}
