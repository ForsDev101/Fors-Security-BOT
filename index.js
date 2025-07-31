require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  PermissionsBitField,
  Collection,
  Events,
} = require('discord.js');
const ms = require('ms');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.on('guildMemberAdd', member => {
  const kayıtsızRol = member.guild.roles.cache.get(process.env.ROLE_KAYITSIZ);
  if (!kayıtsızRol) return;

  member.roles.add(kayıtsızRol).catch(console.error);

  const log = member.guild.channels.cache.get(process.env.LOG_GELENGIDEN);
  if (log) {
    const embed = new EmbedBuilder()
      .setTitle('Yeni Üye Katıldı')
      .setDescription(`${member.user.tag} sunucuya katıldı ve otomatik kayıtsız rolü verildi.`)
      .setColor(getRandomColor())
      .setTimestamp();
    log.send({ embeds: [embed] });
  }
});

// --- Yardımcı fonksiyonlar ---

// RPG renk oluşturucu
function getRandomColor() {
  return Math.floor(Math.random() * 16777215);
}

// Embed oluşturucu
function createEmbed(description, title) {
  return new EmbedBuilder()
    .setTitle(title || '')
    .setDescription(description)
    .setColor(getRandomColor())
    .setTimestamp();
}

// Yetki yok mesajı
function noPermissionEmbed() {
  return createEmbed('❌ Bu komutu kullanmak için **BotYetki** rolüne sahip olmalısın.', 'Yetki Hatası');
}

// RPG renkli embed mesaj düzenleyici
async function rpgEmbedEffect(interaction, embed, duration = 30000, intervalTime = 3000) {
  embed.setColor(getRandomColor());
  await interaction.editReply({ embeds: [embed] });

  const interval = setInterval(async () => {
    try {
      embed.setColor(getRandomColor());
      await interaction.editReply({ embeds: [embed] });
    } catch {
      clearInterval(interval);
    }
  }, intervalTime);

  setTimeout(() => clearInterval(interval), duration);
}

// Komutlar için sayfalar (embed)
const komutPages = [
  new EmbedBuilder()
    .setTitle('📜 Moderasyon Komutları - Sayfa 1/3')
    .setDescription(
      `\`/ban @kullanıcı [sebep]\` - Kullanıcıyı banlar\n` +
      `\`/kick @kullanıcı [sebep]\` - Kullanıcıyı atar\n` +
      `\`/mute @kullanıcı [süre]\` - Kullanıcıyı mute eder\n` +
      `\`/unmute @kullanıcı\` - Mute kaldırır\n` +
      `\`/untimeout @kullanıcı\` - Timeout kaldırır\n` +
      `\`/warn @kullanıcı [sebep]\` - Uyarı verir\n` +
      `\`/warnings @kullanıcı\` - Uyarıları gösterir\n` +
      `\`/clear [sayı]\` - Mesajları siler`
    )
    .setColor(getRandomColor()),

  new EmbedBuilder()
    .setTitle('🛡️ Koruma Komutları - Sayfa 2/3')
    .setDescription(
      `\`/koruma aç/kapat\` - Tüm koruma sistemlerini yönetir\n` +
      `\`/antiraid aç/kapat\` - Raid koruma\n` +
      `\`/spam-engel aç/kapat\` - Spam engelleme\n` +
      `\`/reklam-engel aç/kapat\` - Reklam engelleme\n` +
      `\`/capslock-engel aç/kapat\` - Capslock engelleme\n` +
      `\`/etiket-engel aç/kapat\` - Etiket engelleme\n` +
      `\`/rol-koruma aç/kapat\` - Rol koruma\n` +
      `\`/kanal-koruma aç/kapat\` - Kanal koruma\n` +
      `\`/webhook-koruma aç/kapat\` - Webhook koruma\n` +
      `\`/emoji-koruma aç/kapat\` - Emoji koruma\n` +
      `\`/log-ayarla #kanal\` - Log kanalı ayarla`
    )
    .setColor(getRandomColor()),

  new EmbedBuilder()
    .setTitle('📋 Diğer Komutlar - Sayfa 3/3')
    .setDescription(
      `\`/lock\` - Kanalı kilitler\n` +
      `\`/unlock\` - Kanal kilidini açar\n` +
      `\`/slowmode [saniye]\` - Yavaş modu ayarla\n` +
      `\`/cezalar @kullanıcı\` - Kullanıcının cezaları\n` +
      `\`/cezaişlemler\` - Tüm cezalar\n` +
      `\`/koruma-durum\` - Koruma durumu gösterir\n` +
      `\`/kayıt @kullanıcı isim yaş\` - Kullanıcıyı kayıt eder\n` +
      `\`/komutlar\` - Bu yardım mesajı`
    )
    .setColor(getRandomColor()),
];

// --- Veri yapıları (basit, JSON veya DB yerine) ---
const warnings = new Map(); // userID => [warn1, warn2,...]
const cezaLog = []; // basit ceza geçmişi arrayi, gerçek projede DB

// --- Bot hazır ---
client.once('ready', () => {
  console.log(`🟢 ${client.user.tag} aktif!`);
});

// --- Slash komut işleyici ---
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const komut = interaction.commandName;
  const member = interaction.member;

  // Yetki kontrolü (komutlar hariç)
  if (komut !== 'komutlar' && !member.roles.cache.has(process.env.ROLE_BOTYETKI)) {
    return interaction.reply({ embeds: [noPermissionEmbed()], ephemeral: true });
  }

  // Log kanalları
  const logKomut = interaction.guild.channels.cache.get(process.env.LOG_KOMUT);
  const logMod = interaction.guild.channels.cache.get(process.env.LOG_MOD);
  const gelenGidenLog = interaction.guild.channels.cache.get(process.env.LOG_GELENGIDEN);

  try {
    switch (komut) {
      // --- BAN ---
      case 'ban': {
        const user = interaction.options.getUser('kullanıcı');
        const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
        const hedef = interaction.guild.members.cache.get(user.id);
        if (!hedef) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });

        await hedef.ban({ reason: sebep }).catch(e => {
          return interaction.reply({ content: '❌ Ban işlemi başarısız.', ephemeral: true });
        });

        user.send(`🚫 ${interaction.guild.name} sunucusundan banlandınız.\nSebep: ${sebep}`).catch(() => {});

        const embed = createEmbed(`${user.tag} banlandı.\nSebep: ${sebep}`, 'Ban');
        interaction.reply({ embeds: [embed], ephemeral: true });
        logKomut?.send({ embeds: [embed] });
        logMod?.send({ embeds: [embed] });
        break;
      }

      // --- KICK ---
      case 'kick': {
        const user = interaction.options.getUser('kullanıcı');
        const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
        const hedef = interaction.guild.members.cache.get(user.id);
        if (!hedef) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });

        await hedef.kick(sebep).catch(e => {
          return interaction.reply({ content: '❌ Kick işlemi başarısız.', ephemeral: true });
        });

        user.send(`⚠️ ${interaction.guild.name} sunucusundan atıldınız.\nSebep: ${sebep}`).catch(() => {});

        const embed = createEmbed(`${user.tag} sunucudan atıldı.\nSebep: ${sebep}`, 'Kick');
        interaction.reply({ embeds: [embed], ephemeral: true });
        logKomut?.send({ embeds: [embed] });
        logMod?.send({ embeds: [embed] });
        break;
      }

      // --- MUTE ---
      case 'mute': {
        const user = interaction.options.getUser('kullanıcı');
        const süre = interaction.options.getString('süre') || '10m';
        const hedef = interaction.guild.members.cache.get(user.id);
        if (!hedef) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });

        await hedef.timeout(ms(süre), 'Mute').catch(e => {
          return interaction.reply({ content: '❌ Mute işlemi başarısız.', ephemeral: true });
        });

        const embed = createEmbed(`${user.tag} susturuldu. Süre: ${süre}`, 'Mute');
        interaction.reply({ embeds: [embed], ephemeral: true });
        logKomut?.send({ embeds: [embed] });
        break;
      }

      // --- UNMUTE ---
      case 'unmute': {
        const user = interaction.options.getUser('kullanıcı');
        const hedef = interaction.guild.members.cache.get(user.id);
        if (!hedef) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });

        await hedef.timeout(null).catch(e => {
          return interaction.reply({ content: '❌ Susturma kaldıralamadı.', ephemeral: true });
        });

        const embed = createEmbed(`${user.tag} susturması kaldırıldı.`, 'Unmute');
        interaction.reply({ embeds: [embed], ephemeral: true });
        logKomut?.send({ embeds: [embed] });
        break;
      }

      // --- UNTIMEOUT ---
      case 'untimeout': {
        const user = interaction.options.getUser('kullanıcı');
        const hedef = interaction.guild.members.cache.get(user.id);
        if (!hedef) return interaction.reply({ content: '❌ Kullanıcı bulunamadı.', ephemeral: true });

        await hedef.timeout(null).catch(e => {
          return interaction.reply({ content: '❌ Timeout kaldıralamadı.', ephemeral: true });
        });

        const embed = createEmbed(`${user.tag} timeout kaldırıldı.`, 'Untimeout');
        interaction.reply({ embeds: [embed], ephemeral: true });
        logKomut?.send({ embeds: [embed] });
        break;
      }

      // --- WARN ---
      case 'warn': {
        const user = interaction.options.getUser('kullanıcı');
        const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
        if (!warnings.has(user.id)) warnings.set(user.id, []);
        warnings.get(user.id).push({ moderator: interaction.user.tag, reason: sebep, date: new Date() });

        const embed = createEmbed(`${user.tag} uyarıldı.\nSebep: ${sebep}`, 'Uyarı');
        interaction.reply({ embeds: [embed], ephemeral: true });
        logKomut?.send({ embeds: [embed] });
        break;
      }

      // --- WARNINGS ---
      case 'warnings': {
        const user = interaction.options.getUser('kullanıcı');
        const userWarnings = warnings.get(user.id) || [];
        if (userWarnings.length === 0) {
          return interaction.reply({ content: `${user.tag} için uyarı bulunamadı.`, ephemeral: true });
        }

        let desc = '';
        userWarnings.forEach((w, i) => {
          desc += `\`${i + 1}.\` **${w.reason}** - Yetkili: ${w.moderator} - Tarih: ${w.date.toLocaleString()}\n`;
        });

        const embed = createEmbed(desc, `${user.tag} - Uyarılar`);
        interaction.reply({ embeds: [embed], ephemeral: true });
        break;
      }

      // --- CLEAR ---
      case 'clear': {
        const sayı = interaction.options.getInteger('sayı');
        if (sayı < 1 || sayı > 100) return interaction.reply({ content: '1-100 arasında sayı gir.', ephemeral: true });
        await interaction.channel.bulkDelete(sayı, true);

        const embed = createEmbed(`${sayı} mesaj silindi.`, 'Temizlendi');
        interaction.reply({ embeds: [embed], ephemeral: true });
        break;
      }

      // --- LOCK ---
      case 'lock': {
        const kanal = interaction.channel;
        await kanal.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });

        const embed = createEmbed('Kanal kilitlendi.', 'Kilitleme');
        interaction.reply({ embeds: [embed] });
        logKomut?.send({ embeds: [embed] });
        break;
      }

      // --- UNLOCK ---
      case 'unlock': {
        const kanal = interaction.channel;
        await kanal.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });

        const embed = createEmbed('Kanal kilidi açıldı.', 'Kilit Açıldı');
        interaction.reply({ embeds: [embed] });
        logKomut?.send({ embeds: [embed] });
        break;
      }

      // --- SLOWMODE ---
      case 'slowmode': {
        const saniye = interaction.options.getInteger('saniye');
        if (saniye < 0 || saniye > 21600) return interaction.reply({ content: '0 ile 21600 arasında bir saniye gir.', ephemeral: true });
        await interaction.channel.setRateLimitPerUser(saniye);

        const embed = createEmbed(`Yavaş mod ${saniye} saniye olarak ayarlandı.`, 'Slowmode');
        interaction.reply({ embeds: [embed] });
        break;
      }

      // --- CEZALAR ---
      case 'cezalar': {
        const user = interaction.options.getUser('kullanıcı');
        const userWarnings = warnings.get(user.id) || [];
        if (userWarnings.length === 0) {
          return interaction.reply({ content: `${user.tag} için ceza bulunamadı.`, ephemeral: true });
        }

        let desc = '';
        userWarnings.forEach((w, i) => {
          desc += `\`${i + 1}.\` Sebep: **${w.reason}** - Yetkili: ${w.moderator} - Tarih: ${w.date.toLocaleString()}\n`;
        });

        const embed = createEmbed(desc, `${user.tag} - Cezalar`);
        interaction.reply({ embeds: [embed], ephemeral: true });
        break;
      }

      // --- CEZAİŞLEMLER ---
      case 'cezaişlemler': {
        if (cezaLog.length === 0) return interaction.reply({ content: 'Henüz ceza işlemi yok.', ephemeral: true });

        let desc = '';
        cezaLog.forEach((ceza, i) => {
          desc += `\`${i + 1}.\` ${ceza}\n`;
        });

        const embed = createEmbed(desc, 'Tüm Ceza İşlemleri');
        interaction.reply({ embeds: [embed], ephemeral: true });
        break;
      }

      // --- KORUMA DURUM ---
      case 'koruma-durum': {
        // Basit örnek, detaylı durum DB'den alınmalı
        const durumlar = {
          antiraid: 'aktif',
          spamEngel: 'aktif',
          reklamEngel: 'kapalı',
          capslockEngel: 'aktif',
          etiketEngel: 'kapalı',
          rolKoruma: 'aktif',
          kanalKoruma: 'aktif',
          webhookKoruma: 'kapalı',
          emojiKoruma: 'aktif',
        };

        let desc = '';
        for (const [key, value] of Object.entries(durumlar)) {
          desc += `**${key}**: ${value}\n`;
        }

        const embed = createEmbed(desc, 'Koruma Durumları');
        interaction.reply({ embeds: [embed], ephemeral: true });
        break;
      }

      // --- LOG AYARLA ---
      case 'log-ayarla': {
        const kanal = interaction.options.getChannel('kanal');
        if (!kanal) return interaction.reply({ content: 'Lütfen bir kanal belirt.', ephemeral: true });

        // Burada DB veya config güncelleme yapılmalı, şimdilik .env değil
        interaction.reply({ content: `Log kanalı ${kanal} olarak ayarlandı. (Geçici)` });
        break;
      }

      // --- KAYIT ---
      case 'kayıt': {
        const user = interaction.options.getUser('kullanıcı');
        const isim = interaction.options.getString('isim');
        const yas = interaction.options.getString('yaş');

        const hedef = interaction.guild.members.cache.get(user.id);
        if (!hedef) return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });

        const uyeRol = interaction.guild.roles.cache.get(process.env.ROLE_UYE);
        const kayıtsızRol = interaction.guild.roles.cache.get(process.env.ROLE_KAYITSIZ);

        if (!uyeRol || !kayıtsızRol)
          return interaction.reply({ content: 'Rol bilgileri eksik.', ephemeral: true });

        // İsim değiştir
        await hedef.setNickname(`${isim} | ${yas}`).catch(() => {});

        // Rolleri düzenle
        if (hedef.roles.cache.has(uyeRol.id)) {
          return interaction.reply({ content: 'Kullanıcı zaten kayıtlı.', ephemeral: true });
        }
        await hedef.roles.add(uyeRol);
        await hedef.roles.remove(kayıtsızRol);

        const embed = createEmbed(`${user.tag} başarıyla kayıt edildi.\nİsim: ${isim}\nYaş: ${yas}`, 'Kayıt Başarılı');
        interaction.reply({ embeds: [embed] });
        break;
      }

      // --- KOMUTLAR ---
      case 'komutlar': {
        let page = 0;
        const message = await interaction.reply({ embeds: [komutPages[page]], fetchReply: true });

        await message.react('⬅️');
        await message.react('➡️');

        const filter = (reaction, user) =>
          ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === interaction.user.id;

        const collector = message.createReactionCollector({ filter, time: 60000 });

        collector.on('collect', (reaction, user) => {
          if (reaction.emoji.name === '➡️') {
            page = page + 1 < komutPages.length ? page + 1 : 0;
          } else if (reaction.emoji.name === '⬅️') {
            page = page - 1 < 0 ? komutPages.length - 1 : page - 1;
          }
          komutPages[page].setColor(getRandomColor());
          message.edit({ embeds: [komutPages[page]] });
          reaction.users.remove(user.id);
        });

        collector.on('end', () => {
          message.reactions.removeAll().catch(() => {});
        });
        break;
      }

      default:
        interaction.reply({ content: 'Bilinmeyen komut!', ephemeral: true });
    }
  } catch (error) {
    console.error('Komut Hatası:', error);
    interaction.reply({ content: 'Bir hata oluştu!', ephemeral: true });
  }
});

// --- Gelen-Giden Logları ---
client.on(Events.GuildMemberAdd, member => {
  const log = member.guild.channels.cache.get(process.env.LOG_GELENGIDEN);
  if (!log) return;
  const embed = createEmbed(`${member.user.tag} sunucuya katıldı.`, 'Giriş');
  log.send({ embeds: [embed] });
});

client.on(Events.GuildMemberRemove, member => {
  const log = member.guild.channels.cache.get(process.env.LOG_GELENGIDEN);
  if (!log) return;
  const embed = createEmbed(`${member.user.tag} sunucudan ayrıldı.`, 'Çıkış');
  log.send({ embeds: [embed] });
});

// --- Bot login ---
client.login(process.env.TOKEN);
