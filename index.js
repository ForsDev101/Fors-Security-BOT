// index.js (PART 1 - Temel kurulum & moderasyon komutları)

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, PermissionFlagsBits, EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const prefix = '!'; // Aslında slash komut kullandığımız için gerek yok ama eski kodlar için boş bırakabiliriz.

const komutlar = [];
client.commands = new Collection();

// Global ayarlar (simple örnek, JSON dosyasına bağlanabilirsin)
global.korumaAyar = {
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

global.cezalar = {}; // { userId: [{ tur, sebep, tarih }] }
global.uyarilar = {}; // { userId: [sebep, ...] }

// Slash komut ekleme fonksiyonu
function komutEkle(name, desc, options = []) {
  const komut = new SlashCommandBuilder()
    .setName(name)
    .setDescription(desc);

  for (const opt of options) {
    const method = {
      user: 'addUserOption',
      string: 'addStringOption',
      integer: 'addIntegerOption',
      number: 'addNumberOption'
    }[opt.type];
    if (method) {
      komut[method](o =>
        o.setName(opt.name)
          .setDescription(opt.description)
          .setRequired(opt.required ?? false)
      );
    }
  }

  komutlar.push(komut.toJSON());
  client.commands.set(name, { run: null });
}

// --- KOMUT TANIMLARI ---

// Moderasyon komutları

komutEkle('ban', 'Bir kullanıcıyı sunucudan yasakla.', [
  { name: 'kullanıcı', description: 'Yasaklanacak kullanıcı', type: 'user', required: true },
  { name: 'sebep', description: 'Yasaklama sebebi', type: 'string' }
]);

komutEkle('kick', 'Bir kullanıcıyı sunucudan at.', [
  { name: 'kullanıcı', description: 'Atılacak kullanıcı', type: 'user', required: true },
  { name: 'sebep', description: 'Sebep', type: 'string' }
]);

komutEkle('mute', 'Kullanıcıyı süreli sustur.', [
  { name: 'kullanıcı', description: 'Susturulacak kişi', type: 'user', required: true },
  { name: 'süre', description: 'Dakika cinsinden süre', type: 'integer', required: true }
]);

komutEkle('unmute', 'Kullanıcının susturmasını kaldır.', [
  { name: 'kullanıcı', description: 'Susturması kaldırılacak kişi', type: 'user', required: true }
]);

komutEkle('untimeout', 'Timeout süresini kaldırır.', [
  { name: 'kullanıcı', description: 'Timeout kaldırılacak kişi', type: 'user', required: true }
]);

komutEkle('warn', 'Kullanıcıyı uyar.', [
  { name: 'kullanıcı', description: 'Uyarılacak kişi', type: 'user', required: true },
  { name: 'sebep', description: 'Uyarı sebebi', type: 'string' }
]);

komutEkle('warnings', 'Uyarı geçmişini görüntüle.', [
  { name: 'kullanıcı', description: 'Geçmişi görüntülenecek kişi', type: 'user', required: true }
]);

// --- EVENTLER VE KOMUT İŞLEME ---

client.on('ready', () => {
  console.log(`${client.user.tag} olarak giriş yapıldı!`);
  // Komutları guilde veya globale yükle (guild öneririm geliştirme için)
  const guildId = process.env.GUILD_ID;
  if (!guildId) return console.error('GUILD_ID env tanımlı değil!');

  const rest = require('@discordjs/rest').REST;
  const { Routes } = require('discord-api-types/v9');
  const restClient = new rest({ version: '9' }).setToken(process.env.TOKEN);

  (async () => {
    try {
      console.log('Slash komutları yükleniyor...');
      await restClient.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: komutlar }
      );
      console.log('Slash komutları yüklendi!');
    } catch (err) {
      console.error('Komut yükleme hatası:', err);
    }
  })();
});

// Komutların işlenmesi

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options, member, guild } = interaction;

  // Komut çalıştırma için bot yetkisi ve kullanıcı rolü kontrolü

  if (!member.permissions.has(PermissionFlagsBits.Administrator) && !member.roles.cache.has(process.env.ROLE_BOTYETKI)) {
    return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
  }

  try {
    if (commandName === 'ban') {
      const hedef = options.getUser('kullanıcı');
      const sebep = options.getString('sebep') || 'Sebep belirtilmedi.';
      const hedefMember = guild.members.cache.get(hedef.id);

      if (!hedefMember) return interaction.reply({ content: '❌ Kullanıcı sunucuda bulunamadı.', ephemeral: true });
      if (!hedefMember.bannable) return interaction.reply({ content: '❌ Bu kullanıcıyı banlayamam.', ephemeral: true });

      await hedefMember.ban({ reason: sebep });
      // Ceza kaydı
      if (!global.cezalar[hedef.id]) global.cezalar[hedef.id] = [];
      global.cezalar[hedef.id].push({ tur: 'Ban', sebep, tarih: new Date().toLocaleString() });

      interaction.reply({ content: `✅ ${hedef.tag} sunucudan yasaklandı. Sebep: ${sebep}` });
    }

    else if (commandName === 'kick') {
      const hedef = options.getUser('kullanıcı');
      const sebep = options.getString('sebep') || 'Sebep belirtilmedi.';
      const hedefMember = guild.members.cache.get(hedef.id);

      if (!hedefMember) return interaction.reply({ content: '❌ Kullanıcı sunucuda bulunamadı.', ephemeral: true });
      if (!hedefMember.kickable) return interaction.reply({ content: '❌ Bu kullanıcıyı atamam.', ephemeral: true });

      await hedefMember.kick(sebep);
      if (!global.cezalar[hedef.id]) global.cezalar[hedef.id] = [];
      global.cezalar[hedef.id].push({ tur: 'Kick', sebep, tarih: new Date().toLocaleString() });

      interaction.reply({ content: `✅ ${hedef.tag} sunucudan atıldı. Sebep: ${sebep}` });
    }

    else if (commandName === 'mute') {
      const hedef = options.getUser('kullanıcı');
      const sure = options.getInteger('süre');
      const hedefMember = guild.members.cache.get(hedef.id);

      if (!hedefMember) return interaction.reply({ content: '❌ Kullanıcı sunucuda bulunamadı.', ephemeral: true });
      if (!hedefMember.manageable) return interaction.reply({ content: '❌ Bu kullanıcıyı susturamıyorum.', ephemeral: true });

      // Discord timeout kullanımı (mute değil, timeout)
      const timeoutMs = sure * 60 * 1000;
      await hedefMember.timeout(timeoutMs, 'Süreli susturma');

      if (!global.cezalar[hedef.id]) global.cezalar[hedef.id] = [];
      global.cezalar[hedef.id].push({ tur: 'Mute', sebep: `Süre: ${sure} dakika`, tarih: new Date().toLocaleString() });

      interaction.reply({ content: `✅ ${hedef.tag} ${sure} dakika susturuldu.` });
    }

    else if (commandName === 'unmute') {
      const hedef = options.getUser('kullanıcı');
      const hedefMember = guild.members.cache.get(hedef.id);

      if (!hedefMember) return interaction.reply({ content: '❌ Kullanıcı sunucuda bulunamadı.', ephemeral: true });

      await hedefMember.timeout(null);

      interaction.reply({ content: `✅ ${hedef.tag} susturması kaldırıldı.` });
    }

    else if (commandName === 'untimeout') {
      const hedef = options.getUser('kullanıcı');
      const hedefMember = guild.members.cache.get(hedef.id);

      if (!hedefMember) return interaction.reply({ content: '❌ Kullanıcı sunucuda bulunamadı.', ephemeral: true });

      await hedefMember.timeout(null);

      interaction.reply({ content: `✅ ${hedef.tag} timeout süresi kaldırıldı.` });
    }

    else if (commandName === 'warn') {
      const hedef = options.getUser('kullanıcı');
      const sebep = options.getString('sebep') || 'Sebep belirtilmedi.';

      if (!global.uyarilar[hedef.id]) global.uyarilar[hedef.id] = [];
      global.uyarilar[hedef.id].push(sebep);

      interaction.reply({ content: `⚠️ ${hedef.tag} uyarıldı. Sebep: ${sebep}` });
    }

    else if (commandName === 'warnings') {
      const hedef = options.getUser('kullanıcı');
      const uyarilar = global.uyarilar[hedef.id] || [];

      if (uyarilar.length === 0) {
        return interaction.reply({ content: `${hedef.tag} için uyarı bulunmamaktadır.`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(`${hedef.tag} Uyarı Geçmişi`)
        .setColor(0xffcc00)
        .setDescription(uyarilar.map((u, i) => `${i + 1}. ${u}`).join('\n'));

      interaction.reply({ embeds: [embed], ephemeral: true });
    }
  } catch (error) {
    console.error('Komut Hatası:', error);
    interaction.reply({ content: '❌ Komut çalıştırılırken bir hata oluştu.', ephemeral: true });
  }
});
// index.js (PART 2 — Temizlik, kilitleme, koruma komutları)

// --- KOMUT TANIMLARI ---

komutEkle('clear', 'Belirtilen sayıda mesaj siler.', [
  { name: 'sayı', description: 'Silinecek mesaj sayısı (1-100)', type: 'integer', required: true }
]);

komutEkle('lock', 'Kanala mesaj gönderme engeli koyar.');

komutEkle('unlock', 'Kanal kilidini kaldırır.');

komutEkle('slowmode', 'Kanala yavaş mod ayarlar.', [
  { name: 'saniye', description: 'Saniye cinsinden yavaş mod süresi', type: 'integer', required: true }
]);

// Koruma aç/kapat komutları

komutEkle('koruma', 'Koruma sistemini açar veya kapatır.', [
  { name: 'durum', description: '"aç" veya "kapat"', type: 'string', required: true }
]);

komutEkle('antiraid', 'Antiraid korumasını açar veya kapatır.', [
  { name: 'durum', description: '"aç" veya "kapat"', type: 'string', required: true }
]);

komutEkle('spam-engel', 'Spam engel sistemini açar veya kapatır.', [
  { name: 'durum', description: '"aç" veya "kapat"', type: 'string', required: true }
]);

komutEkle('reklam-engel', 'Reklam engel sistemini açar veya kapatır.', [
  { name: 'durum', description: '"aç" veya "kapat"', type: 'string', required: true }
]);

komutEkle('capslock-engel', 'Capslock engel sistemini açar veya kapatır.', [
  { name: 'durum', description: '"aç" veya "kapat"', type: 'string', required: true }
]);

komutEkle('etiket-engel', 'Etiket engel sistemini açar veya kapatır.', [
  { name: 'durum', description: '"aç" veya "kapat"', type: 'string', required: true }
]);

// --- KOMUT İŞLEYİCİLER ---

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options, member, channel, guild } = interaction;

  if (!member.permissions.has(PermissionFlagsBits.Administrator) && !member.roles.cache.has(process.env.ROLE_BOTYETKI)) {
    return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
  }

  try {
    if (commandName === 'clear') {
      const sayi = options.getInteger('sayı');
      if (sayi < 1 || sayi > 100) return interaction.reply({ content: '❌ 1 ile 100 arasında sayı giriniz.', ephemeral: true });

      const messages = await channel.messages.fetch({ limit: sayi });
      await channel.bulkDelete(messages, true);

      interaction.reply({ content: `🧹 ${sayi} mesaj silindi.`, ephemeral: true });
    }

    else if (commandName === 'lock') {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
      interaction.reply({ content: '🔒 Kanal kilitlendi.' });
    }

    else if (commandName === 'unlock') {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: true });
      interaction.reply({ content: '🔓 Kanal kilidi kaldırıldı.' });
    }

    else if (commandName === 'slowmode') {
      const saniye = options.getInteger('saniye');
      if (saniye < 0 || saniye > 21600) return interaction.reply({ content: '❌ 0-21600 arasında saniye giriniz.', ephemeral: true });

      await channel.setRateLimitPerUser(saniye);
      interaction.reply({ content: `🐢 Yavaş mod ${saniye} saniye olarak ayarlandı.` });
    }

    else if (commandName === 'koruma') {
      const durum = options.getString('durum');
      if (!['aç', 'kapat'].includes(durum)) return interaction.reply({ content: '❌ Durum "aç" veya "kapat" olmalı.', ephemeral: true });

      global.korumaAyar.aktif = durum === 'aç';
      interaction.reply({ content: `🛡️ Koruma sistemi ${durum === 'aç' ? 'aktif' : 'pasif'} edildi.` });
    }

    else if (commandName === 'antiraid') {
      const durum = options.getString('durum');
      if (!['aç', 'kapat'].includes(durum)) return interaction.reply({ content: '❌ Durum "aç" veya "kapat" olmalı.', ephemeral: true });

      global.korumaAyar.antiraid = durum === 'aç';
      interaction.reply({ content: `🚨 Antiraid ${durum === 'aç' ? 'aktif' : 'pasif'} edildi.` });
    }

    else if (commandName === 'spam-engel') {
      const durum = options.getString('durum');
      if (!['aç', 'kapat'].includes(durum)) return interaction.reply({ content: '❌ Durum "aç" veya "kapat" olmalı.', ephemeral: true });

      global.korumaAyar.spamEngel = durum === 'aç';
      interaction.reply({ content: `⚠️ Spam engel ${durum === 'aç' ? 'aktif' : 'pasif'} edildi.` });
    }

    else if (commandName === 'reklam-engel') {
      const durum = options.getString('durum');
      if (!['aç', 'kapat'].includes(durum)) return interaction.reply({ content: '❌ Durum "aç" veya "kapat" olmalı.', ephemeral: true });

      global.korumaAyar.reklamEngel = durum === 'aç';
      interaction.reply({ content: `🚫 Reklam engel ${durum === 'aç' ? 'aktif' : 'pasif'} edildi.` });
    }

    else if (commandName === 'capslock-engel') {
      const durum = options.getString('durum');
      if (!['aç', 'kapat'].includes(durum)) return interaction.reply({ content: '❌ Durum "aç" veya "kapat" olmalı.', ephemeral: true });

      global.korumaAyar.capslockEngel = durum === 'aç';
      interaction.reply({ content: `🔠 Capslock engel ${durum === 'aç' ? 'aktif' : 'pasif'} edildi.` });
    }

    else if (commandName === 'etiket-engel') {
      const durum = options.getString('durum');
      if (!['aç', 'kapat'].includes(durum)) return interaction.reply({ content: '❌ Durum "aç" veya "kapat" olmalı.', ephemeral: true });

      global.korumaAyar.etiketEngel = durum === 'aç';
      interaction.reply({ content: `🔔 Etiket engel ${durum === 'aç' ? 'aktif' : 'pasif'} edildi.` });
    }
  } catch (error) {
    console.error('Komut Hatası:', error);
    interaction.reply({ content: '❌ Komut çalıştırılırken bir hata oluştu.', ephemeral: true });
  }
});
// index.js (PART 3 — Koruma devam, loglama, ceza, kayıt, komutlar)

// Komut tanımları

komutEkle('rol-koruma', 'Yetkisiz rol silme/eklemeyi engelle.', [
  { name: 'durum', description: '"aç" veya "kapat"', type: 'string', required: true }
]);

komutEkle('kanal-koruma', 'Yetkisiz kanal silme/eklemeyi engelle.', [
  { name: 'durum', description: '"aç" veya "kapat"', type: 'string', required: true }
]);

komutEkle('webhook-koruma', 'Webhook spamını engelle.', [
  { name: 'durum', description: '"aç" veya "kapat"', type: 'string', required: true }
]);

komutEkle('emoji-koruma', 'Sunucu emojilerini koru.', [
  { name: 'durum', description: '"aç" veya "kapat"', type: 'string', required: true }
]);

komutEkle('log-ayarla', 'Log kanalını ayarla.', [
  { name: 'kanal', description: 'Log kanalı seçin', type: 'channel', required: true }
]);

komutEkle('cezalar', 'Kullanıcının cezalarını gösterir.', [
  { name: 'kullanıcı', description: 'Cezaları görüntülenecek kullanıcı', type: 'user', required: true }
]);

komutEkle('cezaişlemler', 'Tüm ceza geçmişini listeler.');

komutEkle('koruma-durum', 'Koruma sistemlerinin durumunu gösterir.');

komutEkle('kayıt', 'Yeni üyeyi kayıt eder.', [
  { name: 'kullanıcı', description: 'Kayıt edilecek kullanıcı', type: 'user', required: true },
  { name: 'isim', description: 'İsim', type: 'string', required: true },
  { name: 'yaş', description: 'Yaş', type: 'integer', required: true }
]);

komutEkle('komutlar', 'Tüm komutları sayfalı ve emojili gösterir.');


// KOMUT İŞLEYİCİSİ DEVAMI

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options, member, guild } = interaction;

  if (!member.permissions.has(PermissionFlagsBits.Administrator) && !member.roles.cache.has(process.env.ROLE_BOTYETKI)) {
    return interaction.reply({ content: '❌ Bu komutu kullanmak için yetkin yok!', ephemeral: true });
  }

  try {
    // Rol Koruma
    if (commandName === 'rol-koruma') {
      const durum = options.getString('durum');
      if (!['aç', 'kapat'].includes(durum)) return interaction.reply({ content: '❌ Durum "aç" veya "kapat" olmalı.', ephemeral: true });

      global.korumaAyar.rolKoruma = durum === 'aç';
      interaction.reply({ content: `🔐 Rol koruma ${durum === 'aç' ? 'aktif' : 'pasif'} edildi.` });
    }

    // Kanal Koruma
    else if (commandName === 'kanal-koruma') {
      const durum = options.getString('durum');
      if (!['aç', 'kapat'].includes(durum)) return interaction.reply({ content: '❌ Durum "aç" veya "kapat" olmalı.', ephemeral: true });

      global.korumaAyar.kanalKoruma = durum === 'aç';
      interaction.reply({ content: `🔐 Kanal koruma ${durum === 'aç' ? 'aktif' : 'pasif'} edildi.` });
    }

    // Webhook Koruma
    else if (commandName === 'webhook-koruma') {
      const durum = options.getString('durum');
      if (!['aç', 'kapat'].includes(durum)) return interaction.reply({ content: '❌ Durum "aç" veya "kapat" olmalı.', ephemeral: true });

      global.korumaAyar.webhookKoruma = durum === 'aç';
      interaction.reply({ content: `🔐 Webhook koruma ${durum === 'aç' ? 'aktif' : 'pasif'} edildi.` });
    }

    // Emoji Koruma
    else if (commandName === 'emoji-koruma') {
      const durum = options.getString('durum');
      if (!['aç', 'kapat'].includes(durum)) return interaction.reply({ content: '❌ Durum "aç" veya "kapat" olmalı.', ephemeral: true });

      global.korumaAyar.emojiKoruma = durum === 'aç';
      interaction.reply({ content: `🔐 Emoji koruma ${durum === 'aç' ? 'aktif' : 'pasif'} edildi.` });
    }

    // Log Ayarla
    else if (commandName === 'log-ayarla') {
      const kanal = options.getChannel('kanal');
      if (!kanal.isTextBased()) return interaction.reply({ content: '❌ Lütfen metin kanalı seçiniz.', ephemeral: true });

      global.korumaAyar.logKanal = kanal.id;
      interaction.reply({ content: `📝 Log kanalı ${kanal} olarak ayarlandı.` });
    }

    // Cezalar
    else if (commandName === 'cezalar') {
      const hedef = options.getUser('kullanıcı');
      const cezalar = global.cezalar[hedef.id] || [];

      if (cezalar.length === 0) {
        return interaction.reply({ content: `${hedef.tag} için ceza bulunmamaktadır.`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(`${hedef.tag} Ceza Geçmişi`)
        .setColor(0xff0000)
        .setDescription(cezalar.map((c, i) => `${i + 1}. [${c.tur}] Sebep: ${c.sebep} - Tarih: ${c.tarih}`).join('\n'));

      interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Cezaişlemler
    else if (commandName === 'cezaişlemler') {
      let text = '';
      for (const [uid, cezalar] of Object.entries(global.cezalar)) {
        text += `<@${uid}> - ${cezalar.length} ceza\n`;
      }
      if (!text) text = 'Hiç ceza kaydı bulunmamaktadır.';
      interaction.reply({ content: text, ephemeral: true });
    }

    // Koruma Durum
    else if (commandName === 'koruma-durum') {
      const ayar = global.korumaAyar;
      const durumMetni = `
**Koruma Durumu:**
- Genel Koruma: ${ayar.aktif ? '✅' : '❌'}
- Antiraid: ${ayar.antiraid ? '✅' : '❌'}
- Spam Engel: ${ayar.spamEngel ? '✅' : '❌'}
- Reklam Engel: ${ayar.reklamEngel ? '✅' : '❌'}
- Capslock Engel: ${ayar.capslockEngel ? '✅' : '❌'}
- Etiket Engel: ${ayar.etiketEngel ? '✅' : '❌'}
- Rol Koruma: ${ayar.rolKoruma ? '✅' : '❌'}
- Kanal Koruma: ${ayar.kanalKoruma ? '✅' : '❌'}
- Webhook Koruma: ${ayar.webhookKoruma ? '✅' : '❌'}
- Emoji Koruma: ${ayar.emojiKoruma ? '✅' : '❌'}
- Log Kanalı: ${ayar.logKanal ? `<#${ayar.logKanal}>` : 'Ayarlanmadı'}
      `;

      interaction.reply({ content: durumMetni, ephemeral: true });
    }

    // Kayıt
    else if (commandName === 'kayıt') {
      const hedef = options.getUser('kullanıcı');
      const isim = options.getString('isim');
      const yas = options.getInteger('yaş');
      const hedefMember = guild.members.cache.get(hedef.id);

      if (!hedefMember) return interaction.reply({ content: '❌ Kullanıcı sunucuda bulunamadı.', ephemeral: true });

      try {
        await hedefMember.setNickname(`${isim} | ${yas}`);
        // Kayıt rolü verelim (env den ROLE_UYE)
        const uyeRol = guild.roles.cache.get(process.env.ROLE_UYE);
        if (uyeRol) await hedefMember.roles.add(uyeRol);

        // Kayıtsız rolü sil (env den ROLE_KAYITSIZ)
        const kayitsizRol = guild.roles.cache.get(process.env.ROLE_KAYITSIZ);
        if (kayitsizRol && hedefMember.roles.cache.has(kayitsizRol.id)) {
          await hedefMember.roles.remove(kayitsizRol);
        }

        interaction.reply({ content: `✅ ${hedef.tag} kayıt edildi: ${isim}, ${yas}` });
      } catch {
        interaction.reply({ content: '❌ Kayıt işlemi sırasında hata oluştu.', ephemeral: true });
      }
    }

    // Komutlar listesi (sayfalı ve emojili)
    else if (commandName === 'komutlar') {
      const pages = [
        `**Moderasyon Komutları:**\n
/ban @kullanıcı [sebep]\n
/kick @kullanıcı [sebep]\n
/mute @kullanıcı [süre]\n
/unmute @kullanıcı\n
/untimeout @kullanıcı\n
/warn @kullanıcı [sebep]\n
/warnings @kullanıcı\n
/clear [sayı]\n
/lock\n
/unlock\n
/slowmode [saniye]
        `,
        `**Koruma Komutları:**\n
/koruma aç/kapat\n
/antiraid aç/kapat\n
/spam-engel aç/kapat\n
/reklam-engel aç/kapat\n
/capslock-engel aç/kapat\n
/etiket-engel aç/kapat\n
/rol-koruma aç/kapat\n
/kanal-koruma aç/kapat\n
/webhook-koruma aç/kapat\n
/emoji-koruma aç/kapat\n
/log-ayarla #kanal
        `,
        `**Diğer Komutlar:**\n
/cezalar @kullanıcı\n
/cezaişlemler\n
/koruma-durum\n
/kayıt @kullanıcı isim yaş\n
/komutlar
        `
      ];

      let page = 0;
      const embed = new EmbedBuilder()
        .setTitle('Komutlar')
        .setDescription(pages[page])
        .setColor(0x00ffff)
        .setFooter({ text: `Sayfa ${page + 1} / ${pages.length}` });

      const mesaj = await interaction.reply({ embeds: [embed], fetchReply: true });

      // Emoji ile sayfa değiştirme
      const emojis = ['⬅️', '➡️'];
      for (const emoji of emojis) await mesaj.react(emoji);

      const filter = (reaction, user) => emojis.includes(reaction.emoji.name) && !user.bot && user.id === interaction.user.id;
      const collector = mesaj.createReactionCollector({ filter, time: 60000 });

      collector.on('collect', r => {
        if (r.emoji.name === '➡️') {
          page = page + 1 < pages.length ? page + 1 : 0;
        } else if (r.emoji.name === '⬅️') {
          page = page - 1 >= 0 ? page - 1 : pages.length - 1;
        }
        embed.setDescription(pages[page]);
        embed.setFooter({ text: `Sayfa ${page + 1} / ${pages.length}` });
        mesaj.edit({ embeds: [embed] });
        r.users.remove(interaction.user.id).catch(() => { });
      });

      collector.on('end', () => {
        mesaj.reactions.removeAll().catch(() => { });
      });
    }
  } catch (error) {
    console.error('Komut Hatası:', error);
    interaction.reply({ content: '❌ Komut çalıştırılırken bir hata oluştu.', ephemeral: true });
  }
});

// --- LOGLAMA (Örnek Mod Log) ---

client.on('guildMemberAdd', member => {
  const kanalId = global.korumaAyar.logKanal;
  if (!kanalId) return;
  const kanal = member.guild.channels.cache.get(kanalId);
  if (!kanal) return;

  const embed = new EmbedBuilder()
    .setTitle('Yeni Üye Katıldı')
    .setDescription(`${member.user.tag} sunucuya katıldı.`)
    .setColor(0x00ff00)
    .setTimestamp();

  kanal.send({ embeds: [embed] }).catch(() => { });
});

client.on('guildMemberRemove', member => {
  const kanalId = global.korumaAyar.logKanal;
  if (!kanalId) return;
  const kanal = member.guild.channels.cache.get(kanalId);
  if (!kanal) return;

  const embed = new EmbedBuilder()
    .setTitle('Üye Ayrıldı')
    .setDescription(`${member.user.tag} sunucudan ayrıldı.`)
    .setColor(0xff0000)
    .setTimestamp();

  kanal.send({ embeds: [embed] }).catch(() => { });
});

// Diğer loglama ve koruma olaylarını buraya ekleyebilirsin (örneğin rol silme, kanal silme, webhook silme gibi)

// LOGIN kodu zaten part1'de var
// LOGIN
client.login(process.env.TOKEN);
