const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { readJSON } = require('../../utils/fileHandler');
const { rpgEmbed } = require('../../utils/embedRPG');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kayıt')
    .setDescription('Yeni gelen üyeyi kayıt eder')
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
    try {
      await interaction.deferReply();

      const kullanıcı = interaction.options.getUser('kullanıcı');
      const isim = interaction.options.getString('isim');
      const yaş = interaction.options.getInteger('yaş');
      const guild = interaction.guild;
      const member = guild.members.cache.get(kullanıcı.id);

      const config = readJSON('./data/config.json')[guild.id];
      if (!config) {
        return await interaction.editReply({ content: '⚠️ Sunucu ayarları yapılmamış.' });
      }

      const uyeRol = guild.roles.cache.get(config.uyeRoleId);
      const kayıtsızRol = guild.roles.cache.get(config.kayıtsızRoleId);

      if (!uyeRol || !kayıtsızRol) {
        return await interaction.editReply({ content: '⚠️ Rol ayarları eksik.' });
      }

      await member.roles.add(uyeRol);
      await member.roles.remove(kayıtsızRol);
      await member.setNickname(`${isim} | ${yaş}`);

      const embed = new EmbedBuilder()
        .setTitle('✅ Kayıt Başarılı')
        .setDescription(`${member} başarıyla kayıt edildi!\n\n**İsim:** ${isim}\n**Yaş:** ${yaş}`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Kayıt yapan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
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
