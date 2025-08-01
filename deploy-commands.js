require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder().setName('ban').setDescription('Kullanıcıyı sunucudan banlar')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Banlanacak kişi').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Ban sebebi')),

  new SlashCommandBuilder().setName('kick').setDescription('Kullanıcıyı sunucudan atar')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Kick atılacak kişi').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Kick sebebi')),

  new SlashCommandBuilder().setName('mute').setDescription('Kullanıcıyı susturur')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Susturulacak kişi').setRequired(true))
    .addStringOption(opt => opt.setName('süre').setDescription('Mute süresi, örn: 10m')),

  new SlashCommandBuilder().setName('unmute').setDescription('Kullanıcının susturmasını kaldırır')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Susturması kaldırılacak kişi').setRequired(true)),

  new SlashCommandBuilder().setName('untimeout').setDescription('Timeout kaldırır')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Timeout kaldırılacak kişi').setRequired(true)),

  new SlashCommandBuilder().setName('warn').setDescription('Kullanıcıyı uyarır')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Uyarılacak kişi').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Uyarı sebebi')),

  new SlashCommandBuilder().setName('warnings').setDescription('Kullanıcının uyarılarını gösterir')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Uyarılar gösterilecek kişi').setRequired(true)),

  new SlashCommandBuilder().setName('clear').setDescription('Mesajları siler')
    .addIntegerOption(opt => opt.setName('sayı').setDescription('Silinecek mesaj sayısı (1-100)').setRequired(true)),

  new SlashCommandBuilder().setName('lock').setDescription('Kanalı kilitler'),

  new SlashCommandBuilder().setName('unlock').setDescription('Kanal kilidini açar'),

  new SlashCommandBuilder().setName('slowmode').setDescription('Yavaş mod ayarlar')
    .addIntegerOption(opt => opt.setName('saniye').setDescription('Saniye (0-21600)').setRequired(true)),

  new SlashCommandBuilder().setName('cezalar').setDescription('Kullanıcının cezalarını gösterir')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Ceza geçmişi gösterilecek kişi').setRequired(true)),

  new SlashCommandBuilder().setName('cezaişlemler').setDescription('Tüm ceza işlemlerini listeler'),

  new SlashCommandBuilder().setName('koruma-durum').setDescription('Koruma sistemlerinin durumunu gösterir'),

  new SlashCommandBuilder().setName('log-ayarla').setDescription('Log kanalı ayarla')
    .addChannelOption(opt => opt.setName('kanal').setDescription('Log kanalı').setRequired(true)),

  new SlashCommandBuilder().setName('kayıt').setDescription('Bir kullanıcıyı kaydeder')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Kayıt edilecek kişi').setRequired(true))
    .addStringOption(opt => opt.setName('isim').setDescription('Kullanıcının ismi').setRequired(true))
    .addStringOption(opt => opt.setName('yaş').setDescription('Kullanıcının yaşı').setRequired(true)),

  new SlashCommandBuilder().setName('komutlar').setDescription('Tüm komutları gösterir 📖'),
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🚀 Slash komutlar yükleniyor...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('✅ Slash komutlar başarıyla yüklendi.');
  } catch (error) {
    console.error('❌ Slash komut yükleme hatası:', error);
  }
})();
