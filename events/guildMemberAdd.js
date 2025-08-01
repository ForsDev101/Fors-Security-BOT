// Yeni üye sunucuya katılınca çalışan event
module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      // Otomatik Kayıtsız rolü verme
      const config = require('../data/config.json')[member.guild.id];
      if (!config) return;

      const kayıtsızRolId = config.kayıtsızRoleId;
      if (!kayıtsızRolId) return;

      const role = member.guild.roles.cache.get(kayıtsızRolId);
      if (!role) return;

      await member.roles.add(role);

      // Log kanalı varsa hoşgeldin mesajı gönder (isteğe bağlı)
      const logChannelId = config.logChannelId;
      if (!logChannelId) return;

      const channel = member.guild.channels.cache.get(logChannelId);
      if (!channel) return;

      channel.send(`🎉 ${member.user.tag} sunucuya katıldı! Otomatik olarak kayıtsız rolü verildi.`);
    } catch (error) {
      console.error('guildMemberAdd event hatası:', error);
    }
  }
};
