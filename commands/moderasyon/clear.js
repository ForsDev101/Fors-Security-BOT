const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Belirtilen miktarda mesaj siler.')
    .addIntegerOption(option =>
      option.setName('miktar')
        .setDescription('Silinecek mesaj sayısı (1-100)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const miktar = interaction.options.getInteger('miktar');
    if (miktar < 1 || miktar > 100) {
      return interaction.reply({ content: 'Lütfen 1 ile 100 arasında bir sayı giriniz.', ephemeral: true });
    }

    try {
      const deleted = await interaction.channel.bulkDelete(miktar, true);
      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('Mesajlar Silindi')
        .setDescription(`${deleted.size} mesaj başarıyla silindi.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Mesajlar silinirken bir hata oluştu.', ephemeral: true });
    }
  }
};
