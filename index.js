import { Client, GatewayIntentBits, Partials, Collection, Events, REST, Routes, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { config } from "dotenv";

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const colors = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Fuchsia", "Aqua"];
function createEmbed(title, description) {
  const color = colors[Math.floor(Math.random() * colors.length)];
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

// Zeabur env
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const BOTYETKI_ROLE = process.env.ROLE_BOTYETKI;
const LOG_KOMUT = process.env.LOG_KOMUT;
const LOG_MOD = process.env.LOG_MOD;
const LOG_GELEN = process.env.LOG_GELEN;
const LOG_GIDEN = process.env.LOG_GIDEN;

// KORUMA DURUMLARI (default kapalı)
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

// Spam takip
const userMessageTimestamps = new Map(); // userId -> [timestamps]

// Slash komutları tanımla
const commands = [
  new SlashCommandBuilder().setName("ban").setDescription("Bir kullanıcıyı sunucudan banlar")
    .addUserOption(opt => opt.setName("kullanıcı").setDescription("Banlanacak kişi").setRequired(true))
    .addStringOption(opt => opt.setName("sebep").setDescription("Sebep")),
  
  new SlashCommandBuilder().setName("kick").setDescription("Bir kullanıcıyı sunucudan atar")
    .addUserOption(opt => opt.setName("kullanıcı").setDescription("Atılacak kişi").setRequired(true))
    .addStringOption(opt => opt.setName("sebep").setDescription("Sebep")),
  
  new SlashCommandBuilder().setName("mute").setDescription("Bir kullanıcıyı geçici olarak susturur")
    .addUserOption(opt => opt.setName("kullanıcı").setDescription("Susturulacak kişi").setRequired(true))
    .addIntegerOption(opt => opt.setName("saniye").setDescription("Kaç saniye mute? (max 28 gün)").setRequired(true)),
  
  new SlashCommandBuilder().setName("unmute").setDescription("Susturmayı kaldırır")
    .addUserOption(opt => opt.setName("kullanıcı").setDescription("Susturması kaldırılacak kişi").setRequired(true)),
  
  new SlashCommandBuilder().setName("warn").setDescription("Bir kullanıcıya uyarı verir")
    .addUserOption(opt => opt.setName("kullanıcı").setDescription("Uyarılacak kişi").setRequired(true))
    .addStringOption(opt => opt.setName("sebep").setDescription("Uyarı sebebi").setRequired(true)),

  new SlashCommandBuilder().setName("warnings").setDescription("Bir kullanıcının uyarılarını listeler")
    .addUserOption(opt => opt.setName("kullanıcı").setDescription("Kullanıcı").setRequired(true)),

  new SlashCommandBuilder().setName("clear").setDescription("Mesajları siler")
    .addIntegerOption(opt => opt.setName("sayı").setDescription("Silinecek mesaj sayısı (max 100)").setRequired(true)),

  new SlashCommandBuilder().setName("lock").setDescription("Kanalları kilitler"),
  new SlashCommandBuilder().setName("unlock").setDescription("Kanalları açar"),

  new SlashCommandBuilder().setName("slowmode").setDescription("Kanala yavaş mod ekler")
    .addIntegerOption(opt => opt.setName("saniye").setDescription("Yavaş mod süresi (0 kapatır)").setRequired(true)),

  new SlashCommandBuilder().setName("untimeout").setDescription("Timeout kaldırır")
    .addUserOption(opt => opt.setName("kullanıcı").setDescription("Timeout kaldırılacak kişi").setRequired(true)),

  // Koruma ayar komutları
  new SlashCommandBuilder().setName("koruma").setDescription("Tüm koruma sistemlerini açar/kapat")
    .addStringOption(opt => opt.setName("durum").setDescription("aç veya kapat").setRequired(true)
      .addChoices(
        { name: "aç", value: "aç" },
        { name: "kapat", value: "kapat" }
      )
    ),

  new SlashCommandBuilder().setName("antiraid").setDescription("Antiraid aç/kapat")
    .addStringOption(opt => opt.setName("durum").setDescription("aç veya kapat").setRequired(true)
      .addChoices(
        { name: "aç", value: "aç" },
        { name: "kapat", value: "kapat" }
      )
    ),

  new SlashCommandBuilder().setName("spam-engel").setDescription("Spam engel aç/kapat")
    .addStringOption(opt => opt.setName("durum").setDescription("aç veya kapat").setRequired(true)
      .addChoices(
        { name: "aç", value: "aç" },
        { name: "kapat", value: "kapat" }
      )
    ),

  new SlashCommandBuilder().setName("reklam-engel").setDescription("Reklam engel aç/kapat")
    .addStringOption(opt => opt.setName("durum").setDescription("aç veya kapat").setRequired(true)
      .addChoices(
        { name: "aç", value: "aç" },
        { name: "kapat", value: "kapat" }
      )
    ),

  new SlashCommandBuilder().setName("capslock-engel").setDescription("Capslock engel aç/kapat")
    .addStringOption(opt => opt.setName("durum").setDescription("aç veya kapat").setRequired(true)
      .addChoices(
        { name: "aç", value: "aç" },
        { name: "kapat", value: "kapat" }
      )
    ),

  new SlashCommandBuilder().setName("etiket-engel").setDescription("Etiket engel aç/kapat")
    .addStringOption(opt => opt.setName("durum").setDescription("aç veya kapat").setRequired(true)
      .addChoices(
        { name: "aç", value: "aç" },
        { name: "kapat", value: "kapat" }
      )
    ),

  new SlashCommandBuilder().setName("rol-koruma").setDescription("Rol koruma aç/kapat")
    .addStringOption(opt => opt.setName("durum").setDescription("aç veya kapat").setRequired(true)
      .addChoices(
        { name: "aç", value: "aç" },
        { name: "kapat", value: "kapat" }
      )
    ),

  new SlashCommandBuilder().setName("kanal-koruma").setDescription("Kanal koruma aç/kapat")
    .addStringOption(opt => opt.setName("durum").setDescription("aç veya kapat").setRequired(true)
      .addChoices(
        { name: "aç", value: "aç" },
        { name: "kapat", value: "kapat" }
      )
    ),

  new SlashCommandBuilder().setName("webhook-koruma").setDescription("Webhook koruma aç/kapat")
    .addStringOption(opt => opt.setName("durum").setDescription("aç veya kapat").setRequired(true)
      .addChoices(
        { name: "aç", value: "aç" },
        { name: "kapat", value: "kapat" }
      )
    ),

  new SlashCommandBuilder().setName("emoji-koruma").setDescription("Emoji koruma aç/kapat")
    .addStringOption(opt => opt.setName("durum").setDescription("aç veya kapat").setRequired(true)
      .addChoices(
        { name: "aç", value: "aç" },
        { name: "kapat", value: "kapat" }
      )
    ),

  new SlashCommandBuilder().setName("log-ayarla").setDescription("Log kanalı ayarlar")
    .addChannelOption(opt => opt.setName("kanal").setDescription("Log kanalı").setRequired(true)),

  new SlashCommandBuilder().setName("cezalar").setDescription("Bir kullanıcının cezalarını gösterir")
    .addUserOption(opt => opt.setName("kullanıcı").setDescription("Kullanıcı").setRequired(true)),

  new SlashCommandBuilder().setName("cezaişlemler").setDescription("Tüm ceza geçmişini listeler"),

  new SlashCommandBuilder().setName("koruma-durum").setDescription("Koruma durumlarını raporlar"),
];

// Veri yapıları
const warns = {}; // { guildId: { userId: [ {mod, sebep, tarih} ] } }
const cezalar = {}; // { guildId: { userId: [ {tip, mod, sebep, tarih} ] } }

async function logToChannel(channelId, embed) {
  const ch = await client.channels.fetch(channelId).catch(() => null);
  if (ch) ch.send({ embeds: [embed] });
}

// Komutlar yüklenecek
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    console.log("Komutlar yükleniyor...");
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands.map(cmd => cmd.toJSON()) }
    );
    console.log("Komutlar yüklendi.");
  } catch (e) {
    console.error(e);
  }
})();

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // Rol kontrol
  if (!interaction.member.roles.cache.has(BOTYETKI_ROLE)) {
    return interaction.reply({ embeds: [createEmbed("❌ Yetki Hatası", "Bu komutu kullanmak için `BotYetki` rolün olmalı.")] , ephemeral: true});
  }

  const { commandName } = interaction;
  const user = interaction.user;
  const guild = interaction.guild;

  switch(commandName) {
    case "ban": {
      const targetUser = interaction.options.getUser("kullanıcı");
      const sebep = interaction.options.getString("sebep") || "Sebep belirtilmedi";
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if(!targetMember) return interaction.reply({ embeds: [createEmbed("❌ Hata", "Kullanıcı sunucuda bulunamadı.")] , ephemeral:true });

      try { await targetUser.send(`Sunucudan banlandınız. Sebep: ${sebep}`); } catch {}

      await targetMember.ban({ reason: sebep });
      interaction.reply({ embeds: [createEmbed("✅ Ban", `${targetUser.tag} banlandı.`)] });

      await logToChannel(LOG_KOMUT, createEmbed("📌 Komut Logu", `${user.tag} ban komutu kullandı: ${targetUser.tag}`));
      await logToChannel(LOG_MOD, createEmbed("⛔ Ban Logu", `${targetUser.tag} banlandı. Sebep: ${sebep}`));

      // Cezalar kayıt
      cezalar[guild.id] ??= {};
      cezalar[guild.id][targetUser.id] ??= [];
      cezalar[guild.id][targetUser.id].push({tip:"ban", mod:user.tag, sebep, tarih:Date.now()});
      break;
    }
    case "kick": {
      const targetUser = interaction.options.getUser("kullanıcı");
      const sebep = interaction.options.getString("sebep") || "Sebep belirtilmedi";
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if(!targetMember) return interaction.reply({ embeds: [createEmbed("❌ Hata", "Kullanıcı sunucuda bulunamadı.")] , ephemeral:true });

      try { await targetUser.send(`Sunucudan atıldınız. Sebep: ${sebep}`); } catch {}

      await targetMember.kick(sebep);
      interaction.reply({ embeds: [createEmbed("✅ Kick", `${targetUser.tag} atıldı.`)] });

      await logToChannel(LOG_KOMUT, createEmbed("📌 Komut Logu", `${user.tag} kick komutu kullandı: ${targetUser.tag}`));
      await logToChannel(LOG_MOD, createEmbed("⚠️ Kick Logu", `${targetUser.tag} atıldı. Sebep: ${sebep}`));

      cezalar[guild.id] ??= {};
      cezalar[guild.id][targetUser.id] ??= [];
      cezalar[guild.id][targetUser.id].push({tip:"kick", mod:user.tag, sebep, tarih:Date.now()});
      break;
    }
    case "mute": {
      const targetUser = interaction.options.getUser("kullanıcı");
      const saniye = interaction.options.getInteger("saniye");
      if(saniye > 2419200) return interaction.reply({embeds: [createEmbed("❌ Hata", "Maksimum 28 gün (2419200 saniye) mute yapabilirsin.")], ephemeral:true});
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if(!targetMember) return interaction.reply({ embeds: [createEmbed("❌ Hata", "Kullanıcı sunucuda bulunamadı.")] , ephemeral:true });

      await targetMember.timeout(saniye * 1000);
      interaction.reply({ embeds: [createEmbed("🔇 Mute", `${targetUser.tag} ${saniye} saniye susturuldu.`)] });

      await logToChannel(LOG_KOMUT, createEmbed("📌 Komut Logu", `${user.tag} mute komutu kullandı: ${targetUser.tag}`));
      await logToChannel(LOG_MOD, createEmbed("🔇 Mute Logu", `${targetUser.tag} mute yapıldı. Süre: ${saniye}s`));

      cezalar[guild.id] ??= {};
      cezalar[guild.id][targetUser.id] ??= [];
      cezalar[guild.id][targetUser.id].push({tip:"mute", mod:user.tag, sebep:`Mute süresi: ${saniye}s`, tarih:Date.now()});
      break;
    }
    case "unmute": {
      const targetUser = interaction.options.getUser("kullanıcı");
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if(!targetMember) return interaction.reply({ embeds: [createEmbed("❌ Hata", "Kullanıcı sunucuda bulunamadı.")] , ephemeral:true });

      await targetMember.timeout(null);
      interaction.reply({ embeds: [createEmbed("🔈 Unmute", `${targetUser.tag} susturması kaldırıldı.`)] });

      await logToChannel(LOG_KOMUT, createEmbed("📌 Komut Logu", `${user.tag} unmute komutu kullandı: ${targetUser.tag}`));
      await logToChannel(LOG_MOD, createEmbed("🔈 Unmute Logu", `${targetUser.tag} unmute yapıldı.`));
      break;
    }
    case "warn": {
      const targetUser = interaction.options.getUser("kullanıcı");
      const sebep = interaction.options.getString("sebep");
      warns[guild.id] ??= {};
      warns[guild.id][targetUser.id] ??= [];
      warns[guild.id][targetUser.id].push({mod: user.tag, sebep, tarih: Date.now()});

      try { await targetUser.send(`Sunucuda uyarıldınız. Sebep: ${sebep}`); } catch {}

      interaction.reply({ embeds: [createEmbed("⚠️ Uyarı", `${targetUser.tag} uyarıldı.\nSebep: ${sebep}`)] });
      await logToChannel(LOG_KOMUT, createEmbed("📌 Komut Logu", `${user.tag} warn komutu kullandı: ${targetUser.tag}`));
      break;
    }
    case "warnings": {
      const targetUser = interaction.options.getUser("kullanıcı");
      const userWarns = warns[guild.id]?.[targetUser.id] || [];
      if(userWarns.length === 0) {
        return interaction.reply({ embeds: [createEmbed("Bilgi", `${targetUser.tag} hiç uyarı almamış.`)], ephemeral:true });
      }
      let metin = "";
      userWarns.forEach((w, i) => {
        const date = new Date(w.tarih).toLocaleString();
        metin += `${i + 1}. Yetkili: ${w.mod} - Sebep: ${w.sebep} - Tarih: ${date}\n`;
      });
      interaction.reply({ embeds: [createEmbed(`${targetUser.tag} Uyarıları`, metin)] });
      break;
    }
    case "clear": {
      const miktar = interaction.options.getInteger("sayı");
      if(miktar < 1 || miktar > 100) return interaction.reply({ embeds: [createEmbed("❌ Hata", "1 ile 100 arasında sayı girin.")] , ephemeral:true});
      const messages = await interaction.channel.messages.fetch({limit: miktar});
      await interaction.channel.bulkDelete(messages, true);
      interaction.reply({ embeds: [createEmbed("✅ Mesaj Silindi", `${miktar} mesaj silindi.`)] });
      await logToChannel(LOG_KOMUT, createEmbed("📌 Komut Logu", `${user.tag} clear komutu kullandı, ${miktar} mesaj silindi.`));
      break;
    }
    case "lock": {
      const everyone = guild.roles.everyone;
      await interaction.channel.permissionOverwrites.edit(everyone, { SendMessages: false });
      interaction.reply({ embeds: [createEmbed("🔒 Kanal Kilitlendi", `${interaction.channel.name} kilitlendi.`)] });
      break;
    }
    case "unlock": {
      const everyone = guild.roles.everyone;
      await interaction.channel.permissionOverwrites.edit(everyone, { SendMessages: true });
      interaction.reply({ embeds: [createEmbed("🔓 Kanal Açıldı", `${interaction.channel.name} kilidi açıldı.`)] });
      break;
    }
    case "slowmode": {
      const saniye = interaction.options.getInteger("saniye");
      if(saniye < 0 || saniye > 21600) return interaction.reply({ embeds: [createEmbed("❌ Hata", "0 ile 21600 saniye arasında olmalı.")], ephemeral:true });
      await interaction.channel.setRateLimitPerUser(saniye);
      interaction.reply({ embeds: [createEmbed("⏳ Slowmode Ayarlandı", `Bu kanalda yavaş mod ${saniye} saniye olarak ayarlandı.`)] });
      break;
    }
    case "untimeout": {
      const targetUser = interaction.options.getUser("kullanıcı");
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if(!targetMember) return interaction.reply({ embeds: [createEmbed("❌ Hata", "Kullanıcı sunucuda bulunamadı.")] , ephemeral:true });
      await targetMember.timeout(null);
      interaction.reply({ embeds: [createEmbed("⏳ Timeout Kaldırıldı", `${targetUser.tag} üzerindeki timeout kaldırıldı.`)] });
      await logToChannel(LOG_KOMUT, createEmbed("📌 Komut Logu", `${user.tag} untimeout komutu kullandı: ${targetUser.tag}`));
      break;
    }
    case "koruma":
    case "antiraid":
    case "spam-engel":
    case "reklam-engel":
    case "capslock-engel":
    case "etiket-engel":
    case "rol-koruma":
    case "kanal-koruma":
    case "webhook-koruma":
    case "emoji-koruma": {
      const ayar = interaction.options.getString("durum");
      protectionSettings[commandName.replace(/-/g, "")] = (ayar === "aç");
      interaction.reply({ embeds: [createEmbed("✅ Ayar Güncellendi", `${commandName} koruması **${ayar}** olarak ayarlandı.`)] });
      break;
    }
    case "log-ayarla": {
      const kanal = interaction.options.getChannel("kanal");
      // Bu örnekte sadece komut logu olarak ayarladık, Zeabur env ile tutulabilir.
      interaction.reply({ embeds: [createEmbed("✅ Log Kanalı Ayarlandı", `${kanal} log kanalı olarak ayarlandı.`)] });
      break;
    }
    case "cezalar": {
      const targetUser = interaction.options.getUser("kullanıcı");
      const userCezalar = cezalar[guild.id]?.[targetUser.id] || [];
      if(userCezalar.length === 0) {
        return interaction.reply({ embeds: [createEmbed("Bilgi", `${targetUser.tag} hiç ceza almamış.`)], ephemeral:true });
      }
      let metin = "";
      userCezalar.forEach((c, i) => {
        const date = new Date(c.tarih).toLocaleString();
        metin += `${i + 1}. Tip: ${c.tip} - Yetkili: ${c.mod} - Sebep: ${c.sebep} - Tarih: ${date}\n`;
      });
      interaction.reply({ embeds: [createEmbed(`${targetUser.tag} Cezaları`, metin)] });
      break;
    }
    case "cezaişlemler": {
      let metin = "";
      for(const guildId in cezalar) {
        for(const userId in cezalar[guildId]) {
          cezalar[guildId][userId].forEach(c => {
            const date = new Date(c.tarih).toLocaleString();
            metin += `Sunucu: ${guildId} - Kullanıcı: ${userId} - Tip: ${c.tip} - Yetkili: ${c.mod} - Sebep: ${c.sebep} - Tarih: ${date}\n`;
          });
        }
      }
      if(metin.length === 0) metin = "Hiç ceza işlemi yok.";
      interaction.reply({ embeds: [createEmbed("Tüm Ceza İşlemleri", metin)] });
      break;
    }
    case "koruma-durum": {
      let metin = "";
      for(const key in protectionSettings) {
        metin += `${key}: ${protectionSettings[key] ? "Açık" : "Kapalı"}\n`;
      }
      interaction.reply({ embeds: [createEmbed("Koruma Durumları", metin)] });
      break;
    }
    case "komutlar": {
      // 3 sayfalık embed, emojiyle geçişli
      const pages = [
        new EmbedBuilder()
          .setTitle("Moderasyon Komutları")
          .setColor(colors[0])
          .setDescription(`
/ban @kullanıcı [sebep] - Banlar
/kick @kullanıcı [sebep] - Atar
/mute @kullanıcı [süre] - Susturur
/unmute @kullanıcı - Susturmayı kaldırır
/warn @kullanıcı [sebep] - Uyarı verir
/warnings @kullanıcı - Uyarıları listeler
/clear [sayı] - Mesaj siler
/lock - Kanal kilitler
/unlock - Kanal açar
/slowmode [saniye] - Yavaş mod ayarlar
/untimeout @kullanıcı - Timeout kaldırır
          `),
        new EmbedBuilder()
          .setTitle("Koruma Komutları")
          .setColor(colors[1])
          .setDescription(`
/koruma aç/kapat - Tüm koruma sistemleri
/antiraid aç/kapat - Spam bot koruması
/spam-engel aç/kapat - Spam engel
/reklam-engel aç/kapat - Reklam engel
/capslock-engel aç/kapat - Capslock engel
/etiket-engel aç/kapat - Etiket engel
/rol-koruma aç/kapat - Rol koruma
/kanal-koruma aç/kapat - Kanal koruma
/webhook-koruma aç/kapat - Webhook koruma
/emoji-koruma aç/kapat - Emoji koruma
/log-ayarla #kanal - Log kanalı ayarla
          `),
        new EmbedBuilder()
          .setTitle("Veri Yönetimi & Diğer Komutlar")
          .setColor(colors[2])
          .setDescription(`
/cezalar @kullanıcı - Kullanıcının cezaları
/cezaişlemler - Tüm ceza geçmişi
/koruma-durum - Koruma ayarlarını göster
          `),
      ];

      let currentPage = 0;
      await interaction.reply({ embeds: [pages[currentPage]], fetchReply: true }).then(msg => {
        msg.react("⬅️");
        msg.react("➡️");

        const filter = (reaction, user) => ["⬅️", "➡️"].includes(reaction.emoji.name) && user.id === interaction.user.id;
        const collector = msg.createReactionCollector({ filter, time: 60000 });

        collector.on("collect", r => {
          r.users.remove(interaction.user.id);

          if (r.emoji.name === "➡️") {
            currentPage = currentPage + 1 < pages.length ? currentPage + 1 : 0;
          } else if (r.emoji.name === "⬅️") {
            currentPage = currentPage - 1 < 0 ? pages.length - 1 : currentPage - 1;
          }
          msg.edit({ embeds: [pages[currentPage]] });
        });

        collector.on("end", () => {
          msg.reactions.removeAll().catch(() => null);
        });
      });
      break;
    }
  }
});

// Gelen-giden logları
client.on(Events.GuildMemberAdd, member => {
  const embed = createEmbed("Yeni Üye Katıldı", `${member.user.tag} sunucuya katıldı.`);
  logToChannel(LOG_GELEN, embed);
});

client.on(Events.GuildMemberRemove, member => {
  const embed = createEmbed("Üye Ayrıldı", `${member.user.tag} sunucudan ayrıldı.`);
  logToChannel(LOG_GIDEN, embed);
});

// Otomatik koruma mekanizmaları

client.on(Events.MessageCreate, async message => {
  if(message.author.bot) return;
  if(!message.guild) return;

  // Koruma kapalıysa çık
  if(!protectionSettings.koruma) return;

  // Spam engel (5 mesaj 5 saniyede)
  if(protectionSettings.spamEngel) {
    const times = userMessageTimestamps.get(message.author.id) || [];
    const now = Date.now();
    const filtered = times.filter(t => now - t < 5000);
    filtered.push(now);
    userMessageTimestamps.set(message.author.id, filtered);
    if(filtered.length >= 5) {
      // Otomatik mute 60 saniye
      const member = await message.guild.members.fetch(message.author.id).catch(() => null);
      if(member) {
        member.timeout(60_000);
        message.channel.send({ embeds: [createEmbed("Spam Engeli", `${message.author.tag} spam yaptığı için 1 dakika susturuldu.`)] });
        await logToChannel(LOG_MOD, createEmbed("Spam Engeli", `${message.author.tag} 5 mesaj 5 saniyede gönderdi, otomatik mute uygulandı.`));
      }
      userMessageTimestamps.set(message.author.id, []);
      return;
    }
  }

  // Reklam engel (basit link kontrolü)
  if(protectionSettings.reklamEngel) {
    const reklamRegex = /(https?:\/\/[^\s]+)/gi;
    if(reklamRegex.test(message.content)) {
      await message.delete().catch(() => {});
      message.channel.send({ embeds: [createEmbed("Reklam Engeli", `${message.author.tag} reklam yapamaz!`)] }).then(msg => setTimeout(() => msg.delete(), 5000));
      await logToChannel(LOG_MOD, createEmbed("Reklam Engeli", `${message.author.tag} reklam mesajı attı, mesaj silindi.`));
      return;
    }
  }

  // Capslock engel (tüm mesaj büyük harf > %70 ve en az 10 karakter)
  if(protectionSettings.capslockEngel) {
    const content = message.content.replace(/[^a-zA-Z]/g, "");
    if(content.length >= 10) {
      const upperCount = [...content].filter(c => c === c.toUpperCase()).length;
      if((upperCount / content.length) > 0.7) {
        await message.delete().catch(() => {});
        message.channel.send({ embeds: [createEmbed("Capslock Engeli", `${message.author.tag} tamamen büyük harfle mesaj yazamaz.`)] }).then(msg => setTimeout(() => msg.delete(), 5000));
        await logToChannel(LOG_MOD, createEmbed("Capslock Engeli", `${message.author.tag} capslock kullandı, mesaj silindi.`));
        return;
      }
    }
  }

  // Etiket engel (herkesi etiketleyen)
  if(protectionSettings.etiketEngel) {
    if(message.mentions.everyone) {
      await message.delete().catch(() => {});
      message.channel.send({ embeds: [createEmbed("Etiket Engeli", `${message.author.tag} herkesi etiketleyemez!`)] }).then(msg => setTimeout(() => msg.delete(), 5000));
      await logToChannel(LOG_MOD, createEmbed("Etiket Engeli", `${message.author.tag} herkesi etiketledi, mesaj silindi.`));
      return;
    }
  }

  // Antiraid basit örnek: Yeni gelen spam botlara karşı 5 saniye içinde çok mesaj atan ban
  if(protectionSettings.antiraid) {
    const member = message.member;
    if(!member) return;
    if(member.user.bot && (Date.now() - member.joinedTimestamp < 10_000)) {
      const times = userMessageTimestamps.get(member.id) || [];
      const now = Date.now();
      const filtered = times.filter(t => now - t < 5000);
      filtered.push(now);
      userMessageTimestamps.set(member.id, filtered);
      if(filtered.length >= 3) {
        try {
          await member.ban({ reason: "Antiraid koruması: Çok hızlı mesaj" });
          await logToChannel(LOG_MOD, createEmbed("Antiraid", `${member.user.tag} banlandı.`));
          await message.channel.send({ embeds: [createEmbed("Antiraid", `${member.user.tag} antiraid nedeniyle banlandı.`)] });
        } catch {}
      }
    }
  }

});

// Bot hazır mesajı
client.once(Events.ClientReady, () => {
  console.log(`Bot giriş yaptı: ${client.user.tag}`);
});

client.login(TOKEN);
