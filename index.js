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

// KATEGORİ VE KANALLAR...
const CATEGORIES = [ /* önceki yapıyla aynı, burada kısaca yerleştir */ ];

client.on("messageCreate", async (message) => {
  if (message.content === ".başlat") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      message.reply("❌ Bu komutu kullanmak için yönetici olmalısın!");
      return;
    }

    const guild = message.guild;
    const everyone = guild.roles.everyone;

    try {
      // 1. Önce tüm kanalları sil
      const channels = guild.channels.cache;
      for (const [id, channel] of channels) {
        await channel.delete("Sunucu sıfırlama - yeni kurulum");
      }

      // 2. Tüm rolleri sil (everyone hariç)
      const roles = guild.roles.cache.filter(r => r.id !== everyone.id);
      for (const [id, role] of roles) {
        await role.delete("Sunucu sıfırlama - yeni kurulum");
      }

      // 3. Rolleri oluştur
      const createdRoles = {};
      for (const roleData of ROLE_ORDERED) {
        const role = await guild.roles.create({
          name: roleData.name,
          reason: "Sunucu kurulumu için rol oluşturuldu",
        });
        createdRoles[roleData.name] = role;
      }

      // 4. Kategorileri ve kanalları oluştur (izinlerle)
      for (const cat of CATEGORIES) {
        const category = await guild.channels.create({
          name: cat.name,
          type: 4 // Category
        });

        for (const chName of cat.channels) {
          // İzin ayarları
          const permissionOverwrites = [];

          // everyone için izin
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

          // Görünen rollere izin ver
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

          // Yazma izinleri
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
            type: 0, // Text
            parent: category.id,
            permissionOverwrites
          });
        }
      }

      message.reply("✅ Sunucu sıfırlandı ve kuruldu!");
    } catch (error) {
      console.error(error);
      message.reply("❌ Kurulum sırasında hata oluştu.");
    }
  }
});

client.login(process.env.TOKEN);
