const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Mesajları siler')
    .addIntegerOption(option =>
      option.setName('miktar')
        .setDescription('Silinecek mesaj sayısı (1-100)')
        .setRequired(true)),
  defaultMemberPermissions: PermissionFlagsBits.ManageMessages,

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const miktar = interaction.options.getInteger('miktar');
      if (miktar < 1 || miktar > 100) {
        return await interaction.editReply('❌ Lütfen 1 ile 100 arasında bir sayı giriniz.');
      }

      const silinen = await interaction.channel.bulkDelete(miktar, true);

      await interaction.editReply(`✅ Başarıyla ${silinen.size} mesaj silindi.`);
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
