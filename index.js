const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Roller (emoji ve pozisyon sıralamasıyla)
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

// Kategoriler ve kanallar, izinli rollerle
const CATEGORIES = [
  {
    name: "📋 KORDİNASYON",
    channels: ["duyuru", "atama-duyuru", "bilgi-paylasim"],
    visibleRoles: ["@everyone"],
    writeRoles: ["Adalet Bakanı", "Adalet Bakanı Yardımcısı"],
  },
  {
    name: "⚖️ ADALET BAKANLIĞI",
    channels: ["genel", "mahkeme", "sonuclar"],
    visibleRoles: ["Adalet Bakanı", "Adalet Bakanı Yardımcısı", "HÂKİM", "BAŞSAVCI", "SAVCI", "STAJYER AVUKAT", "AVUKAT"],
    writeRoles: ["Adalet Bakanı", "Adalet Bakanı Yardımcısı", "HÂKİM", "BAŞSAVCI", "SAVCI"],
  },
  {
    name: "🪖 İNZİBAT",
    channels: ["inzibat-rapor", "inzibat-mahkeme", "inzibat-sonuclar"],
    visibleRoles: ["İNZİBAT KOMUTANI", "İNZİBAT SUBAYI", "İNZİBAT ER", "@everyone"],
    writeRoles: ["İNZİBAT KOMUTANI", "İNZİBAT SUBAYI", "İNZİBAT ER"],
  },
  {
    name: "🪖 JANDARMA",
    channels: ["jandarma-rapor", "jandarma-mahkeme", "jandarma-sonuclar"],
    visibleRoles: ["JANDARMA KOMUTANI", "JANDARMA SUBAYI", "JANDARMA ER", "@everyone"],
    writeRoles: ["JANDARMA KOMUTANI", "JANDARMA SUBAYI", "JANDARMA ER"],
  },
  {
    name: "🕵️ MİLLİ İSTİHBARAT TEŞKİLATI",
    channels: ["mit-rapor", "mit-mahkeme", "mit-sonuclar"],
    visibleRoles: ["MİT BAŞKANI", "İSTİHBARAT SUBAYI", "ALAN AJANI", "Adalet Bakanı"],
    writeRoles: ["MİT BAŞKANI", "İSTİHBARAT SUBAYI", "ALAN AJANI"],
  },
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
      // 1. Kanalları sil (komutun yazıldığı kanalı silme)
      for (const channel of guild.channels.cache.values()) {
        if (channel.id === message.channel.id) continue;
        try {
          await channel.delete("Sunucu sıfırlama - yeni kurulum");
        } catch (e) {
          console.warn(`Kanal silinemedi: ${channel.name} - ${e.message}`);
        }
      }

      // 2. Rolleri sil (everyone ve managed rolleri silme)
      for (const role of guild.roles.cache.values()) {
        if (role.managed || role.id === everyone.id) continue;
        try {
          await role.delete("Sunucu sıfırlama - yeni kurulum");
        } catch (e) {
          console.warn(`Rol silinemedi: ${role.name} - ${e.message}`);
        }
      }

      // 3. Rolleri oluştur ve kayıt et
      const createdRoles = {};
      for (const roleData of ROLE_ORDERED) {
        const role = await guild.roles.create({
          name: roleData.name,
          reason: "Sunucu kurulumu için rol oluşturuldu",
          // İstersen buraya renk vb. ekleyebilirsin
        });
        createdRoles[roleData.name] = role;
      }

      // 4. Kategorileri ve kanalları oluştur, izinleri ayarla
      for (const cat of CATEGORIES) {
        const category = await guild.channels.create({
          name: cat.name.toUpperCase(),
          type: 4, // Kategori
          reason: "Sunucu kurulumu için kategori oluşturuldu",
        });

        for (const chName of cat.channels) {
          const permissionOverwrites = [];

          // everyone için izinler
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

          // Görünen rollere izin ver
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

          // Yazma izinleri
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
            type: 0, // Yazı kanalı
            parent: category.id,
            permissionOverwrites,
            reason: "Sunucu kurulumu için kanal oluşturuldu",
          });
        }
      }

      await message.reply("✅ Sunucu sıfırlandı ve kuruldu!");
    } catch (error) {
      console.error(error);
      if (message.channel) {
        message.channel.send("❌ Kurulum sırasında hata oluştu.");
      }
    }
  }
});

client.login(process.env.TOKEN);
