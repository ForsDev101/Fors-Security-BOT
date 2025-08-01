const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readJSON } = require('../../utils/fileHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kayıt')
    .setDescription('Yeni gelen üyeyi isim ve yaş ile kayıt eder')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Kayıt edilecek kullanıcıyı seç')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('isim')
        .setDescription('İsim')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('yaş')
        .setDescription('Yaş')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const kullanıcı = interaction.options.getUser('kullanıcı');
    const isim = interaction.options.getString('isim');
    const yaş = interaction.options.getInteger('yaş');

    const guild = interaction.guild;
    const member = guild.members.cache.get(kullanıcı.id);
    if (!member) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });

    const config = readJSON('./data/config.json')[guild.id];
    if (!config) return interaction.reply({ content: 'Sunucu yapılandırılmamış.', ephemeral: true });

    const kayıtRol = guild.roles.cache.get(config.uyeRoleId);
    const kayıtsızRol = guild.roles.cache.get(config.kayıtsızRoleId);
    if (!kayıtRol || !kayıtsızRol) return interaction.reply({ content: 'Rol ayarları eksik.', ephemeral: true });

    try {
      await member.roles.add(kayıtRol);
      await member.roles.remove(kayıtsızRol);
      await member.setNickname(`${isim} | ${yaş}`);

      const embed = new EmbedBuilder()
        .setTitle('Kayıt Başarılı ✅')
        .setDescription(`${kullanıcı} başarıyla kayıt edildi.\nİsim: **${isim}**\nYaş: **${yaş}**`)
        .setColor('Green')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch {
      return interaction.reply({ content: 'Kayıt sırasında bir hata oluştu.', ephemeral: true });
    }
  }
};
