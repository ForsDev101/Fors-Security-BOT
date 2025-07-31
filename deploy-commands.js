require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı sunucudan banlar.')
    .addUserOption(opt =>
      opt.setName('kullanıcı').setDescription('Banlanacak kullanıcı').setRequired(true))
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Ban sebebi (isteğe bağlı)')),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Bir kullanıcıyı sunucudan atar.')
    .addUserOption(opt =>
      opt.setName('kullanıcı').setDescription('Atılacak kullanıcı').setRequired(true))
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Atılma sebebi (isteğe bağlı)')),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Kullanıcıyı belirli süreliğine susturur.')
    .addUserOption(opt =>
      opt.setName('kullanıcı').setDescription('Susturulacak kişi').setRequired(true))
    .addStringOption(opt =>
      opt.setName('süre').setDescription('Örn: 10m, 1h').setRequired(true)),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Kullanıcının susturmasını kaldırır.')
    .addUserOption(opt =>
      opt.setName('kullanıcı').setDescription('Susturması kaldırılacak kişi').setRequired(true)),

  new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Kullanıcının timeout süresini kaldırır.')
    .addUserOption(opt =>
      opt.setName('kullanıcı').setDescription('Timeout kaldırılacak kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Bir kullanıcıya uyarı verir.')
    .addUserOption(opt =>
      opt.setName('kullanıcı').setDescription('Uyarılacak kişi').setRequired(true))
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Uyarı sebebi').setRequired(true)),

  new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Kullanıcının uyarı geçmişini gösterir.')
    .addUserOption(opt =>
      opt.setName('kullanıcı').setDescription('Kimin uyarıları gösterilsin').setRequired(true)),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Mesajları toplu şekilde siler.')
    .addIntegerOption(opt =>
      opt.setName('sayı').setDescription('Silinecek mesaj sayısı (1-100)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Kanalı kilitler, herkesin yazmasını engeller.'),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Kanal kilidini açar, herkes mesaj yazabilir.'),

  new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Kanala yavaş mod ekler.')
    .addIntegerOption(opt =>
      opt.setName('saniye').setDescription('Saniye cinsinden süre (0-21600)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('cezalar')
    .setDescription('Bir kullanıcının tüm cezalarını gösterir.')
    .addUserOption(opt =>
      opt.setName('kullanıcı').setDescription('Ceza geçmişi gösterilecek kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('cezaişlemler')
    .setDescription('Tüm sunucudaki ceza işlemlerini listeler.'),

  new SlashCommandBuilder()
    .setName('koruma-durum')
    .setDescription('Açık ve kapalı olan koruma sistemlerini listeler.'),

  new SlashCommandBuilder()
    .setName('log-ayarla')
    .setDescription('Koruma ve moderasyon log kanalını ayarlar.')
    .addChannelOption(opt =>
      opt.setName('kanal').setDescription('Logların gönderileceği kanal').setRequired(true)),

  new SlashCommandBuilder()
    .setName('kayıt')
    .setDescription('Bir kullanıcıyı kayıt eder.')
    .addUserOption(opt =>
      opt.setName('kullanıcı').setDescription('Kayıt edilecek kişi').setRequired(true))
    .addStringOption(opt =>
      opt.setName('isim').setDescription('İsim').setRequired(true))
    .addStringOption(opt =>
      opt.setName('yaş').setDescription('Yaş').setRequired(true)),

  new SlashCommandBuilder()
    .setName('komutlar')
    .setDescription('Botun tüm komutlarını sayfalı şekilde listeler.'),
]
  .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('💾 Slash komutlar yükleniyor...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Slash komutlar başarıyla yüklendi.');
  } catch (error) {
    console.error('❌ Komut yüklenirken hata:', error);
  }
})();
