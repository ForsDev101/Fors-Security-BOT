const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const Discord = require("discord.js");
const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
    Discord.GatewayIntentBits.GuildMembers
  ]
});

const token = process.env.TOKEN;
const panelPassword = process.env.PANEL_PASSWORD || "sys.fors0619"; // Değiştirmeyi unutma
const PORT = process.env.PORT || 3000;

let banList = [];

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// HTML arayüz
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><title>Güvenlik Paneli</title></head>
      <body style="background:#111;color:white;font-family:sans-serif;padding:30px">
        <h1>Fors Güvenlik Paneli</h1>
        <form method="POST" action="/unban">
          <input type="password" name="password" placeholder="Parola" /><br><br>
          <input type="text" name="userID" placeholder="Kullanıcı ID" />
          <button type="submit">Ban Kaldır</button>
        </form>
        <h2>Banlı Kullanıcılar</h2>
        <ul>
          ${banList.map(entry => `<li>${entry.userID} - ${entry.reason}</li>`).join("")}
        </ul>
      </body>
    </html>
  `);
});

// Ban kaldırma endpointi
app.post("/unban", async (req, res) => {
  const { password, userID } = req.body;
  if (password !== panelPassword) return res.status(403).send("Parola yanlış!");

  const guild = client.guilds.cache.first();
  if (!guild) return res.status(500).send("Bot sunucuya bağlı değil.");

  try {
    await guild.members.unban(userID);
    banList = banList.filter(b => b.userID !== userID);
    res.send("Ban kaldırıldı.");
  } catch (err) {
    res.status(500).send("Ban kaldırılamadı: " + err.message);
  }
});

// Bot olayları
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  // Örnek: küfür veya spam algılama
  const lower = msg.content.toLowerCase();
  if (lower.includes("küfür") || lower.includes("spam")) {
    try {
      await msg.guild.members.ban(msg.author.id, { reason: "Küfür veya spam" });
      banList.push({ userID: msg.author.id, reason: "Küfür veya spam" });
      console.log(`${msg.author.id} banlandı.`);
    } catch (err) {
      console.error("Ban hatası:", err);
    }
  }
});

client.login(TOKEN);

// Web sunucusunu başlat
app.listen(PORT, () => {
  console.log(`Panel ${PORT} portunda çalışıyor.`);
});
