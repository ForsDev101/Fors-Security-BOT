const { Client, GatewayIntentBits } = require("discord.js");
const token = process.env.TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once("ready", () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;
  if (message.content === ".başlat") {
    const guild = message.guild;

    await message.channel.send("🧨 Tüm kanallar ve roller siliniyor...");

    // 🔥 Kanalları sil
    for (const [, channel] of guild.channels.cache) {
      await channel.delete().catch(() => {});
    }

    // 🔥 Roller sil
    for (const [, role] of guild.roles.cache) {
      if (role.editable && role.name !== "@everyone") {
        await role.delete().catch(() => {});
      }
    }

    // 🧱 Roller oluştur
    const roles = [
      "| SYS | Family Kurucusu",
      "| SYS | Mekan sahibi",
      "| SYS | Yönetim",
      "| SYS | Özel Kalem",
      "| SYS | Müffetik Kamp Liderleri",
      "| SYS | Partner",
      "| SYS | Genel Koordinatör",
      "| SYS | Aile üyesi",
      "| SYS | Seçkin",
      "| SYS | Üye"
    ];

    for (const name of roles) {
      await guild.roles.create({ name, color: "Random" });
    }

    // 📁 Kategoriler ve içindeki kanallar
    const categories = {
      "|----| Kayıt Alanı |----|": [
        "📜・kayıt",
        "❗・kayıt-nasıl-olurum",
        "⚡・kurallar"
      ],
      "|----| Duyurular |----|": [
        "📢・herkese-açık-duyuru",
        "📢・çekiliş-duyuru",
        "📢・önemli-duyuru"
      ],
      "|----| Sohbet |----|": [
        "💬・sohbet",
        "💬・konu-dışı-sohbet",
        "📱・video-galeri",
        "🤖・bot-komut"
      ],
      "|----| Ses Kanalları |----|": [
        { name: "🔊・Ses 1", voice: true },
        { name: "🔊・Ses 2", voice: true },
        { name: "🔊・Ses 3", voice: true }
      ],
      "|----| Logs |----|": [
        "geçmiş-logs",
        "yetkili-komut",
        "bot-komutu"
      ]
    };

    for (const [categoryName, channels] of Object.entries(categories)) {
      const category = await guild.channels.create({
        name: categoryName,
        type: 4 // CATEGORY
      });

      for (const ch of channels) {
        const isVoice = typeof ch === "object" && ch.voice;
        const name = typeof ch === "object" ? ch.name : ch;

        await guild.channels.create({
          name,
          type: isVoice ? 2 : 0,
          parent: category.id
        });
      }
    }

    await message.channel.send("🎉 Sunucu kurulumu tamamlandı!");
  }
});

client.login(token);
