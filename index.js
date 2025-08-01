require('dotenv').config();

const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Collection,
  REST, 
  Routes, 
  SlashCommandBuilder, 
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const {
  TOKEN,
  CLIENT_ID,
  GUILD_ID,
  ROLE_BOTYETKI,
  ROLE_KAYITSIZ
} = process.env;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();
const komutlar = [];

const korumaAyar = {
  aktif: false,
  antiraid: false,
  spamEngel: false,
  reklamEngel: false,
  capslockEngel: false,
  etiketEngel: false,
  rolKoruma: false,
  kanalKoruma: false,
  webhookKoruma: false,
  emojiKoruma: false,
  logKanal: null
};

const cezalar = {}; // userId: [{ tur, sebep, tarih }]

const AYAR_DOSYA = path.join(__dirname, 'korumaAyar.json');
const CEZA_DOSYA = path.join(__dirname, 'database.json');

// --- Load / Save Fonksiyonları ---
function ayarYukle() {
  if (fs.existsSync(AYAR_DOSYA)) {
    Object.assign(korumaAyar, JSON.parse(fs.readFileSync(AYAR_DOSYA, 'utf-8')));
  }
}
function ayarKaydet() {
  fs.writeFileSync(AYAR_DOSYA, JSON.stringify(korumaAyar, null, 2));
}
function cezaYukle() {
  if (fs.existsSync(CEZA_DOSYA)) {
    Object.assign(cezalar, JSON.parse(fs.readFileSync(CEZA_DOSYA, 'utf-8')));
  }
}
function cezaKaydet() {
  fs.writeFileSync(CEZA_DOSYA, JSON.stringify(cezalar, null, 2));
}

ayarYukle();
cezaYukle();

function tarihFormatla(date = new Date()) {
  return date.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
}

function yetkiKontrol(member) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (!ROLE_BOTYETKI) return false;
  return member.roles.cache.has(ROLE_BOTYETKI);
}

function cezaEkle(userId, tur, sebep) {
  if (!cezalar[userId]) cezalar[userId] = [];
  cezalar[userId].push({ tur, sebep, tarih: tarihFormatla() });
  cezaKaydet();
}

// Komut ekleme fonksiyonu
function komutEkle(name, desc, options = []) {
  const komut = new SlashCommandBuilder()
    .setName(name)
    .setDescription(desc)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

  for (const opt of options) {
    const method = {
      user: 'addUserOption',
      string: 'addStringOption',
      integer: 'addIntegerOption',
      number: 'addNumberOption',
      channel: 'addChannelOption'
    }[opt.type];
    if (method) {
      komut[method](o => o.setName(opt.name).setDescription(opt.description).setRequired(opt.required ?? false));
    }
  }

  komutlar.push(komut.toJSON());
  client.commands.set(name, { run: null });
}

// Moderasyon komutları
komutEkle('ban', 'Bir kullanıcıyı sunucudan yasakla.', [
  { name: 'kullanıcı', description: 'Yasaklanacak kullanıcı', type: 'user', required: true },
  { name: 'sebep', description: 'Yasaklama sebebi', type: 'string', required: false }
]);

komutEkle('kick', 'Bir kullanıcıyı sunucudan at.', [
  { name: 'kullanıcı', description: 'Atılacak kullanıcı', type: 'user', required: true },
  { name: 'sebep', description: 'Sebep', type: 'string', required: false }
]);

komutEkle('mute', 'Kullanıcıyı süreli sustur.', [
  { name: 'kullanıcı', description: 'Susturulacak kişi', type: 'user', required: true },
  { name: 'süre', description: 'Dakika cinsinden süre', type: 'integer', required: true }
]);

komutEkle('unmute', 'Susturmayı kaldır.', [
  { name: 'kullanıcı', description: 'Susturması kaldırılacak kişi', type: 'user', required: true }
]);

komutEkle('warn', 'Kullanıcıyı uyar.', [
  { name: 'kullanıcı', description: 'Uyarılacak kişi', type: 'user', required: true },
  { name: 'sebep', description: 'Uyarı sebebi', type: 'string', required: false }
]);

komutEkle('warnings', 'Uyarı geçmişini göster.', [
  { name: 'kullanıcı', description: 'Geçmişi görüntülenecek kişi', type: 'user', required: true }
]);

// Part 1 sonu, devamı part 2'de...
// Koruma komutları
const korumaKomutlar = [
  'koruma',
  'antiraid',
  'spam-engel',
  'reklam-engel',
  'capslock-engel',
  'etiket-engel',
  'rol-koruma',
  'kanal-koruma',
  'webhook-koruma',
  'emoji-koruma',
];

for (const k of korumaKomutlar) {
  komutEkle(k, `${k} sistemini açar veya kapatır.`, [
    { name: 'durum', description: '"aç" veya "kapat"', type: 'string', required: true },
  ]);
}

// Diğer komutlar
komutEkle('logkanali', 'Log kanalını ayarla.', [
  { name: 'kanal', description: 'Log kanalı seçin', type: 'channel', required: true },
]);

komutEkle('cezalar', 'Kullanıcının cezalarını gösterir.', [
  { name: 'kullanıcı', description: 'Cezaları görüntülenecek kullanıcı', type: 'user', required: true },
]);

komutEkle('cezaişlemler', 'Tüm ceza geçmişini listeler.');

komutEkle('koruma-durum', 'Koruma sistemlerinin durumunu gösterir.');

komutEkle('kayıt', 'Yeni üyeyi kayıt eder.', [
  { name: 'kullanıcı', description: 'Kayıt edilecek kullanıcı', type: 'user', required: true },
  { name: 'isim', description: 'İsim', type: 'string', required: true },
  { name: 'yaş', description: 'Yaş', type: 'integer', required: true },
]);

komutEkle('komutlar', 'Tüm komutları sayfalı ve emojili gösterir.');

komutEkle('emojiekle', 'Sunucuya emoji ekler.', [
  { name: 'isim', description: 'Emoji ismi', type: 'string', required: true },
  { name: 'url', description: 'Emoji resmi URL\'si', type: 'string', required: true },
]);

// --- Slash komutları deploy ---
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Slash komutlar deploy ediliyor...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: komutlar }
    );
    console.log('Komutlar başarıyla yüklendi!');
  } catch (error) {
    console.error('Komut deploy hatası:', error);
  }
})();

// --- Bot hazır olunca ---
client.once('ready', () => {
  console.log(`Bot hazır! Kullanıcı: ${client.user.tag}`);
});

// Part 2 burada bitti, devamı part 3'te var.
// --- EVENTLER ---

// Yeni üye sunucuya katılınca
client.on('guildMemberAdd', async (member) => {
  try {
    // Kayıtsız rolünü ver
    if (ROLE_KAYITSIZ) {
      const rol = member.guild.roles.cache.get(ROLE_KAYITSIZ);
      if (rol) await member.roles.add(rol);
    }

    // Hoşgeldin mesajı (sa, selam gibi karşılıklar için)
    const kanal = member.guild.systemChannel || member.guild.channels.cache.find(c => c.type === ChannelType.GuildText);
    if (kanal) {
      kanal.send(`Hoşgeldin ${member.user}, aramıza katıldığın için çok mutluyuz!`);
    }
  } catch (err) {
    console.error('guildMemberAdd event hatası:', err);
  }
});

// Mesaj geldiğinde kontrol (sa, selam vb. için)
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  const selamlar = [
    'sa',
    'Sa',
    'selam',
    'Selam',
    'slm',
    'Slm',
    'aleyküm selam',
    'Aleyküm selam',
    'selamun aleykum',
    'Selamun aleykum',
    'selamunaleykum',
    'Selamunaleykum',
  ];

  // Mesaj tam olarak bu kelimelerden biriyse cevap ver
  if (selamlar.some(s => msg.content.toLowerCase() === s.toLowerCase())) {
    msg.reply('Aleyküm selam, hoşgeldin!');
  }
});

// --- KOMUTLARIN ÇALIŞTIRILMASI ---

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, member, guild } = interaction;

  // Yetki kontrol
  if (!yetkiKontrol(member)) {
    return interaction.reply({ content: 'Bu komutu kullanmak için yetkiniz yok!', ephemeral: true });
  }

  try {
    switch (commandName) {
      case 'ban': {
        const kullanıcı = options.getUser('kullanıcı');
        const sebep = options.getString('sebep') || 'Belirtilmedi';
        const target = guild.members.cache.get(kullanıcı.id);
        if (!target) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });

        await target.ban({ reason: sebep });
        cezaEkle(kullanıcı.id, 'Ban', sebep);

        interaction.reply(`**${kullanıcı.tag}** sunucudan yasaklandı. Sebep: ${sebep}`);
        break;
      }

      case 'kick': {
        const kullanıcı = options.getUser('kullanıcı');
        const sebep = options.getString('sebep') || 'Belirtilmedi';
        const target = guild.members.cache.get(kullanıcı.id);
        if (!target) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });

        await target.kick(sebep);
        cezaEkle(kullanıcı.id, 'Kick', sebep);

        interaction.reply(`**${kullanıcı.tag}** sunucudan atıldı. Sebep: ${sebep}`);
        break;
      }

      // Devamı part 4'te...
      
      default:
        interaction.reply({ content: 'Bu komut henüz aktif değil veya bulunamadı.', ephemeral: true });
    }
  } catch (error) {
    console.error('Komut çalıştırma hatası:', error);
    interaction.reply({ content: 'Komut çalıştırılırken hata oluştu.', ephemeral: true });
  }
});
// Devamı komutlar...

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, member, guild } = interaction;

  // Yetki kontrol
  if (!yetkiKontrol(member)) {
    return interaction.reply({ content: 'Bu komutu kullanmak için yetkiniz yok!', ephemeral: true });
  }

  try {
    switch (commandName) {
      case 'mute': {
        const kullanıcı = options.getUser('kullanıcı');
        const süre = options.getInteger('süre');
        const target = guild.members.cache.get(kullanıcı.id);
        if (!target) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });

        const muteRol = guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
        if (!muteRol) return interaction.reply({ content: 'Mute rolü bulunamadı!', ephemeral: true });

        await target.roles.add(muteRol);
        setTimeout(() => {
          target.roles.remove(muteRol).catch(() => {});
        }, süre * 60000);

        cezaEkle(kullanıcı.id, 'Mute', `Süre: ${süre} dakika`);
        interaction.reply(`${kullanıcı.tag} ${süre} dakika susturuldu.`);
        break;
      }

      case 'unmute': {
        const kullanıcı = options.getUser('kullanıcı');
        const target = guild.members.cache.get(kullanıcı.id);
        if (!target) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });

        const muteRol = guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
        if (!muteRol) return interaction.reply({ content: 'Mute rolü bulunamadı!', ephemeral: true });

        await target.roles.remove(muteRol);
        cezaEkle(kullanıcı.id, 'Unmute', 'Susturması kaldırıldı');
        interaction.reply(`${kullanıcı.tag} artık susturulmadı.`);
        break;
      }

      case 'warn': {
        const kullanıcı = options.getUser('kullanıcı');
        const sebep = options.getString('sebep') || 'Sebep belirtilmedi';
        cezaEkle(kullanıcı.id, 'Uyarı', sebep);
        interaction.reply(`${kullanıcı.tag} uyarıldı. Sebep: ${sebep}`);
        break;
      }

      case 'warnings': {
        const kullanıcı = options.getUser('kullanıcı');
        const wlist = cezalar[kullanıcı.id] || [];
        if (!wlist.length) return interaction.reply(`${kullanıcı.tag} için uyarı bulunamadı.`);

        const liste = wlist.map((c, i) => `${i + 1}. [${c.tarih}] ${c.tur} - ${c.sebep}`).join('\n');
        interaction.reply({ content: `**${kullanıcı.tag}** uyarıları:\n${liste}`, ephemeral: true });
        break;
      }

      case 'clear': {
        const sayi = options.getInteger('sayı');
        if (sayi < 1 || sayi > 100) return interaction.reply({ content: '1 ile 100 arasında sayı girin.', ephemeral: true });

        const kanal = interaction.channel;
        const messages = await kanal.messages.fetch({ limit: sayi });
        await kanal.bulkDelete(messages, true);

        interaction.reply({ content: `${sayi} mesaj silindi.`, ephemeral: true });
        break;
      }

      case 'lock': {
        const kanal = interaction.channel;
        await kanal.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
        interaction.reply('Kanal kilitlendi, mesaj gönderimi engellendi.');
        break;
      }

      case 'unlock': {
        const kanal = interaction.channel;
        await kanal.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
        interaction.reply('Kanal kilidi kaldırıldı, mesaj gönderimi açıldı.');
        break;
      }

      case 'slowmode': {
        const saniye = options.getInteger('saniye');
        if (saniye < 0 || saniye > 21600) return interaction.reply({ content: '0 ile 21600 saniye arasında bir değer girin.', ephemeral: true });

        const kanal = interaction.channel;
        await kanal.setRateLimitPerUser(saniye);
        interaction.reply(`Kanalın yavaş modu ${saniye} saniye olarak ayarlandı.`);
        break;
      }

      case 'log-ayarla': {
        const kanal = options.getChannel('kanal');
        if (kanal.type !== ChannelType.GuildText) return interaction.reply({ content: 'Sadece yazı kanalı seçebilirsiniz.', ephemeral: true });

        korumaAyar.logKanal = kanal.id;
        ayarKaydet();
        interaction.reply(`Log kanalı ${kanal} olarak ayarlandı.`);
        break;
      }

      case 'emojiekle': {
        const url = options.getString('url');
        if (!url) return interaction.reply({ content: 'Emoji URL\'si gereklidir.', ephemeral: true });

        const emojiName = options.getString('isim') || 'emoji';
        try {
          const emoji = await guild.emojis.create(url, emojiName);
          interaction.reply(`Emoji başarıyla eklendi: ${emoji}`);
        } catch (error) {
          interaction.reply({ content: 'Emoji eklenirken hata oluştu.', ephemeral: true });
        }
        break;
      }

      default:
        interaction.reply({ content: 'Bilinmeyen komut.', ephemeral: true });
    }
  } catch (error) {
    console.error('Komut hatası:', error);
    interaction.reply({ content: 'Komut çalıştırılırken hata oluştu.', ephemeral: true });
  }
});

// --- BOT GİRİŞ ---
client.login(process.env.TOKEN);
