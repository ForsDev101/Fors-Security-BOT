// PART 1: Temel Kurulum, Env ve Komut Tanımları

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
} = require('discord.js');

const fs = require('fs');
const path = require('path');

// --- ENV ---
const {
  TOKEN,
  CLIENT_ID,
  GUILD_ID,
  LOG_GELENGIDEN,
  LOG_KOMUT,
  LOG_MOD,
  ROLE_BOTYETKI,
  ROLE_KAYITSIZ,
  ROLE_UYE,
  LOG_GENERAL,       // Genel log kanalı (gelen-giden vs hariç)
} = process.env;

// --- CLIENT ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

// --- GLOBAL VERİLER ---
const komutlar = [];
const cezalar = {}; // { userId: [ { tur, sebep, tarih } ] }
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
  logKanal: null, // /logkanali komutuyla setlenecek (LOG_GENERAL’den ayrı)
};

const spamKontrol = new Map();

// --- DOSYA YOLLARI ---
const AYAR_DOSYA = path.join(__dirname, 'korumaAyar.json');
const CEZA_DOSYA = path.join(__dirname, 'database.json');

// --- DOSYA YÜKLEME/KAYDETME ---
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

// --- YARDIMCI FONKSİYONLAR ---
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

// --- KOMUT KAYIT FONKSİYONU ---
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
      channel: 'addChannelOption',
    }[opt.type];
    if (method) {
      komut[method]((o) =>
        o.setName(opt.name).setDescription(opt.description).setRequired(opt.required ?? false)
      );
    }
  }

  komutlar.push(komut.toJSON());
  client.commands.set(name, { run: null }); // Daha sonra fonksiyon eklenecek
}

// --- KOMUTLAR ---
// Moderasyon
komutEkle('ban', 'Bir kullanıcıyı sunucudan yasakla.', [
  { name: 'kullanıcı', description: 'Yasaklanacak kullanıcı', type: 'user', required: true },
  { name: 'sebep', description: 'Yasaklama sebebi', type: 'string', required: false },
]);
komutEkle('kick', 'Bir kullanıcıyı sunucudan at.', [
  { name: 'kullanıcı', description: 'Atılacak kullanıcı', type: 'user', required: true },
  { name: 'sebep', description: 'Sebep', type: 'string', required: false },
]);
komutEkle('mute', 'Kullanıcıyı süreli sustur.', [
  { name: 'kullanıcı', description: 'Susturulacak kişi', type: 'user', required: true },
  { name: 'süre', description: 'Dakika cinsinden süre', type: 'integer', required: true },
]);
komutEkle('unmute', 'Kullanıcının susturmasını kaldır.', [
  { name: 'kullanıcı', description: 'Susturması kaldırılacak kişi', type: 'user', required: true },
]);
komutEkle('untimeout', 'Timeout süresini kaldırır.', [
  { name: 'kullanıcı', description: 'Timeout kaldırılacak kişi', type: 'user', required: true },
]);
komutEkle('warn', 'Kullanıcıyı uyar.', [
  { name: 'kullanıcı', description: 'Uyarılacak kişi', type: 'user', required: true },
  { name: 'sebep', description: 'Uyarı sebebi', type: 'string', required: false },
]);
komutEkle('warnings', 'Uyarı geçmişini görüntüle.', [
  { name: 'kullanıcı', description: 'Geçmişi görüntülenecek kişi', type: 'user', required: true },
]);
komutEkle('clear', 'Belirtilen sayıda mesaj siler.', [
  { name: 'sayı', description: 'Silinecek mesaj sayısı (1-100)', type: 'integer', required: true },
]);
komutEkle('lock', 'Kanala mesaj gönderme engeli koyar.');
komutEkle('unlock', 'Kanal kilidini kaldırır.');
komutEkle('slowmode', 'Kanala yavaş mod ayarlar.', [
  { name: 'saniye', description: 'Saniye cinsinden yavaş mod süresi', type: 'integer', required: true },
]);

// Koruma
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

// Diğer
komutEkle('logkanali', 'Log kanalı ayarlar.', [
  { name: 'kanal', description: 'Log kanalı seçin', type: 'channel', required: true },
]);
komutEkle('cezalar', 'Kullanıcının cezalarını gösterir.', [
  { name: 'kullanıcı', description: 'Cezaları görüntülenecek kullanıcı', type: 'user', required: true },
]);
komutEkle('emojiekle', 'Sunucuya emoji ekler.', [
  { name: 'resim', description: 'Emoji resmi', type: 'attachment', required: true },
  { name: 'isim', description: 'Emoji ismi (opsiyonel)', type: 'string', required: false },
]);
komutEkle('logkanali', 'Log kanalını ayarlar.', [
  { name: 'kanal', description: 'Log kanalı seçin', type: 'channel', required: true },
]);
komutEkle('cezaislemler', 'Tüm ceza geçmişini listeler.');
komutEkle('koruma-durum', 'Koruma sistemlerinin durumunu gösterir.');
komutEkle('kayit', 'Yeni üyeyi kayıt eder.', [
  { name: 'kullanıcı', description: 'Kayıt edilecek kullanıcı', type: 'user', required: true },
  { name: 'isim', description: 'İsim', type: 'string', required: true },
  { name: 'yas', description: 'Yaş', type: 'integer', required: true },
]);
komutEkle('komutlar', 'Tüm komutları sayfalı ve emojili gösterir.');
komutEkle('emojiekle', 'Sunucuya emoji ekler.', [
  { name: 'isim', description: 'Emoji ismi', type: 'string', required: true },
  { name: 'url', description: 'Emoji URL\'si', type: 'string', required: true },
]);

// --- KOMUTLARI DEPLOY ET ---
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('Slash komutlar deploy ediliyor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: komutlar });
    console.log('Komutlar başarıyla yüklendi!');
  } catch (error) {
    console.error('Komut deploy hatası:', error);
  }
})();

// --- BOT HAZIR ---
client.once('ready', () => {
  console.log(`Bot hazır! Kullanıcı: ${client.user.tag}`);
});

// PART 1 SONU
// PART 2

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, member, guild, channel, user } = interaction;

  // Yetki kontrolü
  if (!yetkiKontrol(member)) {
    return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
  }

  try {
    if (commandName === 'ban') {
      const hedef = options.getUser('kullanıcı');
      const sebep = options.getString('sebep') || 'Belirtilmedi';
      const hedefMember = guild.members.cache.get(hedef.id);
      if (!hedefMember) return interaction.reply({ content: '❌ Kullanıcı sunucuda değil.', ephemeral: true });
      if (!hedefMember.bannable) return interaction.reply({ content: '❌ Bu kullanıcıyı banlayamam.', ephemeral: true });

      await hedefMember.ban({ reason: sebep });
      cezaEkle(hedef.id, 'Ban', sebep);
      interaction.reply({ content: `✅ ${hedef.tag} sunucudan banlandı. Sebep: ${sebep}` });
    }

    else if (commandName === 'kick') {
      const hedef = options.getUser('kullanıcı');
      const sebep = options.getString('sebep') || 'Belirtilmedi';
      const hedefMember = guild.members.cache.get(hedef.id);
      if (!hedefMember) return interaction.reply({ content: '❌ Kullanıcı sunucuda değil.', ephemeral: true });
      if (!hedefMember.kickable) return interaction.reply({ content: '❌ Bu kullanıcıyı atamam.', ephemeral: true });

      await hedefMember.kick(sebep);
      cezaEkle(hedef.id, 'Kick', sebep);
      interaction.reply({ content: `✅ ${hedef.tag} sunucudan atıldı. Sebep: ${sebep}` });
    }

    else if (commandName === 'mute') {
      const hedef = options.getUser('kullanıcı');
      const sure = options.getInteger('süre');
      const hedefMember = guild.members.cache.get(hedef.id);
      if (!hedefMember) return interaction.reply({ content: '❌ Kullanıcı sunucuda değil.', ephemeral: true });

      const muteRol = guild.roles.cache.find(r => r.name.toLowerCase().includes('mute') || r.name.toLowerCase().includes('susturulmuş'));
      if (!muteRol) return interaction.reply({ content: '❌ "Mute" rolü bulunamadı.', ephemeral: true });

      await hedefMember.roles.add(muteRol);
      cezaEkle(hedef.id, 'Mute', `Süre: ${sure} dakika`);
      interaction.reply({ content: `🔇 ${hedef.tag} ${sure} dakika susturuldu.` });

      setTimeout(async () => {
        if (hedefMember.roles.cache.has(muteRol.id)) {
          await hedefMember.roles.remove(muteRol).catch(() => {});
        }
      }, sure * 60 * 1000);
    }

    else if (commandName === 'unmute') {
      const hedef = options.getUser('kullanıcı');
      const hedefMember = guild.members.cache.get(hedef.id);
      if (!hedefMember) return interaction.reply({ content: '❌ Kullanıcı sunucuda değil.', ephemeral: true });

      const muteRol = guild.roles.cache.find(r => r.name.toLowerCase().includes('mute') || r.name.toLowerCase().includes('susturulmuş'));
      if (!muteRol) return interaction.reply({ content: '❌ "Mute" rolü bulunamadı.', ephemeral: true });

      if (!hedefMember.roles.cache.has(muteRol.id)) return interaction.reply({ content: '❌ Kullanıcı zaten susturulmamış.', ephemeral: true });

      await hedefMember.roles.remove(muteRol);
      interaction.reply({ content: `🔊 ${hedef.tag} susturulması kaldırıldı.` });
    }

    else if (commandName === 'untimeout') {
      const hedef = options.getUser('kullanıcı');
      const hedefMember = guild.members.cache.get(hedef.id);
      if (!hedefMember) return interaction.reply({ content: '❌ Kullanıcı sunucuda değil.', ephemeral: true });

      if (!hedefMember.communicationDisabledUntilTimestamp || hedefMember.communicationDisabledUntilTimestamp < Date.now()) {
        return interaction.reply({ content: '❌ Kullanıcının timeoutu yok.', ephemeral: true });
      }

      await hedefMember.timeout(null, 'Timeout kaldırıldı.');
      interaction.reply({ content: `⏲️ ${hedef.tag} timeout süresi kaldırıldı.` });
    }

    // Diğer komutlar devam edecek...

  } catch (err) {
    console.error(err);
    if (!interaction.replied) {
      interaction.reply({ content: '❌ Bir hata oluştu!', ephemeral: true });
    }
  }
});
// PART 3

// Mesaj içerik filtreleri ve koruma sistemi
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  // Basit selamlaşma botu (sa, selam vb)
  const selamlar = ['sa', 'Sa', 'sA', 'SA', 'selam', 'Selam', 'selAm', 'SELAM', 'selamun aleykum', 'selamunaleykum', 'selamun aleykum', 'selamun aleykum', 'selam aleykum', 'selam aleykum'];
  if (selamlar.some(s => s === message.content.trim())) {
    message.channel.send(`Aleyküm selam hoşgeldin, ${message.author}!`);
  }

  // Spam engel sistemi
  if (korumaAyar.spamEngel) {
    const userId = message.author.id;
    const data = spamKontrol.get(userId) || { count: 0, lastMsg: null, timeoutId: null };

    if (data.lastMsg && (Date.now() - data.lastMsg) < 3000) { // 3 saniye içinde
      data.count++;
      if (data.count >= 5) {
        const member = message.member;
        if (member && member.manageable) {
          const muteRol = message.guild.roles.cache.find(r => r.name.toLowerCase().includes('mute') || r.name.toLowerCase().includes('susturulmuş'));
          if (muteRol && !member.roles.cache.has(muteRol.id)) {
            await member.roles.add(muteRol);
            message.channel.send(`${member.user.tag} spam yaptığı için susturuldu.`);
            cezaEkle(member.id, 'Mute', 'Spam engel sistemi');
          }
        }
        data.count = 0;
      }
    } else {
      data.count = 1;
    }
    data.lastMsg = Date.now();

    if (data.timeoutId) clearTimeout(data.timeoutId);
    data.timeoutId = setTimeout(() => {
      spamKontrol.delete(userId);
    }, 10000);

    spamKontrol.set(userId, data);
  }

  // Reklam engel (basit)
  if (korumaAyar.reklamEngel) {
    const reklamlar = ['discord.gg', '.com', '.net', '.org', 'http://', 'https://', 'www.'];
    if (reklamlar.some(r => message.content.toLowerCase().includes(r))) {
      if (!yetkiKontrol(message.member)) {
        await message.delete().catch(() => {});
        message.channel.send(`${message.author}, reklam yapmak yasak!`);
        cezaEkle(message.author.id, 'Uyarı', 'Reklam yapma');
      }
    }
  }

  // Capslock engel
  if (korumaAyar.capslockEngel) {
    const msg = message.content;
    if (msg.length > 5 && msg === msg.toUpperCase()) {
      if (!yetkiKontrol(message.member)) {
        await message.delete().catch(() => {});
        message.channel.send(`${message.author}, tamam sakin ol büyük harf kullanma!`);
        cezaEkle(message.author.id, 'Uyarı', 'Capslock kullanma');
      }
    }
  }

  // Etiket engel (everyone ve here)
  if (korumaAyar.etiketEngel) {
    if (message.mentions.everyone) {
      if (!yetkiKontrol(message.member)) {
        await message.delete().catch(() => {});
        message.channel.send(`${message.author}, everyone/here etiketlemek yasak!`);
        cezaEkle(message.author.id, 'Uyarı', 'Everyone/Here etiket');
      }
    }
  }
});

// Yeni üye kayıtsız rolü verme + loglama
client.on('guildMemberAdd', async (member) => {
  try {
    if (ROLE_KAYITSIZ) {
      const kayitsizRol = member.guild.roles.cache.get(ROLE_KAYITSIZ);
      if (kayitsizRol && !member.roles.cache.has(kayitsizRol.id)) {
        await member.roles.add(kayitsizRol);
      }
    }
    if (LOG_MOD) {
      const logKanal = member.guild.channels.cache.get(LOG_MOD);
      if (logKanal && logKanal.isTextBased()) {
        logKanal.send(`📥 ${member.user.tag} sunucuya katıldı.`);
      }
    }
  } catch (err) {
    console.error('guildMemberAdd hatası:', err);
  }
});

// Üye çıkış logu
client.on('guildMemberRemove', async (member) => {
  try {
    if (LOG_MOD) {
      const logKanal = member.guild.channels.cache.get(LOG_MOD);
      if (logKanal && logKanal.isTextBased()) {
        logKanal.send(`📤 ${member.user.tag} sunucudan ayrıldı.`);
      }
    }
  } catch (err) {
    console.error('guildMemberRemove hatası:', err);
  }
});
// PART 4

const { REST, Routes } = require('discord.js');

// Komutların çalışmasını sağlayacak handler fonksiyonu
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, member, guild } = interaction;

  // Yetki kontrolü
  if (!yetkiKontrol(member)) {
    return interaction.reply({ content: 'Bu komutu kullanmak için yetkiniz yok!', ephemeral: true });
  }

  if (commandName === 'emojiekle') {
    const attachment = interaction.options.getAttachment('resim');
    if (!attachment) {
      return interaction.reply({ content: 'Lütfen bir emoji resmi ekleyin.', ephemeral: true });
    }
    try {
      // İsim zorunlu parametre olarak komut tanımlanabilir, yoksa rastgele isim verelim
      const emojiName = interaction.options.getString('isim') || `emoji_${Date.now()}`;

      const emoji = await guild.emojis.create(attachment.url, emojiName);
      interaction.reply(`Emoji başarıyla eklendi: <:${emoji.name}:${emoji.id}>`);
    } catch (error) {
      interaction.reply({ content: `Emoji eklenirken hata oluştu: ${error.message}`, ephemeral: true });
    }
  }

  if (commandName === 'logkanali') {
    const kanal = options.getChannel('kanal');
    if (!kanal || kanal.type !== 0) { // Sadece metin kanalı olmalı
      return interaction.reply({ content: 'Lütfen geçerli bir metin kanalı seçin.', ephemeral: true });
    }

    // Log kanalını kaydet
    korumaAyar.logKanal = kanal.id;
    ayarKaydet();

    interaction.reply(`Log kanalı başarıyla ${kanal} olarak ayarlandı.`);
  }

  // Diğer komutlar için buraya ekleme yapabilirsin

});
 process.env.TOKEN 
