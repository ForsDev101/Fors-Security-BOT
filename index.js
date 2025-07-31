require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const ms = require('ms');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// RPG renk dizisi ve fonksiyonu (embed renkleri için)
const rpgColors = [
  '#8B0000', '#B22222', '#DC143C',
  '#FF4500', '#FF6347', '#FF8C00',
  '#FFD700',
];
let rpgIndex = 0;
function getRPGColor() {
  rpgIndex++;
  if (rpgIndex >= rpgColors.length) rpgIndex = 0;
  return rpgColors[rpgIndex];
}

// Embed oluşturucu fonksiyon
function createEmbed(description, title = '', color = getRPGColor()) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

// Basit runtime veri (uyarılar, cezalar, koruma durumları)
const db = {
  warnings: {}, // { guildId: { userId: [sebep, ...] } }
  cezalar: {},  // { guildId: { userId: [ {tip, sebep} ] } }
  koruma: {
    aktif: true,
    antiraid: true,
    spamEngel: true,
    reklamEngel: true,
    capslockEngel: true,
    etiketEngel: true,
    rolKoruma: true,
    kanalKoruma: true,
    webhookKoruma: true,
    emojiKoruma: true,
  },
  logKanal: null,
};

// OTOMATİK KAYITSIZ ROL VERME VE GELEN-GİDEN LOG
client.on(Events.GuildMemberAdd, async member => {
  try {
    const kayıtsızRol = member.guild.roles.cache.get(process.env.ROLE_KAYITSIZ);
    if (kayıtsızRol) await member.roles.add(kayıtsızRol);

    const log = member.guild.channels.cache.get(process.env.LOG_GELENGIDEN);
    if (log) {
      const embed = createEmbed(`${member.user.tag} sunucuya katıldı ve otomatik kayıtsız rolü verildi.`, 'Yeni Üye Katılımı');
      log.send({ embeds: [embed] });
    }
  } catch (e) {
    console.error('Kayıtsız rol verme hatası:', e);
  }
});

client.on(Events.GuildMemberRemove, member => {
  const log = member.guild.channels.cache.get(process.env.LOG_GELENGIDEN);
  if (!log) return;
  const embed = createEmbed(`${member.user.tag} sunucudan ayrıldı.`, 'Üye Ayrıldı');
  log.send({ embeds: [embed] });
});

// ROLLBACK & KORUMA ŞABLONU (örnek kanal silme engelleme + log + ban) - Geliştirilebilir
client.on(Events.ChannelDelete, async kanal => {
  if (!db.koruma.kanalKoruma) return;
  const guild = kanal.guild;
  // Rollback: Kanalı yeniden oluştur
  try {
    await guild.channels.create({
      name: kanal.name,
      type: kanal.type,
      parent: kanal.parentId,
      permissionOverwrites: kanal.permissionOverwrites.cache.map(p => ({
        id: p.id,
        allow: p.allow.bitfield,
        deny: p.deny.bitfield,
      })),
      topic: kanal.topic,
      nsfw: kanal.nsfw,
      bitrate: kanal.bitrate,
      userLimit: kanal.userLimit,
      rateLimitPerUser: kanal.rateLimitPerUser,
    });
  } catch (err) {
    console.error('Rollback kanal oluşturma hatası:', err);
  }
  // Ban ve log
  const audit = (await guild.fetchAuditLogs({ type: 'CHANNEL_DELETE', limit: 1 })).entries.first();
  if (!audit) return;
  const culprit = audit.executor;
  if (!culprit || culprit.id === client.user.id) return;

  try {
    const member = await guild.members.fetch(culprit.id);
    if (!member.bannable) return;
    await member.ban({ reason: 'Yetkisiz kanal silme - Rollback ve ban' });

    const log = guild.channels.cache.get(process.env.LOG_KOMUT);
    if (log) {
      const embed = createEmbed(`${culprit.tag} yetkisiz kanal sildi ve banlandı.`, 'Kanak Silme Koruması');
      log.send({ embeds: [embed] });
    }
  } catch (e) {
    console.error('Rollback banlama hatası:', e);
  }
});

// Slash komutlar işleyici
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.guild) return interaction.reply({ content: 'Bu komut sadece sunucularda kullanılabilir.', ephemeral: true });

  // BotYetki rol kontrolü
  const botYetkiRolID = process.env.ROLE_BOTYETKI;
  if (!interaction.member.roles.cache.has(botYetkiRolID)) {
    return interaction.reply({ content: 'Bu komutu kullanmak için BotYetki rolüne sahip olmalısın.', ephemeral: true });
  }

  const logKanal = interaction.guild.channels.cache.get(process.env.LOG_KOMUT);

  try {
    switch (interaction.commandName) {

      // Ban
      case 'ban': {
        const hedef = interaction.options.getUser('kullanıcı');
        const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
        const member = interaction.guild.members.cache.get(hedef.id);
        if (!member) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });
        if (!member.bannable) return interaction.reply({ content: 'Bu kullanıcıyı banlayamam.', ephemeral: true });

        await member.ban({ reason: sebep });
        try { await hedef.send(`Sunucudan banlandınız. Sebep: ${sebep}`); } catch {}
        const embed = createEmbed(`${hedef.tag} banlandı.\nSebep: ${sebep}`, 'Ban İşlemi');
        interaction.reply({ embeds: [embed] });

        // Log
        if (logKanal) logKanal.send({ embeds: [createEmbed(`${interaction.user.tag} tarafından ${hedef.tag} banlandı.\nSebep: ${sebep}`, 'Ban Log')] });
        break;
      }

      // Kick
      case 'kick': {
        const hedef = interaction.options.getUser('kullanıcı');
        const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
        const member = interaction.guild.members.cache.get(hedef.id);
        if (!member) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });
        if (!member.kickable) return interaction.reply({ content: 'Bu kullanıcıyı atamam.', ephemeral: true });

        await member.kick(sebep);
        try { await hedef.send(`Sunucudan atıldınız. Sebep: ${sebep}`); } catch {}
        const embed = createEmbed(`${hedef.tag} atıldı.\nSebep: ${sebep}`, 'Kick İşlemi');
        interaction.reply({ embeds: [embed] });

        if (logKanal) logKanal.send({ embeds: [createEmbed(`${interaction.user.tag} tarafından ${hedef.tag} atıldı.\nSebep: ${sebep}`, 'Kick Log')] });
        break;
      }

      // Mute
      case 'mute': {
        const hedef = interaction.options.getUser('kullanıcı');
        const sure = interaction.options.getString('süre') || '10m';
        const member = interaction.guild.members.cache.get(hedef.id);
        if (!member) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });

        let sureMs;
        try {
          sureMs = ms(sure);
          if (!sureMs) throw new Error();
        } catch {
          return interaction.reply({ content: 'Geçerli bir süre belirtmelisin. Örnek: 10m, 1h', ephemeral: true });
        }

        await member.timeout(sureMs, `Susturma süresi: ${sure}`);
        const embed = createEmbed(`${hedef.tag} ${sure} süreyle susturuldu.`, 'Mute İşlemi');
        interaction.reply({ embeds: [embed] });

        if (logKanal) logKanal.send({ embeds: [createEmbed(`${interaction.user.tag} tarafından ${hedef.tag} ${sure} süreyle susturuldu.`, 'Mute Log')] });
        break;
      }

      // Unmute
      case 'unmute': {
        const hedef = interaction.options.getUser('kullanıcı');
        const member = interaction.guild.members.cache.get(hedef.id);
        if (!member) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });

        await member.timeout(null);
        const embed = createEmbed(`${hedef.tag} susturması kaldırıldı.`, 'Unmute İşlemi');
        interaction.reply({ embeds: [embed] });

        if (logKanal) logKanal.send({ embeds: [createEmbed(`${interaction.user.tag} tarafından ${hedef.tag} susturması kaldırıldı.`, 'Unmute Log')] });
        break;
      }

      // Untimeout (Aynı unmute aslında)
      case 'untimeout': {
        const hedef = interaction.options.getUser('kullanıcı');
        const member = interaction.guild.members.cache.get(hedef.id);
        if (!member) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });

        await member.timeout(null);
        const embed = createEmbed(`${hedef.tag} timeoutu kaldırıldı.`, 'Timeout Kaldırma');
        interaction.reply({ embeds: [embed] });

        if (logKanal) logKanal.send({ embeds: [createEmbed(`${interaction.user.tag} tarafından ${hedef.tag} timeoutu kaldırıldı.`, 'Timeout Log')] });
        break;
      }

      // Warn
      case 'warn': {
        const hedef = interaction.options.getUser('kullanıcı');
        const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
        if (!db.warnings[interaction.guild.id]) db.warnings[interaction.guild.id] = {};
        if (!db.warnings[interaction.guild.id][hedef.id]) db.warnings[interaction.guild.id][hedef.id] = [];

        db.warnings[interaction.guild.id][hedef.id].push(sebep);

        const embed = createEmbed(`${hedef.tag} uyarıldı.\nSebep: ${sebep}`, 'Uyarı Verildi');
        interaction.reply({ embeds: [embed] });

        if (logKanal) logKanal.send({ embeds: [createEmbed(`${interaction.user.tag} tarafından ${hedef.tag} uyarıldı.\nSebep: ${sebep}`, 'Uyarı Log')] });
        break;
      }

      // Warnings
      case 'warnings': {
        const hedef = interaction.options.getUser('kullanıcı');
        const uyarilar = db.warnings[interaction.guild.id]?.[hedef.id] || [];

        if (uyarilar.length === 0) {
          return interaction.reply({ content: `${hedef.tag} kullanıcısının hiç uyarısı yok.`, ephemeral: true });
        }

        const embed = createEmbed(`${hedef.tag} kullanıcısının uyarıları:\n- ${uyarilar.join('\n- ')}`, 'Uyarı Listesi');
        interaction.reply({ embeds: [embed] });
        break;
      }

      // Clear
      case 'clear': {
        const sayi = interaction.options.getInteger('sayı');
        if (sayi < 1 || sayi > 100) {
          return interaction.reply({ content: '1 ile 100 arasında bir sayı giriniz.', ephemeral: true });
        }
        const channel = interaction.channel;
        const messages = await channel.messages.fetch({ limit: sayi });
        await channel.bulkDelete(messages, true);
        const embed = createEmbed(`${sayi} mesaj silindi.`, 'Mesaj Temizleme');
        interaction.reply({ embeds: [embed] });
        break;
      }

      // Lock
      case 'lock': {
        const channel = interaction.channel;
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
        const embed = createEmbed(`${channel.name} kanalı kilitlendi.`, 'Kanal Kilitlendi');
        interaction.reply({ embeds: [embed] });

        if (logKanal) logKanal.send({ embeds: [createEmbed(`${interaction.user.tag} ${channel.name} kanalını kilitledi.`, 'Kanal Kilit Log')] });
        break;
      }

      // Unlock
      case 'unlock': {
        const channel = interaction.channel;
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
        const embed = createEmbed(`${channel.name} kanalının kilidi açıldı.`, 'Kanal Kilidi Açıldı');
        interaction.reply({ embeds: [embed] });

        if (logKanal) logKanal.send({ embeds: [createEmbed(`${interaction.user.tag} ${channel.name} kanalının kilidini açtı.`, 'Kanal Kilit Kaldırma Log')] });
        break;
      }

      // Slowmode
      case 'slowmode': {
        const saniye = interaction.options.getInteger('saniye');
        if (saniye < 0 || saniye > 21600) return interaction.reply({ content: '0 ile 21600 saniye arasında olmalı.', ephemeral: true });
        const channel = interaction.channel;
        await channel.setRateLimitPerUser(saniye);
        const embed = createEmbed(`${channel.name} kanalına yavaş mod (${saniye}s) ayarlandı.`, 'Slowmode Ayarlandı');
        interaction.reply({ embeds: [embed] });

        if (logKanal) logKanal.send({ embeds: [createEmbed(`${interaction.user.tag} ${channel.name} kanalına yavaş mod (${saniye}s) ayarladı.`, 'Slowmode Log')] });
        break;
      }

      // Cezalar
      case 'cezalar': {
        const hedef = interaction.options.getUser('kullanıcı');
        const cezalar = db.cezalar[interaction.guild.id]?.[hedef.id] || [];
        if (cezalar.length === 0) return interaction.reply({ content: `${hedef.tag} kullanıcısının cezası yok.`, ephemeral: true });

        const liste = cezalar.map((c, i) => `${i + 1}. ${c.tip} - Sebep: ${c.sebep}`).join('\n');
        const embed = createEmbed(`${hedef.tag} kullanıcısının cezaları:\n${liste}`, 'Ceza Listesi');
        interaction.reply({ embeds: [embed] });
        break;
      }

      // Ceza işlemler
      case 'cezaişlemler': {
        // Burada tüm ceza geçmişi gösterilebilir, basit örnek olarak gösteriyorum.
        let text = '';
        for (const guildId in db.cezalar) {
          for (const userId in db.cezalar[guildId]) {
            text += `Sunucu: ${guildId} - Kullanıcı: ${userId} - Cezalar: ${db.cezalar[guildId][userId].length}\n`;
          }
        }
        if (!text) text = 'Hiç ceza işlemi yok.';
        const embed = createEmbed(text, 'Tüm Ceza İşlemleri');
        interaction.reply({ embeds: [embed] });
        break;
      }

      // Koruma Durum
      case 'koruma-durum': {
        const durumlar = db.koruma;
        let text = '';
        for (const korumaAdi in durumlar) {
          text += `**${korumaAdi}**: ${durumlar[korumaAdi] ? 'Açık' : 'Kapalı'}\n`;
        }
        interaction.reply({ embeds: [createEmbed(text, 'Koruma Durumları')] });
        break;
      }

      // Log ayarla
      case 'log-ayarla': {
        const kanal = interaction.options.getChannel('kanal');
        if (!kanal.isTextBased()) return interaction.reply({ content: 'Lütfen metin kanalı seç.', ephemeral: true });
        db.logKanal = kanal;
        interaction.reply({ embeds: [createEmbed(`${kanal} kanalı log kanalı olarak ayarlandı.`, 'Log Kanalı Ayarlandı')] });
        break;
      }

      // Kayıt (basit versiyon)
      case 'kayıt': {
        const hedef = interaction.options.getUser('kullanıcı');
        const isim = interaction.options.getString('isim');
        const yas = interaction.options.getString('yaş');

        const guild = interaction.guild;
        const member = guild.members.cache.get(hedef.id);
        if (!member) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });

        // Kayıt rolü ve kayıtsız rolü
        const kayıtsızRol = guild.roles.cache.get(process.env.ROLE_KAYITSIZ);
        const uyeRol = guild.roles.cache.get(process.env.ROLE_UYE);
        if (!kayıtsızRol || !uyeRol) return interaction.reply({ content: 'Rol ayarları eksik.', ephemeral: true });

        await member.setNickname(`${isim} | ${yas}`).catch(() => {});
        await member.roles.remove(kayıtsızRol).catch(() => {});
        await member.roles.add(uyeRol).catch(() => {});

        const embed = createEmbed(`${member.user.tag} kaydedildi.\nİsim: ${isim}\nYaş: ${yas}`, 'Kayıt İşlemi');
        interaction.reply({ embeds: [embed] });

        // Gelen-giden log
        const log = guild.channels.cache.get(process.env.LOG_GELENGIDEN);
        if (log) log.send({ embeds: [createEmbed(`${member.user.tag} kayıt oldu.`, 'Kayıt Log')] });
        break;
      }

      // Komutlar sayfası 3 sayfa + emojili butonlar
      case 'komutlar': {
        const pages = [
          createEmbed(`**Moderasyon Komutları:**
/ban @kullanıcı [sebep]
/kick @kullanıcı [sebep]
/mute @kullanıcı [süre]
/unmute @kullanıcı
/untimeout @kullanıcı
/warn @kullanıcı [sebep]
/warnings @kullanıcı
/clear [sayı]
/lock
/unlock
/slowmode [saniye]
`, 'Komutlar - 1/3'),

          createEmbed(`**Koruma Komutları:**
/koruma aç/kapat
/antiraid aç/kapat
/spam-engel aç/kapat
/reklam-engel aç/kapat
/capslock-engel aç/kapat
/etiket-engel aç/kapat
/rol-koruma aç/kapat
/kanal-koruma aç/kapat
/webhook-koruma aç/kapat
/emoji-koruma aç/kapat
/log-ayarla #kanal
`, 'Komutlar - 2/3'),

          createEmbed(`**Diğer Komutlar:**
/cezalar @kullanıcı
/cezaişlemler
/koruma-durum
/kayıt @kullanıcı isim yaş
/komutlar
`, 'Komutlar - 3/3'),
        ];

        let page = 0;

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('⬅️')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('➡️')
            .setStyle(ButtonStyle.Primary),
        );

        await interaction.reply({ embeds: [pages[page]], components: [row] });

        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
          if (i.customId === 'prev') {
            page = page > 0 ? page - 1 : pages.length - 1;
            await i.update({ embeds: [pages[page]], components: [row] });
          }
          if (i.customId === 'next') {
            page = page < pages.length - 1 ? page + 1 : 0;
            await i.update({ embeds: [pages[page]], components: [row] });
          }
        });

        collector.on('end', () => {
          interaction.editReply({ components: [] }).catch(() => {});
        });
        break;
      }

      default:
        return interaction.reply({ content: 'Bilinmeyen komut!', ephemeral: true });
    }
  } catch (error) {
    console.error('Komut hatası:', error);
    if (!interaction.replied)
      interaction.reply({ content: 'Komut çalıştırılırken hata oluştu.', ephemeral: true });
  }
});

// Bot hazır olduğunda
client.once(Events.ClientReady, () => {
  console.log(`Bot aktif! Giriş yapıldı: ${client.user.tag}`);
});

// Botu başlat
client.login(process.env.TOKEN);
