require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const express = require("express");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildVoiceStates],
  partials: [Partials.Channel]
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TOKEN;
const AUTH_COOKIE = process.env.AUTH_COOKIE;
const PASSWORD = "forsauth"; // Panel şifresi

let whitelist = [];
let banList = [];
let logs = [];
const actions = new Map();

// Koruma olaylarını takip et
const protectionEvents = {
  CHANNEL_DELETE: "channelDelete",
  ROLE_DELETE: "roleDelete",
  GUILD_BAN_ADD: "guildBanAdd",
  GUILD_MEMBER_REMOVE: "guildMemberRemove",
  BOT_ADD: "guildMemberAdd",
};

// Banlama fonksiyonu
async function punish(member, reason) {
  try {
    await member.ban({ reason });
    await member.send("Forslandın").catch(() => {});
    banList.push({ id: member.id, reason, time: Date.now() });
    logs.push({ user: member.id, action: reason, time: new Date() });
  } catch (err) {
    console.log("Ban error:", err.message);
  }
}

// Kullanıcıyı takip et
function trackUser(userId, type) {
  const now = Date.now();
  if (!actions.has(userId)) actions.set(userId, []);
  actions.get(userId).push({ type, time: now });

  const userActions = actions.get(userId).filter(e => now - e.time < 1800000);
  const sameType = userActions.filter(e => e.type === type);

  if (sameType.length >= 3 && !whitelist.includes(userId)) {
    const guild = client.guilds.cache.first();
    const member = guild.members.cache.get(userId);
    if (member) punish(member, `${type} abuse`);
  }
}

// Discord olaylarını dinle
client.on("channelDelete", channel => {
  if (channel.guild) trackUser(channel.lastDeletedBy?.id || "unknown", "CHANNEL_DELETE");
});

client.on("roleDelete", role => {
  if (role.guild) trackUser(role.lastDeletedBy?.id || "unknown", "ROLE_DELETE");
});

client.on("guildBanAdd", (ban) => {
  trackUser(ban.executor?.id || "unknown", "GUILD_BAN_ADD");
});

client.on("guildMemberRemove", (member) => {
  trackUser(member.kickedBy?.id || "unknown", "GUILD_MEMBER_REMOVE");
});

client.on("guildMemberAdd", (member) => {
  if (member.user.bot) {
    trackUser(member.executor?.id || "unknown", "BOT_ADD");
  }
});

// Web Panel
app.get("/", (req, res) => {
  if (req.headers.cookie !== `auth=${AUTH_COOKIE}`) return res.send('<form method="POST"><input name="password"><button>Giriş</button></form>');
  res.send(`
    <h2>Fors Guard Panel</h2>
    <h3>Banlılar</h3><pre>${JSON.stringify(banList, null, 2)}</pre>
    <h3>Whitelist</h3><pre>${JSON.stringify(whitelist, null, 2)}</pre>
    <h3>Loglar</h3><pre>${JSON.stringify(logs, null, 2)}</pre>
    <form method="POST" action="/unban"><input name="id" placeholder="ID"><button>Ban Kaldır</button></form>
    <form method="POST" action="/whitelist"><input name="id" placeholder="ID"><button>Whitelist Ekle</button></form>
  `);
});

app.post("/", (req, res) => {
  if (req.body.password === PASSWORD) {
    res.setHeader("Set-Cookie", `auth=${AUTH_COOKIE}`);
    return res.redirect("/");
  }
  res.send("Hatalı şifre.");
});

app.post("/unban", async (req, res) => {
  const id = req.body.id;
  try {
    const guild = client.guilds.cache.first();
    await guild.members.unban(id);
    banList = banList.filter(u => u.id !== id);
    res.redirect("/");
  } catch {
    res.send("Ban kaldırma başarısız.");
  }
});

app.post("/whitelist", (req, res) => {
  const id = req.body.id;
  if (!whitelist.includes(id)) whitelist.push(id);
  res.redirect("/");
});

// Başlat
client.once("ready", () => {
  console.log(`${client.user.tag} aktif!`);
});
client.login(TOKEN);

app.listen(PORT, () => {
  console.log(`Web panel ${PORT} portunda çalışıyor.`);
});
