require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID; // Botun ID'si
const guildId = process.env.GUILD_ID;   // Komutları test edeceğin sunucu ID'si (geliştirme için guild scope)

const commands = [
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Kullanıcıyı sunucudan banlar.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Banlanacak kullanıcı').setRequired(true))
    .addStringOption(option => option.setName('sebep').setDescription('Ban sebebi').setRequired(false)),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kullanıcıyı sunucudan atar.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Atılacak kullanıcı').setRequired(true))
    .addStringOption(option => option.setName('sebep').setDescription('Atma sebebi').setRequired(false)),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Kullanıcıyı geçici olarak susturur.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Susturulacak kullanıcı').setRequired(true))
    .addStringOption(option => option.setName('süre').setDescription('Susturma süresi (örn: 10m, 1h)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Susturmayı kaldırır.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Susturması kaldırılacak kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Timeoutu kaldırır.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Timeout kaldırılacak kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Kullanıcıya uyarı verir.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Uyarılacak kullanıcı').setRequired(true))
    .addStringOption(option => option.setName('sebep').setDescription('Uyarı sebebi').setRequired(false)),

  new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Kullanıcının uyarılarını gösterir.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Uyarıları görülecek kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Mesajları siler.')
    .addIntegerOption(option => option.setName('sayı').setDescription('Silinecek mesaj sayısı (1-100)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Kanalı kilitler.'),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Kanal kilidini açar.'),

  new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Kanal için yavaş mod ayarlar.')
    .addIntegerOption(option => option.setName('saniye').setDescription('Yavaş mod süresi (0-21600 saniye)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('cezalar')
    .setDescription('Kullanıcının cezalarını gösterir.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Cezaları görülecek kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('cezaişlemler')
    .setDescription('Tüm ceza geçmişini gösterir.'),

  new SlashCommandBuilder()
    .setName('koruma-durum')
    .setDescription('Koruma sistemlerinin durumunu gösterir.'),

  new SlashCommandBuilder()
    .setName('log-ayarla')
    .setDescription('Log kanalı ayarlar.')
    .addChannelOption(option => option.setName('kanal').setDescription('Log kanalı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('kayıt')
    .setDescription('Kullanıcıyı kayıt eder.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Kayıt edilecek kullanıcı').setRequired(true))
    .addStringOption(option => option.setName('isim').setDescription('Kullanıcının ismi').setRequired(true))
    .addStringOption(option => option.setName('yaş').setDescription('Kullanıcının yaşı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('komutlar')
    .setDescription('Bot komutlarını gösterir.'),
  
  // Koruma komutları (aç/kapat şeklinde)
  ...[
    'koruma', 'antiraid', 'spam-engel', 'reklam-engel', 'capslock-engel',
    'etiket-engel', 'rol-koruma', 'kanal-koruma', 'webhook-koruma', 'emoji-koruma'
  ].map(name =>
    new SlashCommandBuilder()
      .setName(name)
      .setDescription(`${name} korumasını açar/kapatır.`)
      .addStringOption(opt =>
        opt.setName('durum')
          .setDescription('aç veya kapat')
          .setRequired(true)
          .addChoices(
            { name: 'aç', value: 'aç' },
            { name: 'kapat', value: 'kapat' }
          )
      )
  )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Slash komutları Discord’a kaydediliyor...');
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );
    console.log('Slash komutları başarıyla kaydedildi!');
  } catch (error) {
    console.error('Slash komut kaydetme hatası:', error);
  }
})();
