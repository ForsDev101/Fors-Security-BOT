require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Kullanıcıyı sunucudan banlar')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Banlanacak kullanıcı').setRequired(true))
    .addStringOption(option =>
      option.setName('sebep').setDescription('Ban sebebi').setRequired(false)),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kullanıcıyı sunucudan atar')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Atılacak kullanıcı').setRequired(true))
    .addStringOption(option =>
      option.setName('sebep').setDescription('Atılma sebebi').setRequired(false)),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Kullanıcıyı geçici olarak susturur')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Susturulacak kullanıcı').setRequired(true))
    .addStringOption(option =>
      option.setName('süre').setDescription('Süre (örn: 10m, 1h)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Susturmayı kaldırır')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Susturması kaldırılacak kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Timeout kaldırır')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Timeout kaldırılacak kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Kullanıcıya uyarı verir')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Uyarılacak kullanıcı').setRequired(true))
    .addStringOption(option =>
      option.setName('sebep').setDescription('Uyarı sebebi').setRequired(false)),

  new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Kullanıcının aldığı tüm uyarıları listeler')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Uyarıları görülecek kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Belirtilen kadar mesajı siler')
    .addIntegerOption(option =>
      option.setName('sayı').setDescription('Silinecek mesaj sayısı (1-100)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Kanalı kilitler'),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Kanal kilidini açar'),

  new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Kanala yavaş mod ekler')
    .addIntegerOption(option =>
      option.setName('saniye').setDescription('Yavaş mod süresi saniye cinsinden').setRequired(true)),

  new SlashCommandBuilder()
    .setName('cezalar')
    .setDescription('Kullanıcının aldığı cezaları gösterir')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Cezaları gösterilecek kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('cezaişlemler')
    .setDescription('Tüm ceza geçmişini listeler'),

  new SlashCommandBuilder()
    .setName('koruma-durum')
    .setDescription('Hangi korumalar açık, hangisi kapalı raporlar'),

  new SlashCommandBuilder()
    .setName('log-ayarla')
    .setDescription('Tüm ceza ve koruma logları için kanal ayarı')
    .addChannelOption(option =>
      option.setName('kanal').setDescription('Log kanalı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('kayıt')
    .setDescription('Kullanıcıyı kayıt eder')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Kayıt edilecek kullanıcı').setRequired(true))
    .addStringOption(option =>
      option.setName('isim').setDescription('Yeni isim').setRequired(true))
    .addStringOption(option =>
      option.setName('yaş').setDescription('Yaş').setRequired(true)),

  new SlashCommandBuilder()
    .setName('komutlar')
    .setDescription('Tüm komutları gösterir'),
];

// REST API
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('⚙️ Komutlar Discord\'a yükleniyor...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands.map(cmd => cmd.toJSON()) },
    );
    console.log('✅ Komutlar başarıyla yüklendi!');
  } catch (error) {
    console.error(error);
  }
})();
