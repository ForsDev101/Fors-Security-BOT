const { readJSON } = require('../utils/fileHandler');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      const config = readJSON('./data/config.json')[member.guild.id];
      if (!config) return;

      const kayıtsızRol = member.guild.roles.cache.get(config.kayıtsızRoleId);
      if (kayıtsızRol) {
        await member.roles.add(kayıtsızRol);
      }
    } catch (err) {
      console.error('guildMemberAdd hatası:', err);
    }
  }
};
