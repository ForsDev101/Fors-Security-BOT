import { Client, GatewayIntentBits, Partials, Events, EmbedBuilder, PermissionsBitField } from "discord.js";
import { config } from "dotenv";

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

const TOKEN = process.env.TOKEN;
const ROLE_BOTYETKI = process.env.ROLE_BOTYETKI;
const LOG_KOMUT = process.env.LOG_KOMUT;
const LOG_MOD = process.env.LOG_MOD;
const LOG_GELEN = process.env.LOG_GELEN;
const LOG_GIDEN = process.env.LOG_GIDEN;

const protectionSettings = {
  koruma: false,
  antiraid: false,
  spamEngel: false,
  reklamEngel: false,
  capslockEngel: false,
  etiketEngel: false,
  rolKoruma: false,
  kanalKoruma: false,
  webhookKoruma: false,
  emojiKoruma: false,
};

// Veri saklama (basit JSON objesi, istersen gerçek DB ekleyebilirsin)
const warns = {};
const cezalar = {};
const userMessageTimestamps = new Map();

function createEmbed(title, description, color = "#0099ff") {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

async function logToChannel(channelId, embed) {
  if (!channelId) return;
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel && channel.isTextBased()) {
      await channel.send({ embeds: [embed] });
    }
  } catch {}
}

function getRpgColor() {
  // RPG tarzı renk geçişi (basit örnek)
  const colors = ["#8B0000", "#B22222", "#DC143C", "#FF4500", "#FF6347"];
  return colors[Math.floor(Date.now() / 1000) % colors.length];
}

function hasBotYetkiRole(member) {
  return member.roles.cache.has(ROLE_BOTYETKI);
}

function parseDuration(str) {
  // Örnek: 10m, 2h, 30s
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case "s": return num * 1000;
    case "m": return num * 60 * 1000;
    case "h": return num * 60 * 60 * 1000;
    case "d": return num * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, member, guild, user } = interaction;

  if (!hasBotYetkiRole(member)) {
    return interaction.reply({ embeds: [createEmbed("⚠️ Hata", "Bu komutu kullanmak için BotYetki rolünüz olmalı!")], ephemeral: true });
  }

  switch (commandName) {
    case "ban": {
      const targetUser = interaction.options.getUser("kullanıcı");
      const sebep = interaction.options.getString("sebep") || "Sebep belirtilmedi";
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) return interaction.reply({ embeds: [createEmbed("❌ Hata", "Kullanıcı sunucuda bulunamadı.")], ephemeral: true });
      if (!targetMember.bannable) return interaction.reply({ embeds: [createEmbed("❌ Hata", "Bu kullanıcıyı banlayamam.")], ephemeral: true });

      await targetMember.ban({ reason: sebep });
      try { await targetUser.send(`Sunucudan banlandınız. Sebep: ${sebep}`); } catch {}

      // Ceza kaydı
      cezalar[guild.id] ??= {};
      cezalar[guild.id][targetUser.id] ??= [];
      cezalar[guild.id][targetUser.id].push({ tip: "ban", mod: user.tag, sebep, tarih: Date.now() });

      interaction.reply({ embeds: [createEmbed("✅ Banlandı", `${targetUser.tag} başarıyla banlandı.\nSebep: ${sebep}`, getRpgColor())] });
      await logToChannel(LOG_MOD, createEmbed("Ban İşlemi", `${user.tag} ${targetUser.tag} kullanıcısını banladı.\nSebep: ${sebep}`, getRpgColor()));
      await logToChannel(LOG_KOMUT, createEmbed("Komut Logu", `${user.tag} /ban komutu kullandı: ${targetUser.tag}`, getRpgColor()));
      break;
    }
    case "kick": {
      const targetUser = interaction.options.getUser("kullanıcı");
      const sebep = interaction.options.getString("sebep") || "Sebep belirtilmedi";
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) return interaction.reply({ embeds: [createEmbed("❌ Hata", "Kullanıcı sunucuda bulunamadı.")], ephemeral: true });
      if (!targetMember.kickable) return interaction.reply({ embeds: [createEmbed("❌ Hata", "Bu kullanıcıyı atamam.")], ephemeral: true });

      await targetMember.kick(sebep);
      try { await targetUser.send(`Sunucudan atıldınız. Sebep: ${sebep}`); } catch {}

      cezalar[guild.id] ??= {};
      cezalar[guild.id][targetUser.id] ??= [];
      cezalar[guild.id][targetUser.id].push({ tip: "kick", mod: user.tag, sebep, tarih: Date.now() });

      interaction.reply({ embeds: [createEmbed("✅ Atıldı", `${targetUser.tag} sunucudan atıldı.\nSebep: ${sebep}`, getRpgColor())] });
      await logToChannel(LOG_MOD, createEmbed("Kick İşlemi", `${user.tag} ${targetUser.tag} kullanıcısını attı.\nSebep: ${sebep}`, getRpgColor()));
      await logToChannel(LOG_KOMUT, createEmbed("Komut Logu", `${user.tag} /kick komutu kullandı: ${targetUser.tag}`, getRpgColor()));
      break;
    }
    case "mute": {
      const targetUser = interaction.options.getUser("kullanıcı");
      const sureStr = interaction.options.getString("süre") || "10m";
      const timeoutMs = parseDuration(sureStr);
      if (timeoutMs === null) return interaction.reply({ embeds: [createEmbed("❌ Hata", "Geçersiz süre formatı. Örnek: 10m, 1h, 30s")], ephemeral: true });

      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) return interaction.reply({ embeds: [createEmbed("❌ Hata", "Kullanıcı sunucuda bulunamadı.")], ephemeral: true });
      if (!targetMember.moderatable) return interaction.reply({ embeds: [createEmbed("❌ Hata", "Bu kullanıcıyı susturamıyorum.")], ephemeral: true });

      await targetMember.timeout(timeoutMs, `Mute sebebi: ${sureStr}`);
      try { await targetUser.send(`Sunucuda ${sureStr} boyunca susturuldunuz.`); } catch {}

      cezalar[guild.id] ??= {};
      cezalar[guild.id][targetUser.id] ??= [];
      cezalar[guild.id][targetUser.id].push({ tip: "mute", mod: user.tag, sebep: sureStr, tarih: Date.now() });

      interaction.reply({ embeds: [createEmbed("🔇 Susturuldu", `${targetUser.tag} ${sureStr} boyunca susturuldu.`, getRpgColor())] });
      await logToChannel(LOG_MOD, createEmbed("Mute İşlemi", `${user.tag} ${targetUser.tag} kullanıcısını ${sureStr} süreyle susturdu.`, getRpgColor()));
      await logToChannel(LOG_KOMUT, createEmbed("Komut Logu", `${user.tag} /mute komutu kullandı: ${targetUser.tag}`, getRpgColor()));
      break;
    }
    case "unmute": {
      const targetUser = interaction.options.getUser("kullanıcı");
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) return interaction.reply({ embeds: [createEmbed("❌ Hata", "Kullanıcı sunucuda bulunamadı.")], ephemeral: true });

      await targetMember.timeout(null);
      try { await targetUser.send("Susturmanız kaldırıldı."); } catch {}

      interaction.reply({ embeds: [createEmbed("🔊 Susturma Kaldırıldı", `${targetUser.tag} üzerindeki susturma kaldırıldı.`, getRpgColor())] });
      await logToChannel(LOG_MOD, createEmbed("Unmute İşlemi", `${user.tag} ${targetUser.tag} kullanıcısının susturmasını kaldırdı.`, getRpgColor()));
      await logToChannel(LOG_KOMUT, createEmbed("Komut Logu", `${user.tag} /unmute komutu kullandı: ${targetUser.tag}`, getRpgColor()));
      break;
    }
    case "warn": {
      const targetUser = interaction.options.getUser("kullanıcı");
      const sebep = interaction.options.getString("sebep");
      warns[guild.id] ??= {};
      warns[guild.id][targetUser.id] ??= [];
      warns[guild.id][targetUser.id].push({ mod: user.tag, sebep, tarih: Date.now() });

      try { await targetUser.send(`Sunucuda uyarıldınız. Sebep: ${sebep}`); } catch {}

      interaction.reply({ embeds: [createEmbed("⚠️ Uyarı", `${targetUser.tag} uyarıldı.\nSebep: ${sebep}`, getRpgColor())] });
      await logToChannel(LOG_KOMUT, createEmbed("Komut Logu", `${user.tag} /warn komutu kullandı: ${targetUser.tag}`, getRpgColor()));
      break;
    }
    case "warnings": {
      const targetUser = interaction.options.getUser("kullanıcı");
      const userWarns = warns[guild.id]?.[targetUser.id] || [];
      if (userWarns.length === 0) {
        return interaction.reply({ embeds: [createEmbed("Bilgi", `${targetUser.tag} hiç uyarı almamış.`)], ephemeral: true });
      }
      let metin = "";
      userWarns.forEach((w, i) => {
     const tarih = new Date(w.tarih).toLocaleString();
metin += `${i + 1}. Mod: ${w.mod} | Sebep: ${w.sebep} | Tarih: ${tarih}\n`;
});
const embed = createEmbed(`${targetUser.tag} - Uyarıları`, metin, getRpgColor());
interaction.reply({ embeds: [embed], ephemeral: true });
break;
case "warnings": {
  const targetUser = interaction.options.getUser("kullanıcı");
  const userWarns = warns[guild.id]?.[targetUser.id] || [];
  if (userWarns.length === 0) {
    return interaction.reply({ embeds: [createEmbed("Bilgi", `${targetUser.tag} hiç uyarı almamış.`)], ephemeral: true });
  }
  let metin = "";
  userWarns.forEach((w, i) => {
    const tarih = new Date(w.tarih).toLocaleString();
    metin += `${i + 1}. Mod: ${w.mod} | Sebep: ${w.sebep} | Tarih: ${tarih}\n`;
  });
  const embed = createEmbed(`${targetUser.tag} - Uyarıları`, metin, getRpgColor());
  interaction.reply({ embeds: [embed], ephemeral: true });
  break;
}
case "clear": {
  const miktar = interaction.options.getInteger("sayı");
  if (!interaction.channel || !interaction.channel.isTextBased()) return interaction.reply({ embeds: [createEmbed("Hata", "Bu komut sadece yazı kanallarında kullanılabilir.")], ephemeral: true });

  try {
    const silinen = await interaction.channel.bulkDelete(miktar, true);
    interaction.reply({ embeds: [createEmbed("Mesajlar Silindi", `${silinen.size} mesaj silindi.`, getRpgColor())], ephemeral: true });
    await logToChannel(LOG_KOMUT, createEmbed("Komut Logu", `${interaction.user.tag} ${silinen.size} mesaj sildi.`, getRpgColor()));
  } catch {
    interaction.reply({ embeds: [createEmbed("Hata", "Mesajlar silinemedi. 14 günden eski mesajlar silinemez veya yetkim yok." )], ephemeral: true });
  }
  break;
}
case "lock": {
  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) return interaction.reply({ embeds: [createEmbed("Hata", "Bu komut sadece yazı kanallarında kullanılabilir.")], ephemeral: true });
  await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
  interaction.reply({ embeds: [createEmbed("Kanal Kilitlendi", `${channel.name} kanalı kilitlendi.`, getRpgColor())] });
  await logToChannel(LOG_KOMUT, createEmbed("Komut Logu", `${interaction.user.tag} #${channel.name} kanalını kilitledi.`, getRpgColor()));
  break;
}
case "unlock": {
  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) return interaction.reply({ embeds: [createEmbed("Hata", "Bu komut sadece yazı kanallarında kullanılabilir.")], ephemeral: true });
  await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: true });
  interaction.reply({ embeds: [createEmbed("Kanal Kilidi Açıldı", `${channel.name} kanalı artık mesaj gönderime açık.`, getRpgColor())] });
  await logToChannel(LOG_KOMUT, createEmbed("Komut Logu", `${interaction.user.tag} #${channel.name} kanalının kilidini açtı.`, getRpgColor()));
  break;
}
case "slowmode": {
  const saniye = interaction.options.getInteger("saniye");
  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) return interaction.reply({ embeds: [createEmbed("Hata", "Bu komut sadece yazı kanallarında kullanılabilir.")], ephemeral: true });
  if (saniye < 0 || saniye > 21600) return interaction.reply({ embeds: [createEmbed("Hata", "Saniye 0 ile 21600 arasında olmalı.")], ephemeral: true });

  await channel.setRateLimitPerUser(saniye);
  interaction.reply({ embeds: [createEmbed("Yavaş Mod Ayarlandı", `${channel.name} kanalı için yavaş mod ${saniye} saniye olarak ayarlandı.`, getRpgColor())] });
  await logToChannel(LOG_KOMUT, createEmbed("Komut Logu", `${interaction.user.tag} #${channel.name} kanalına yavaş mod ayarladı: ${saniye} saniye`, getRpgColor()));
  break;
}
case "untimeout": {
  const targetUser = interaction.options.getUser("kullanıcı");
  const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
  if (!targetMember) return interaction.reply({ embeds: [createEmbed("Hata", "Kullanıcı sunucuda bulunamadı.")], ephemeral: true });

  await targetMember.timeout(null);
  interaction.reply({ embeds: [createEmbed("Timeout Kaldırıldı", `${targetUser.tag} üzerindeki timeout kaldırıldı.`, getRpgColor())] });
  await logToChannel(LOG_MOD, createEmbed("Timeout Kaldırıldı", `${interaction.user.tag} ${targetUser.tag} kullanıcısının timeoutunu kaldırdı.`, getRpgColor()));
  break;
}
case "cezalar": {
  const targetUser = interaction.options.getUser("kullanıcı");
  const userCezalar = cezalar[guild.id]?.[targetUser.id] || [];
  if (userCezalar.length === 0) {
    return interaction.reply({ embeds: [createEmbed("Bilgi", `${targetUser.tag} henüz ceza almamış.`)], ephemeral: true });
  }
  let metin = "";
  userCezalar.forEach((c, i) => {
    const tarih = new Date(c.tarih).toLocaleString();
    metin += `${i + 1}. Tip: ${c.tip} | Mod: ${c.mod} | Sebep: ${c.sebep} | Tarih: ${tarih}\n`;
  });
  interaction.reply({ embeds: [createEmbed(`${targetUser.tag} - Cezaları`, metin, getRpgColor())], ephemeral: true });
  break;
}
case "cezaişlemler": {
  let metin = "";
  Object.entries(cezalar).forEach(([guildId, guildCezalar]) => {
    Object.entries(guildCezalar).forEach(([userId, cezalarArray]) => {
      cezalarArray.forEach(c => {
        metin += `Sunucu: ${guildId} | Kullanıcı: ${userId} | Tip: ${c.tip} | Mod: ${c.mod} | Sebep: ${c.sebep}\n`;
      });
    });
  });
  if (!metin) metin = "Henüz ceza işlemi yok.";
  interaction.reply({ embeds: [createEmbed("Tüm Ceza Geçmişi", metin, getRpgColor())], ephemeral: true });
  break;
}
case "koruma-durum": {
  let metin = "";
  for (const [key, val] of Object.entries(protectionSettings)) {
    metin += `**${key}**: ${val ? "✅ Açık" : "❌ Kapalı"}\n`;
  }
  interaction.reply({ embeds: [createEmbed("Koruma Durumları", metin, getRpgColor())], ephemeral: true });
  break;
}
case "komutlar": {
  // Sayfalı komut listesi örneği emojiyle sayfa geçişli (basit hali)
  const pages = [
    `**Koruma Komutları:**\n
/koruma aç/kapat - Tüm koruma sistemlerini açar/kapatır
/antiraid aç/kapat - Yeni gelen spam botlara karşı koruma sağlar
/spam-engel aç/kapat - Aynı mesajı hızlıca atanları engeller
/reklam-engel aç/kapat - Link, davet, reklam engeller
/capslock-engel aç/kapat - Tamamen büyük harf yazanları engeller
/etiket-engel aç/kapat - Herkesi etiketleyenleri engeller
/rol-koruma aç/kapat - Yetkisiz rol silme/ekleme engeller
/kanal-koruma aç/kapat - Yetkisiz kanal silme/ekleme engeller
/webhook-koruma aç/kapat - Webhook spamını engeller
/emoji-koruma aç/kapat - Sunucu emojilerini korur
/log-ayarla #kanal - Tüm log kanalı ayarlar`,

    `**Moderasyon Komutları:**\n
/ban @kullanıcı [sebep] - Kullanıcıyı banlar
/kick @kullanıcı [sebep] - Kullanıcıyı atar
/mute @kullanıcı [süre] - Geçici susturur
/unmute @kullanıcı - Susturmayı kaldırır
/warn @kullanıcı [sebep] - Uyarı verir
/warnings @kullanıcı - Uyarıları gösterir
/clear [sayı] - Mesaj siler
/lock - Kanalı kilitler
/unlock - Kanal kilidini açar
/slowmode [saniye] - Yavaş mod ayarlar
/untimeout @kullanıcı - Timeout kaldırır`,

    `**Ek Komutlar:**\n
/cezalar @kullanıcı - Kullanıcının cezalarını gösterir
/cezaişlemler - Tüm ceza geçmişini gösterir
/koruma-durum - Koruma ayarlarının durumunu gösterir
/komutlar - Komut listesini gösterir`
  ];

  let currentPage = 0;
  const embed = new EmbedBuilder()
    .setTitle("Komutlar - Sayfa 1")
    .setDescription(pages[currentPage])
    .setColor(getRpgColor())
    .setFooter({ text: `Sayfa ${currentPage + 1} / ${pages.length}` });

  const message = await interaction.reply({ embeds: [embed], fetchReply: true, ephemeral: true });

  await message.react("⬅️");
  await message.react("➡️");

  const filter = (reaction, user) => {
    return ["⬅️", "➡️"].includes(reaction.emoji.name) && user.id === interaction.user.id;
  };

  const collector = message.createReactionCollector({ filter, time: 60000 });

  collector.on("collect", async (reaction, user) => {
    if (reaction.emoji.name === "➡️") {
      currentPage++;
      if (currentPage >= pages.length) currentPage = 0;
    } else if (reaction.emoji.name === "⬅️") {
      currentPage--;
      if (currentPage < 0) currentPage = pages.length - 1;
    }
    embed.setDescription(pages[currentPage]);
    embed.setTitle(`Komutlar - Sayfa ${currentPage + 1}`);
    embed.setFooter({ text: `Sayfa ${currentPage + 1} / ${pages.length}` });
    embed.setColor(getRpgColor());

    await reaction.users.remove(user.id);
    await message.edit({ embeds: [embed] });
  });

  collector.on("end", () => {
    message.reactions.removeAll().catch(() => {});
  });

  break;
}
default:
  interaction.reply({ embeds: [createEmbed("Hata", "Bilinmeyen komut!")], ephemeral: true });
}
});
  
client.login(TOKEN);

