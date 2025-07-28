const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const ROLE_ORDERED = [
  { name: "👑 ADALET BAKANI", position: 1 },
  { name: "👑 ADALET BAKANI YARDIMCISI", position: 2 },
  { name: "⚖️ HÂKİM", position: 3 },
  { name: "🧑‍⚖️ BAŞSAVCI", position: 4 },
  { name: "👨‍⚖️ SAVCI", position: 5 },
  { name: "🧑‍🎓 STAJYER AVUKAT", position: 6 },
  { name: "🧑‍💼 AVUKAT", position: 7 },

  { name: "🕶️ MİT BAŞKANI", position: 8 },
  { name: "🧠 İSTİHBARAT SUBAYI", position: 9 },
  { name: "🕵️ ALAN AJANI", position: 10 },

  { name: "🛡️ İNZİBAT KOMUTANI", position: 11 },
  { name: "👨‍✈️ İNZİBAT SUBAYI", position: 12 },
  { name: "👮 İNZİBAT ER", position: 13 },

  { name: "🪖 JANDARMA KOMUTANI", position: 14 },
  { name: "🧑‍✈️ JANDARMA SUBAYI", position: 15 },
  { name: "👮 JANDARMA ER", position: 16 },

  { name: "🎮 OYUNCU", position: 17 },
];

// Kategori ve kanallar, izinlerle
const CATEGORIES = [
  {
    name: "📢 GENEL BİLGİLENDİRME",
    channels: [
      "📜・KURALLAR",
      "📣・DUYURULAR",
      "📌・ATAMA-DUYURULARI",
      "🔄・GÖREV-DEĞİŞİKLİKLERİ",
      "📝・BAŞVURU-DUYURULARI",
    ],
    visibleRoles: ["@everyone"],
    writeRoles: ["👑 ADALET BAKANI", "👑 ADALET BAKANI YARDIMCISI"],
  },
  {
    name: "⚖️ ADALET BAKANLIĞI",
    channels: [
      "🧾・MAHKEME-SONUÇLARI",
      "📊・DAVA-İSTATİSTİKLERİ",
      "🚨・ŞİKAYET-BİLDİRİMİ",
      "💡・ÖNERİ-VE-ELEŞTİRİLER",
    ],
    visibleRoles: [
      "👑 ADALET BAKANI",
      "👑 ADALET BAKANI YARDIMCISI",
      "⚖️ HÂKİM",
      "🧑‍⚖️ BAŞSAVCI",
      "👨‍⚖️ SAVCI",
      "🧑‍🎓 STAJYER AVUKAT",
      "🧑‍💼 AVUKAT",
    ],
    writeRoles: [
      "👑 ADALET BAKANI",
      "👑 ADALET BAKANI YARDIMCISI",
      "⚖️ HÂKİM",
      "🧑‍⚖️ BAŞSAVCI",
      "👨‍⚖️ SAVCI",
    ],
  },
  {
    name: "📥 BAŞVURULAR",
    channels: [
      "⚖️・HÂKİM-BAŞVURU",
      "🕵️・SAVCI-BAŞVURU",
      "🧑‍💼・AVUKAT-BAŞVURU",
    ],
    visibleRoles: ["@everyone"],
    writeRoles: ["@everyone"],
  },
  {
    name: "🛡️ ASKERİ İNZİBAT KOMUTANLIĞI",
    channels: [
      "📋・İNZİBAT-RAPOR",
      "🧑‍⚖️・İNZİBAT-MAHKEME",
      "✅・İNZİBAT-SONUÇ",
    ],
    visibleRoles: [
      "🛡️ İNZİBAT KOMUTANI",
      "👨‍✈️ İNZİBAT SUBAYI",
      "👮 İNZİBAT ER",
      "@everyone",
      "👑 ADALET BAKANI",
      "👑 ADALET BAKANI YARDIMCISI",
      "⚖️ HÂKİM",
      "🧑‍⚖️ BAŞSAVCI",
      "👨‍⚖️ SAVCI",
      "🧑‍🎓 STAJYER AVUKAT",
      "🧑‍💼 AVUKAT",
    ],
    writeRoles: [
      "🛡️ İNZİBAT KOMUTANI",
      "👨‍✈️ İNZİBAT SUBAYI",
      "👮 İNZİBAT ER",
    ],
  },
  {
    name: "🪖 JANDARMA GENEL KOMUTANLIĞI",
    channels: [
      "📋・JANDARMA-RAPOR",
      "🧑‍⚖️・JANDARMA-MAHKEME",
      "✅・JANDARMA-SONUÇ",
    ],
    visibleRoles: [
      "🪖 JANDARMA KOMUTANI",
      "🧑‍✈️ JANDARMA SUBAYI",
      "👮 JANDARMA ER",
      "@everyone",
      "👑 ADALET BAKANI",
      "👑 ADALET BAKANI YARDIMCISI",
      "⚖️ HÂKİM",
      "🧑‍⚖️ BAŞSAVCI",
      "👨‍⚖️ SAVCI",
      "🧑‍🎓 STAJYER AVUKAT",
      "🧑‍💼 AVUKAT",
    ],
    writeRoles: [
      "🪖 JANDARMA KOMUTANI",
      "🧑‍✈️ JANDARMA SUBAYI",
      "👮 JANDARMA ER",
    ],
  },
  {
    name: "🕵️ MİLLÎ İSTİHBARAT TEŞKİLATI",
    channels: [
      "🕶️・MİT-RAPOR",
      "⚖️・MİT-MAHKEME",
      "🗂️・MİT-SONUÇ",
    ],
    visibleRoles: [
      "🕶️ MİT BAŞKANI",
      "🧠 İSTİHBARAT SUBAYI",
      "🕵️ ALAN AJANI",
      "👑 ADALET BAKANI",
    ],
    writeRoles: [
      "🕶️ MİT BAŞKANI",
      "🧠 İSTİHBARAT SUBAYI",
      "🕵️ ALAN AJANI",
    ],
  },
  {
    name: "📡 BİRİM KOORDİNASYONU",
    channels: [
      "🤝・BİRİM-KOORDİNASYONU",
    ],
    visibleRoles: ["@everyone"],
    writeRoles: ["👑 ADALET BAKANI", "👑 ADALET BAKANI YARDIMCISI"],
  },
];

client.on("messageCreate", async (message) => {
  if (message.content === ".başlat") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Bu komutu kullanmak için yönetici olmalısın!");
    }

    const guild = message.guild;
    const everyone = guild.roles.everyone;

    try {
      // Kanalları sil (komutun yazıldığı kanalı silme)
      for (const channel of guild.channels.cache.values()) {
        if (channel.id === message.channel.id) continue;
        try {
          await channel.delete("Sunucu sıfırlama - yeni kurulum");
        } catch {
          // Hata varsa atla
        }
      }

      // Rolleri sil (everyone ve managed rol hariç)
      for (const role of guild.roles.cache.values()) {
        if (role.managed || role.id === everyone.id) continue;
        try {
          await role.delete("Sunucu sıfırlama - yeni kurulum");
        } catch {
          // Hata varsa atla
        }
      }

      // Roller oluşturulsun
      const createdRoles = {};
      for (const roleData of ROLE_ORDERED) {
        const role = await guild.roles.create({
          name: roleData.name,
          reason: "Sunucu kurulumu için rol oluşturuldu",
          // position özelliği Discord API'da doğrudan ayarlanamıyor,
          // pozisyon Discord arayüzünden ayarlanmalı veya ayrı API çağrısı ile yapılabilir.
        });
        createdRoles[roleData.name] = role;
      }

      // Kategoriler ve kanallar oluşturuluyor
      for (const cat of CATEGORIES) {
        const category = await guild.channels.create({
          name: cat.name.toUpperCase(),
          type: ChannelType.GuildCategory,
          reason: "Sunucu kurulumu için kategori oluşturuldu",
        });

        for (const chName of cat.channels) {
          const permissionOverwrites = [];

          // everyone için görüntüleme izni
          if (cat.visibleRoles.includes("@everyone")) {
            permissionOverwrites.push({
              id: everyone.id,
              allow: [PermissionsBitField.Flags.ViewChannel],
            });
          } else {
            permissionOverwrites.push({
              id: everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            });
          }

          // Görünür rollere izin ver
          for (const vRoleName of cat.visibleRoles) {
            if (vRoleName === "@everyone") continue;
            const role = createdRoles[vRoleName];
            if (role) {
              permissionOverwrites.push({
                id: role.id,
                allow: [PermissionsBitField.Flags.ViewChannel],
              });
            }
          }

          // Adalet Bakanlığı rollerini (mit hariç) tüm branş kanallarına erişim izni ver
          const mitCategoryNames = ["🕵️ MİLLÎ İSTİHBARAT TEŞKİLATI"];
          if (!mitCategoryNames.includes(cat.name)) {
            const adaletBakanligiRolleri = [
              "👑 ADALET BAKANI",
              "👑 ADALET BAKANI YARDIMCISI",
              "⚖️ HÂKİM",
              "🧑‍⚖️ BAŞSAVCI",
              "👨‍⚖️ SAVCI",
              "🧑‍🎓 STAJYER AVUKAT",
              "🧑‍💼 AVUKAT",
            ];
            for (const adaletRoleName of adaletBakanligiRolleri) {
              const role = createdRoles[adaletRoleName];
              if (role && !permissionOverwrites.find(po => po.id === role.id)) {
                permissionOverwrites.push({
                  id: role.id,
                  allow: [PermissionsBitField.Flags.ViewChannel],
                });
              }
            }
          }

          // Yazma izinleri ver
          for (const wRoleName of cat.writeRoles) {
            const role = createdRoles[wRoleName];
            if (role) {
              permissionOverwrites.push({
                id: role.id,
                allow: [PermissionsBitField.Flags.SendMessages],
              });
            }
          }

          await guild.channels.create({
            name: chName.toUpperCase(),
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites,
            reason: "Sunucu kurulumu için kanal oluşturuldu",
          });
        }
      }

      await message.reply("✅ Sunucu başarıyla kuruldu!");
    } catch (error) {
      console.error(error);
      if (message.channel) {
        message.channel.send("❌ Kurulum sırasında hata oluştu.");
      }
    }
  }
});

client.login(process.env.TOKEN);
