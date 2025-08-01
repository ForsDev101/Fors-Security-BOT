const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readJSON } = require('../../utils/fileHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kayıt')
    .setDescription('Yeni gelen üyeyi isim ve yaş ile kayıt eder')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Kayıt edilecek kullanıcı')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('isim')
        .setDescription('Kullanıcının ismi')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('yaş')
        .setDescription('Kullanıcının yaşı')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false }); // Hem süre aşımı olmasın hem herkese görünsün

    const kullanıcı = interaction.options.getUser('kullanıcı');
    const isim = interaction.options.getString('isim');
    const yaş = interaction.options.getInteger('yaş');

    const guild = interaction.guild;
    const member = guild.members.cache.get(kullanıcı.id);
    if (!member) {
      return interaction.editReply({ content: 'Kullanıcı sunucuda bulunamadı.' });
    }

    // Config.json'dan rol ID'lerini çek
    const config = readJSON('./data/config.json')[guild.id];
    if (!config) {
      return interaction.editReply({ content: 'Sunucu ayarları yapılandırılmamış.' });
    }

    const uyeRol = guild.roles.cache.get(config.uyeRoleId);
    const kayıtsızRol = guild.roles.cache.get(config.kayıtsızRoleId);
    if (!uyeRol || !kayıtsızRol) {
      return interaction.editReply({ content: 'Rol ayarları eksik.' });
    }

    try {
      // Rol işlemleri
      await member.roles.add(uyeRol);
      await member.roles.remove(kayıtsızRol);

      // Kullanıcı adını değiştirme
      await member.setNickname(`${isim} | ${yaş}`);

      // Rastgele embed rengi
      const renkler = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Aqua', 'Orange'];
      const rastgeleRenk = renkler[Math.floor(Math.random() * renkler.length)];

      // Embed
      const embed = new EmbedBuilder()
        .setTitle('✅ Kayıt Başarılı')
        .setDescription(`${member} başarıyla kayıt edildi!\n\n**İsim:** ${isim}\n**Yaş:** ${yaş}`)
        .setColor(rastgeleRenk)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Kayıt yapan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      // Embed yanıtı
      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      return interaction.editReply({ content: 'Kayıt sırasında bir hata oluştu.' });
    }
  }
};
