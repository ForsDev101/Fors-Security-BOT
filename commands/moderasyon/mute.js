import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Kullanıcıyı belirli dakikalar susturur')
  .addUserOption(option =>
    option.setName('kullanıcı')
      .setDescription('Susturulacak kullanıcı')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('süre')
      .setDescription('Süre (dakika)')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction) {
  const user = interaction.options.getUser('kullanıcı');
  const süre = interaction.options.getInteger('süre');

  if (!interaction.guild) return interaction.reply({ content: 'Bu komut sadece sunucularda kullanılabilir.', ephemeral: true });

  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });

  if (!member.moderatable) return interaction.reply({ content: 'Bu kullanıcıyı susturamam.', ephemeral: true });

  try {
    await member.timeout(süre * 60 * 1000, `Mute: ${interaction.user.tag}`);
  } catch {
    return interaction.reply({ content: 'Susturma sırasında hata oluştu.', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('Bir kullanıcı susturuldu')
    .setColor('Yellow')
    .addFields(
      { name: 'Kullanıcı', value: `${user.tag} (${user.id})` },
      { name: 'Yetkili', value: `${interaction.user.tag}` },
      { name: 'Süre', value: `${süre} dakika` }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });

  const logModID = process.env.LOG_MOD;
  if (logModID) {
    const logChannel = interaction.guild.channels.cache.get(logModID);
    if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});
  }
}
