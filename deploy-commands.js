require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // Botun uygulama ID'si

// Komut tanımları (index.js'deki komut yapısına uygun)
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
    .addStringOption(option => option.setName('sebep').setDescription('Atılma sebebi').setRequired(false)),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Belirtilen kişiyi geçici olarak susturur.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Susturulacak kullanıcı').setRequired(true))
    .addStringOption(option => option.setName('süre').setDescription('Süre (ör: 10m, 1h)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Susturmayı kaldırır.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Susturması kaldırılacak kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Kullanıcıya uyarı verir.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Uyarılacak kullanıcı').setRequired(true))
    .addStringOption(option => option.setName('sebep').setDescription('Uyarı sebebi').setRequired(false)),

  new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Kullanıcının aldığı tüm uyarıları listeler.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Belirtilen kadar mesajı siler.')
    .addIntegerOption(option => option.setName('sayı').setDescription('Silinecek mesaj sayısı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Kanalı kilitler.'),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Kanalın kilidini açar.'),

  new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Kanala yavaş mod ekler.')
    .addIntegerOption(option => option.setName('saniye').setDescription('Saniye cinsinden').setRequired(true)),

  new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Timeout kaldırır.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Timeout kaldırılacak kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('cezalar')
    .setDescription('Kullanıcının aldığı cezaları gösterir.')
    .addUserOption(option => option.setName('kullanıcı').setDescription('Kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('cezaişlemler')
    .setDescription('Tüm ceza geçmişini listeler.'),

  new SlashCommandBuilder()
    .setName('koruma')
    .setDescription('Tüm koruma sistemlerini aktif eder/devre dışı bırakır.')
    .addStringOption(option => option.setName('durum').setDescription('ac veya kapat').setRequired(true).addChoices(
      { name: 'ac', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Yeni gelen spam botlara karşı koruma sağlar.')
    .addStringOption(option => option.setName('durum').setDescription('ac veya kapat').setRequired(true).addChoices(
      { name: 'ac', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('spam-engel')
    .setDescription('Aynı mesajı hızlıca atanları engeller.')
    .addStringOption(option => option.setName('durum').setDescription('ac veya kapat').setRequired(true).addChoices(
      { name: 'ac', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('reklam-engel')
    .setDescription('Link, davet, reklam içeriklerini engeller.')
    .addStringOption(option => option.setName('durum').setDescription('ac veya kapat').setRequired(true).addChoices(
      { name: 'ac', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('capslock-engel')
    .setDescription('Tamamen büyük harf yazanları engeller.')
    .addStringOption(option => option.setName('durum').setDescription('ac veya kapat').setRequired(true).addChoices(
      { name: 'ac', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('etiket-engel')
    .setDescription('Herkesi etiketleyenleri engeller.')
    .addStringOption(option => option.setName('durum').setDescription('ac veya kapat').setRequired(true).addChoices(
      { name: 'ac', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('rol-koruma')
    .setDescription('Yetkisiz rol silme/ekleme işlemlerini engeller.')
    .addStringOption(option => option.setName('durum').setDescription('ac veya kapat').setRequired(true).addChoices(
      { name: 'ac', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('kanal-koruma')
    .setDescription('Yetkisiz kanal silme/ekleme işlemlerini engeller.')
    .addStringOption(option => option.setName('durum').setDescription('ac veya kapat').setRequired(true).addChoices(
      { name: 'ac', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('webhook-koruma')
    .setDescription('Webhook spamını engeller.')
    .addStringOption(option => option.setName('durum').setDescription('ac veya kapat').setRequired(true).addChoices(
      { name: 'ac', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('emoji-koruma')
    .setDescription('Sunucu emojilerini korur.')
    .addStringOption(option => option.setName('durum').setDescription('ac veya kapat').setRequired(true).addChoices(
      { name: 'ac', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('log-ayarla')
    .setDescription('Tüm ceza ve koruma logları için kanal ayarı.')
    .addChannelOption(option => option.setName('kanal').setDescription('Log kanalı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('komutlar')
    .setDescription('Tüm komutları sayfalı olarak gösterir.')
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Slash komutlar yükleniyor...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands.map(command => command.toJSON()) }
    );
    console.log('Slash komutlar yüklendi.');
  } catch (error) {
    console.error('Komut yüklenirken hata oluştu:', error);
  }
})();
