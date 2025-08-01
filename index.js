require('dotenv').config();

const { 
  Client, GatewayIntentBits, Partials, Collection, REST, Routes, SlashCommandBuilder, 
  PermissionFlagsBits, EmbedBuilder, ChannelType 
} = require('discord.js');

// --- ENVIRONMENT VARIABLES ---
const {
  TOKEN, CLIENT_ID, GUILD_ID,
  LOG_GELENGIDEN, LOG_KOMUT, LOG_MOD,
  ROLE_BOTYETKI, ROLE_KAYITSIZ, ROLE_UYE
} = process.env;

// --- CLIENT SETUP ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

// --- GLOBAL VERİLER ---
const komutlar = [];
const cezalar = {};  // { userId: [ { tur, sebep, tarih } ] }
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
  logKanal: null,
};
const spamKontrol = new Map(); // userId: {count, lastMsg, timeoutId}

// --- YARDIMCI FONKSİYON: Komut ekle ---
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

// --- KOMUTLARI TANIMLA ---

// Moderasyon Komutları
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

// Koruma Komutları
const korumaKomutlar = [
  'koruma', 'antiraid', 'spam-engel', 'reklam-engel',
  'capslock-engel', 'etiket-engel', 'rol-koruma',
  'kanal-koruma', 'webhook-koruma', 'emoji-koruma',
];
for (const k of korumaKomutlar) {
  komutEkle(k, `${k} sistemini açar veya kapatır.`, [
    { name: 'durum', description: '"aç" veya "kapat"', type: 'string', required: true },
  ]);
}

// Diğer Komutlar
komutEkle('log-ayarla', 'Log kanalını ayarla.', [
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

// --- KOMUTLARI DEPLOY ET ---

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('Slash komutlar deploy ediliyor...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: komutlar },
    );
    console.log('Komutlar başarıyla yüklendi!');
  } catch (error) {
    console.error('Komut deploy hatası:', error);
  }
})();

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
}

// --- BOT BAŞLAMA MESAJI ---
client.on('ready', () => {
  console.log(`Bot hazır! Kullanıcı: ${client.user.tag}`);
});
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options, member, guild, channel, user } = interaction;

  if (!yetkiKontrol(member)) {
    return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
  }

  try {
    // --- BAN ---
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

    // --- KICK ---
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

    // --- MUTE ---
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

    // --- UNMUTE ---
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

    // --- UNTIMEOUT ---
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

    // --- WARN ---
    else if (commandName === 'warn') {
      const hedef = options.getUser('kullanıcı');
      const sebep = options.getString('sebep') || 'Belirtilmedi';

      cezaEkle(hedef.id, 'Uyarı', sebep);
      interaction.reply({ content: `⚠️ ${hedef.tag} uyarıldı. Sebep: ${sebep}` });
    }

    // --- WARNINGS ---
    else if (commandName === 'warnings') {
      const hedef = options.getUser('kullanıcı');
      const userCezalar = cezalar[hedef.id] || [];
      const uyariListesi = userCezalar.filter(c => c.tur === 'Uyarı');

      if (uyariListesi.length === 0) {
        return interaction.reply({ content: `${hedef.tag} için uyarı bulunmamaktadır.`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(`${hedef.tag} Uyarı Geçmişi`)
        .setColor('Yellow')
        .setDescription(uyariListesi.map((u, i) => `${i + 1}. Sebep: ${u.sebep} - Tarih: ${u.tarih}`).join('\n'));

      interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // --- CLEAR ---
    else if (commandName === 'clear') {
      const sayi = options.getInteger('sayı');
      if (sayi < 1 || sayi > 100) return interaction.reply({ content: '❌ 1 ile 100 arasında sayı giriniz.', ephemeral: true });

      const messages = await channel.messages.fetch({ limit: sayi });
      await channel.bulkDelete(messages, true);

      interaction.reply({ content: `🧹 ${sayi} mesaj silindi.`, ephemeral: true });
    }

    // --- LOCK ---
    else if (commandName === 'lock') {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
      interaction.reply({ content: '🔒 Kanal kilitlendi.' });
    }

    // --- UNLOCK ---
    else if (commandName === 'unlock') {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: true });
      interaction.reply({ content: '🔓 Kanal kilidi kaldırıldı.' });
    }

    // --- SLOWMODE ---
    else if (commandName === 'slowmode') {
      const saniye = options.getInteger('saniye');
      if (saniye < 0 || saniye > 21600) return interaction.reply({ content: '❌ 0-21600 arasında saniye giriniz.', ephemeral: true });

      await channel.setRateLimitPerUser(saniye);
      interaction.reply({ content: `🐢 Yavaş mod ${saniye} saniye olarak ayarlandı.` });
   }
   // --- KORUMA KOMUTLARI ---
    else if (korumaKomutlar.includes(commandName)) {
      const durum = options.getString('durum');
      if (!['aç', 'kapat'].includes(durum)) return interaction.reply({ content: '❌ Durum "aç" veya "kapat" olmalı.', ephemeral: true });

      const key = commandName.replace(/-/g, '').toLowerCase();
      if (!(key in korumaAyar)) return interaction.reply({ content: '❌ Bu koruma sistemi bulunamadı.', ephemeral: true });

      korumaAyar[key] = (durum === 'aç');

      interaction.reply({ content: `✅ ${commandName} sistemi ${durum === 'aç' ? 'açıldı' : 'kapatıldı'}.` });

      if (korumaAyar.logKanal) {
        const logKanal = guild.channels.cache.get(korumaAyar.logKanal);
        if (logKanal) logKanal.send(`⚙️ **${commandName}** sistemi **${durum === 'aç' ? 'açıldı' : 'kapatıldı'}** by ${member.user.tag}`);
      }
    }

    // --- LOG AYARLA ---
    else if (commandName === 'log-ayarla') {
      const kanal = options.getChannel('kanal');
      korumaAyar.logKanal = kanal.id;
      interaction.reply({ content: `✅ Log kanalı ${kanal} olarak ayarlandı.` });
    }

    // --- CEZALAR ---
    else if (commandName === 'cezalar') {
      const hedef = options.getUser('kullanıcı');
      const userCezalar = cezalar[hedef.id] || [];

      if (userCezalar.length === 0) {
        return interaction.reply({ content: `${hedef.tag} için ceza bulunmamaktadır.`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(`${hedef.tag} Ceza Geçmişi`)
        .setColor('Red')
        .setDescription(userCezalar.map((c, i) => `${i + 1}. [${c.tur}] Sebep: ${c.sebep} - Tarih: ${c.tarih}`).join('\n'));

      interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // --- CEZAİŞLEMLER ---
    else if (commandName === 'cezaişlemler') {
      let text = '';
      for (const [userId, cezaList] of Object.entries(cezalar)) {
        const userTag = await client.users.fetch(userId).then(u => u.tag).catch(() => 'Bilinmiyor');
        text += `\n**${userTag}** - Toplam Ceza: ${cezaList.length}\n`;
        cezaList.forEach((c, i) => {
          text += `   ${i + 1}. [${c.tur}] Sebep: ${c.sebep} - Tarih: ${c.tarih}\n`;
        });
      }
      if (!text) text = 'Hiç ceza kaydı yok.';
      interaction.reply({ content: text, ephemeral: true });
    }

    // --- KORUMA-DURUM ---
    else if (commandName === 'koruma-durum') {
      let durumlar = '';
      for (const [key, val] of Object.entries(korumaAyar)) {
        if (key === 'logKanal') continue;
        durumlar += `**${key}**: ${val ? 'Açık ✅' : 'Kapalı ❌'}\n`;
      }
      interaction.reply({ content: durumlar || 'Koruma sistemi durumu bulunamadı.', ephemeral: true });
    }

    // --- KAYIT ---
    else if (commandName === 'kayıt') {
      const hedef = options.getUser('kullanıcı');
      const isim = options.getString('isim');
      const yas = options.getInteger('yaş');
      const hedefMember = guild.members.cache.get(hedef.id);

      if (!hedefMember) return interaction.reply({ content: '❌ Kullanıcı sunucuda değil.', ephemeral: true });

      if (!ROLE_KAYITSIZ || !ROLE_UYE) return interaction.reply({ content: '❌ Kayıtsız ve üye rolleri env dosyasından ayarlanmalı.', ephemeral: true });

      if (!hedefMember.roles.cache.has(ROLE_KAYITSIZ)) {
        return interaction.reply({ content: '❌ Kullanıcı zaten kayıtlı.', ephemeral: true });
      }

      await hedefMember.setNickname(`${isim} | ${yas}`);
      await hedefMember.roles.remove(ROLE_KAYITSIZ);
      await hedefMember.roles.add(ROLE_UYE);

      interaction.reply({ content: `✅ ${hedef.tag} başarıyla kayıt edildi. İsim: ${isim}, Yaş: ${yas}` });
    }

    // --- KOMUTLAR SAYFALI ---
    else if (commandName === 'komutlar') {
      const sayfalar = [
        [
          '**Moderasyon Komutları:**\n' +
          '`/ban` - Kullanıcıyı banlar\n' +
          '`/kick` - Kullanıcıyı atar\n' +
          '`/mute` - Süreli susturur\n' +
          '`/unmute` - Susturmayı kaldırır\n' +
          '`/untimeout` - Timeout kaldırır\n' +
          '`/warn` - Uyarı verir\n' +
          '`/warnings` - Uyarıları gösterir\n' +
          '`/clear` - Mesaj siler\n' +
          '`/lock` - Kanalı kilitler\n' +
          '`/unlock` - Kilidi açar\n' +
          '`/slowmode` - Yavaş mod ayarlar\n'
        ],
        [
          '**Koruma Komutları:**\n' +
          '`/koruma` - Koruma aç/kapa\n' +
          '`/antiraid` - Anti-raid aç/kapa\n' +
          '`/spam-engel` - Spam engel aç/kapa\n' +
          '`/reklam-engel` - Reklam engel aç/kapa\n' +
          '`/capslock-engel` - Caps lock engel aç/kapa\n' +
          '`/etiket-engel` - Etiket engel aç/kapa\n' +
          '`/rol-koruma` - Rol koruma aç/kapa\n' +
          '`/kanal-koruma` - Kanal koruma aç/kapa\n' +
          '`/webhook-koruma` - Webhook koruma aç/kapa\n' +
          '`/emoji-koruma` - Emoji koruma aç/kapa\n' +
          '`/log-ayarla` - Log kanalı ayarla\n'
        ],
        [
          '**Diğer Komutlar:**\n' +
          '`/cezalar` - Kullanıcının cezaları\n' +
          '`/cezaişlemler` - Tüm ceza kayıtları\n' +
          '`/koruma-durum` - Koruma sistem durumu\n' +
          '`/kayıt` - Yeni üyeyi kayıt et\n' +
          '`/komutlar` - Komut listesini göster\n'
        ]
      ];

      let sayfa = 0;
      const embed = new EmbedBuilder()
        .setTitle(`Komut Listesi (${sayfa + 1}/${sayfalar.length})`)
        .setDescription(sayfalar[sayfa])
        .setColor('Blue')
        .setFooter({ text: 'Sayfalar arası geçmek için emojilere tıkla!' });

      const mesaj = await interaction.reply({ embeds: [embed], fetchReply: true });

      await mesaj.react('⬅️');
      await mesaj.react('➡️');

      const collector = mesaj.createReactionCollector({
        filter: (reaction, user) => ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === interaction.user.id,
        time: 60000
      });

      collector.on('collect', (reaction, user) => {
        reaction.users.remove(user.id).catch(() => {});
        if (reaction.emoji.name === '➡️') {
          if (sayfa < sayfalar.length - 1) sayfa++;
        } else if (reaction.emoji.name === '⬅️') {
          if (sayfa > 0) sayfa--;
        }
        const yeniEmbed = new EmbedBuilder()
          .setTitle(`Komut Listesi (${sayfa + 1}/${sayfalar.length})`)
          .setDescription(sayfalar[sayfa])
          .setColor('Blue')
          .setFooter({ text: 'Sayfalar arası geçmek için emojilere tıkla!' });

        mesaj.edit({ embeds: [yeniEmbed] });
      });

      collector.on('end', () => {
        mesaj.reactions.removeAll().catch(() => {});
      });
    }
  } catch (err) {
    console.error(err);
    interaction.reply({ content: '❌ Bir hata oluştu!', ephemeral: true });
  }
});
// Komutlar sayfalı emoji koleksiyonu sonu
      collector.on('end', () => {
        mesaj.reactions.removeAll().catch(() => {});
      });
    }
  } catch (err) {
    console.error(err);
    if (!interaction.replied)
      interaction.reply({ content: '❌ Bir hata oluştu!', ephemeral: true });
  }
});

// --- Buradan itibaren 3. part ---

// Gerekli modüller
const fs = require('fs');
const path = require('path');

// Koruma ayarlarını ve ceza verilerini yükle / kaydet fonksiyonları
const AYAR_DOSYA = path.join(__dirname, 'korumaAyar.json');
const CEZA_DOSYA = path.join(__dirname, 'database.json');

function ayarKaydet() {
  fs.writeFileSync(AYAR_DOSYA, JSON.stringify(korumaAyar, null, 2));
}

function cezaKaydet() {
  fs.writeFileSync(CEZA_DOSYA, JSON.stringify(cezalar, null, 2));
}

// Yeni ceza ekleme fonksiyonu
function cezaEkle(userId, tur, sebep) {
  if (!cezalar[userId]) cezalar[userId] = [];
  cezalar[userId].push({ tur, sebep, tarih: new Date().toLocaleString('tr-TR') });
  cezaKaydet();
}

// Yetki kontrolü fonksiyonu
function yetkiKontrol(member) {
  if (!member) return false;
  return member.roles.cache.has(ROLE_BOTYETKI) || member.permissions.has('Administrator');
}

// Spam engelleme için geçici veri yapısı
const spamVeri = new Map();

// Mesajlarda koruma kontrolleri
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  if (!korumaAyar.koruma) return;

  const member = message.member;
  const içerik = message.content;

  // Spam engel
  if (korumaAyar.spamEngel) {
    let data = spamVeri.get(member.id) || { count: 0, last: 0 };
    const now = Date.now();
    if (now - data.last < 2000) data.count++;
    else data.count = 1;
    data.last = now;
    spamVeri.set(member.id, data);

    if (data.count >= 5) {
      await message.delete().catch(() => {});
      cezaEkle(member.id, 'Spam Engelleme', 'Çok hızlı mesaj atma');
      const logKanal = client.channels.cache.get(korumaAyar.logKanal);
      if (logKanal) logKanal.send(`🚫 ${member.user.tag} spam yaparken mesajları silindi.`);
      return;
    }
  }

  // Reklam engel
  if (korumaAyar.reklamEngel) {
    const reklamRegex = /(discord\.gg|http(s)?:\/\/|www\.)/i;
    if (reklamRegex.test(içerik)) {
      await message.delete().catch(() => {});
      cezaEkle(member.id, 'Reklam Engelleme', 'Reklam veya link paylaşımı');
      const logKanal = client.channels.cache.get(korumaAyar.logKanal);
      if (logKanal) logKanal.send(`🚫 ${member.user.tag} reklam yapmaya çalıştı, mesaj silindi.`);
      return;
    }
  }

  // Capslock engel
  if (korumaAyar.capslockEngel) {
    const upperCount = (içerik.match(/[A-Z]/g) || []).length;
    const totalCount = içerik.replace(/[^a-zA-Z]/g, '').length;
    if (totalCount > 5 && upperCount / totalCount >= 0.7) {
      await message.delete().catch(() => {});
      cezaEkle(member.id, 'Capslock Engelleme', 'Aşırı büyük harf kullanımı');
      const logKanal = client.channels.cache.get(korumaAyar.logKanal);
      if (logKanal) logKanal.send(`🚫 ${member.user.tag} capslock kullandı, mesaj silindi.`);
      return;
    }
  }

  // Etiket engel
  if (korumaAyar.etiketEngel) {
    if (message.mentions.everyone) {
      await message.delete().catch(() => {});
      cezaEkle(member.id, 'Etiket Engelleme', '@everyone veya @here etiketi');
      const logKanal = client.channels.cache.get(korumaAyar.logKanal);
      if (logKanal) logKanal.send(`🚫 ${member.user.tag} herkesi etiketledi, mesaj silindi.`);
      return;
    }
  }
});

// Rol silme koruması
client.on('roleDelete', async role => {
  if (!korumaAyar.rolKoruma) return;
  const guild = role.guild;
  const audit = await guild.fetchAuditLogs({ limit: 1, type: 'ROLE_DELETE' });
  const entry = audit.entries.first();
  if (!entry) return;
  if (entry.executor.id === client.user.id) return;

  const executorMember = guild.members.cache.get(entry.executor.id);
  if (!yetkiKontrol(executorMember)) {
    const logKanal = client.channels.cache.get(korumaAyar.logKanal);
    if (logKanal) logKanal.send(`⚠️ Yetkisiz rol silme: ${executorMember.user.tag} tarafından ${role.name} silindi.`);
  }
});

// Kanal silme koruması
client.on('channelDelete', async channel => {
  if (!korumaAyar.kanalKoruma) return;
  const guild = channel.guild;
  const audit = await guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_DELETE' });
  const entry = audit.entries.first();
  if (!entry) return;
  if (entry.executor.id === client.user.id) return;

  const executorMember = guild.members.cache.get(entry.executor.id);
  if (!yetkiKontrol(executorMember)) {
    const logKanal = client.channels.cache.get(korumaAyar.logKanal);
    if (logKanal) logKanal.send(`⚠️ Yetkisiz kanal silme: ${executorMember.user.tag} tarafından ${channel.name} silindi.`);
  }
});

// Webhook koruma
client.on('webhookUpdate', async channel => {
  if (!korumaAyar.webhookKoruma) return;

  const guild = channel.guild;
  const audit = await guild.fetchAuditLogs({ limit: 5, type: 'WEBHOOK_CREATE' });
  audit.entries.forEach(entry => {
    if (entry.executor.id === client.user.id) return;
    const executorMember = guild.members.cache.get(entry.executor.id);
    if (!yetkiKontrol(executorMember)) {
      const logKanal = client.channels.cache.get(korumaAyar.logKanal);
      if (logKanal) logKanal.send(`⚠️ Yetkisiz webhook oluşturma: ${executorMember.user.tag} tarafından ${channel.name} kanalına webhook oluşturuldu.`);
    }
  });
});

// Emoji koruma
client.on('emojiDelete', async emoji => {
  if (!korumaAyar.emojiKoruma) return;
  const guild = emoji.guild;
  const audit = await guild.fetchAuditLogs({ limit: 1, type: 'EMOJI_DELETE' });
  const entry = audit.entries.first();
  if (!entry) return;
  if (entry.executor.id === client.user.id) return;

  const executorMember = guild.members.cache.get(entry.executor.id);
  if (!yetkiKontrol(executorMember)) {
    const logKanal = client.channels.cache.get(korumaAyar.logKanal);
    if (logKanal) logKanal.send(`⚠️ Yetkisiz emoji silme: ${executorMember.user.tag} tarafından ${emoji.name} emoji silindi.`);
  }
});

// Bot hazır olduğunda
client.once('ready', () => {
  console.log(`Bot giriş yaptı: ${client.user.tag}`);
  client.user.setActivity('Koruma & Moderasyon | /komutlar');
});

// Bot token ile giriş yapar
client.login(TOKEN);
