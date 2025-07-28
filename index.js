const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const ROLE_ORDERED = [
  { name: "👑 Adalet Bakanı", position: 1 },
  { name: "👑 Adalet Bakanı Yardımcısı", position: 2 },
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

// Kanal ve kategoriler (emoji + büyük harf)
const CATEGORIES = [
  {
    name: "📢 GENEL BİLGİLENDİRME",
    channels: [
      "📜 KURALLAR",
      "📣 DUYURULAR",
      "📌 ATAMA-DUYURULARI",
      "🔄 GÖREV-DEĞİŞİKLİKLERİ",
      "📝 BAŞVURU-DUYURULARI"
    ],
    visibleRoles: ["@everyone"],
    writeRoles: []
  },
  {
    name: "⚖️ ADALET BAKANLIĞI",
    channels: [
      "🧾 MAHKEME-SONUÇLARI",
      "📊 DAVA-İSTATİSTİKLERİ",
      "🚨 ŞİKAYET-BİLDİRİMİ",
      "💡 ÖNERİ-VE-ELEŞTİRİLER"
    ],
    visibleRoles: ["@everyone"],
    writeRoles: ["👑 Adalet Bakanı"]
  },
  {
    name: "📥 BAŞVURULAR",
    channels: [
      "⚖️ HÂKİM-BAŞVURU",
      "🕵️ SAVCI-BAŞVURU",
      "🧑‍💼 AVUKAT-BAŞVURU"
    ],
    visibleRoles: ["@everyone"],
    writeRoles: []
  },
  {
    name: "🛡️ ASKERİ İNZİBAT KOMUTANLIĞI",
    channels: [
      "📋 İNZİBAT-RAPOR",
      "🧑‍⚖️ İNZİBAT-MAHKEME",
      "✅ İNZİBAT-SONUÇ"
    ],
    visibleRoles: ["@everyone"],
    writeRoles: ["🛡️ İNZİBAT KOMUTANI", "👨‍✈️ İNZİBAT SUBAYI"]
  },
  {
    name: "🪖 JANDARMA GENEL KOMUTANLIĞI",
    channels: [
      "📋 JANDARMA-RAPOR",
      "🧑‍⚖️ JANDARMA-MAHKEME",
      "✅ JANDARMA-SONUÇ"
    ],
    visibleRoles: ["@everyone"],
    writeRoles: ["🪖 JANDARMA KOMUTANI", "🧑‍✈️ JANDARMA SUBAYI"]
  },
  {
    name: "🕵️ MİLLÎ İSTİHBARAT TEŞKİLATI",
    channels: [
      "🕶️ MİT-RAPOR",
      "⚖️ MİT-MAHKEME",
      "🗂️ MİT-SONUÇ"
    ],
    visibleRoles: ["🕶️ MİT BAŞKANI", "🧠 İSTİHBARAT SUBAYI", "🕵️ ALAN AJANI", "👑 Adalet Bakanı", "👑 Adalet Bakanı Yardımcısı"],
    writeRoles: ["🕶️ MİT BAŞKANI", "🧠 İSTİHBARAT SUBAYI", "🕵️ ALAN AJANI"]
  },
  {
    name: "📡 BİRİM KOORDİNASYONU",
    channels: [
      "🤝 BİRİM-KOORDİNASYONU"
    ],
    visibleRoles: ["@everyone"],
    writeRoles: ["👑 Adalet Bakanı", "🪖 JANDARMA KOMUTANI", "🛡️ İNZİBAT KOMUTANI", "🕶️ MİT BAŞKANI"]
  }
];

client.on("messageCreate", async (message) => {
  if (message.content === ".başlat") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      message.reply("❌ Bu komutu kullanmak için yönetici olmalısın!");
      return;
    }

    const guild = message.guild;
    const everyone = guild.roles.everyone;

    try {
      // ROLLERİ OLUŞTUR (Önce roller yoksa oluşturulur)
      const createdRoles = {};

      // Roller sıralı oluşturuluyor:
      for (const roleData of ROLE_ORDERED) {
        let role = guild.roles.cache.find(r => r.name === roleData.name);
        if (!role) {
          role = await guild.roles.create({
            name: roleData.name,
            reason: "Sunucu kurulumu için rol oluşturuldu",
            // position: roleData.position // Discord API otomatik sıralar, elle değiştirmek için extra işlemler gerek
          });
        }
        createdRoles[roleData.name] = role;
      }

      // KATEGORİLERİ VE KANALLARI OLUŞTUR
      for (const cat of CATEGORIES) {
        // Kategori oluştur
        const category = await guild.channels.create({
          name: cat.name,
          type: 4 // Category
        });

        for (const chName of cat.channels) {
          // İzinler
          // Öncelikle @everyone izinleri
          const permissionOverwrites = [];

          if (cat.visibleRoles.includes("@everyone")) {
            permissionOverwrites.push({
              id: everyone.id,
              allow: [PermissionsBitField.Flags.ViewChannel],
              deny: []
            });
          } else {
            permissionOverwrites.push({
              id: everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel]
            });
          }

          // Visible rollere görünürlük ver
          for (const vRoleName of cat.visibleRoles) {
            if (vRoleName === "@everyone") continue;
            const role = createdRoles[vRoleName];
            if (role) {
              permissionOverwrites.push({
                id: role.id,
                allow: [PermissionsBitField.Flags.ViewChannel]
              });
            }
          }

          // Write rollere yazma izni ver
          for (const wRoleName of cat.writeRoles) {
            const role = createdRoles[wRoleName];
            if (role) {
              permissionOverwrites.push({
                id: role.id,
                allow: [PermissionsBitField.Flags.SendMessages]
              });
            }
          }

          await guild.channels.create({
            name: chName,
            type: 0,
            parent: category.id,
            permissionOverwrites
          });
        }
      }

      message.reply("✅ Sunucu kurulumu tamamlandı!");
    } catch (error) {
      console.error(error);
      message.reply("❌ Sunucu kurulumu sırasında bir hata oluştu.");
    }
  }
});

client.login(process.env.TOKEN);
