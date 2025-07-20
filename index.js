// index.js
require("dotenv").config();
const { Client, GatewayIntentBits, Partials, AuditLogEvent } = require("discord.js");
const express = require("express");
const fs = require("fs");
const app = express();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const OWNER_ID = process.env.OWNER_ID;
const PASSWORD = process.env.PANEL_PASSWORD;

let whitelist = [OWNER_ID];
let bans = [];
let logs = [];
let userActions = {};

const LIMIT = 3;
const TIME = 30 * 60 * 1000; // 30 dakika

function isWhitelisted(userId) {
  return whitelist.includes(userId);
}

function logAction(userId, action, target) {
  logs.push({ userId, action, target, time: new Date() });
}

function track(userId, action) {
  if (!userActions[userId]) userActions[userId] = [];
  userActions[userId].push({ action, time: Date.now() });
  userActions[userId] = userActions[userId].filter(a => Date.now() - a.time <= TIME);
  const actionCount = userActions[userId].filter(a => a.action === action).length;
  if (actionCount >= LIMIT) return true;
  return false;
}

async function banUser(userId, reason) {
  const guild = client.guilds.cache.get(GUILD_ID);
  const member = guild.members.cache.get(userId);
  if (!member || isWhitelisted(userId)) return;

  await member.ban({ reason: `Abuse: ${reason}` });
  bans.push({ id: userId, reason });
  logAction(userId, "ban", reason);

  try {
    await member.send({ embeds: [{
      title: "Forslandın",
      description: "Sunucuda kötüye kullanım tespit edildi.",
      color: 0xff0000
    }] });
  } catch (e) {}
}

client.on("ready", () => {
  console.log(`Bot ${client.user.tag} olarak giriş yaptı.`);
});

client.on("channelDelete", async (channel) => {
  const logs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 });
  const entry = logs.entries.first();
  if (!entry) return;
  const { executor } = entry;
  if (track(executor.id, "channelDelete")) banUser(executor.id, "Kanal silme abuse");
});

client.on("roleDelete", async (role) => {
  const logs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 });
  const entry = logs.entries.first();
  if (!entry) return;
  const { executor } = entry;
  if (track(executor.id, "roleDelete")) banUser(executor.id, "Rol silme abuse");
});

client.on("guildBanAdd", async (ban) => {
  const logs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
  const entry = logs.entries.first();
  if (!entry) return;
  const { executor } = entry;
  if (track(executor.id, "ban")) banUser(executor.id, "Ban abuse");
});

client.on("guildMemberRemove", async (member) => {
  const logs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 });
  const entry = logs.entries.first();
  if (!entry) return;
  const { executor } = entry;
  if (track(executor.id, "kick")) banUser(executor.id, "Kick abuse");
});

client.on("guildMemberAdd", async (member) => {
  if (member.user.bot) {
    const logs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 1 });
    const entry = logs.entries.first();
    if (!entry) return;
    const { executor } = entry;
    banUser(executor.id, "Bot ekleme");
    try { await member.ban({ reason: "Bot eklendiği için otomatik ban" }); } catch {}
  }
});

// WEB PANEL
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send(`<form method='POST' action='/login'><input type='password' name='pw'/><button>Giriş</button></form>`);
});

app.post("/login", (req, res) => {
  const { pw } = req.body;
  if (pw !== PASSWORD) return res.send("Hatalı şifre.");
  res.send(`
    <h1>Banlılar</h1>
    ${bans.map(b => `<div>${b.id} - ${b.reason} <form method='POST' action='/unban'><input type='hidden' name='id' value='${b.id}'/><button>Unban</button></form></div>`).join("")}
    <h2>Whitelist</h2>
    ${whitelist.map(w => `<div>${w}</div>`).join("")}
    <form method='POST' action='/addwhitelist'><input name='id'/><button>Whitelist Ekle</button></form>
    <h2>Loglar</h2>
    <pre>${logs.map(l => `${l.userId} - ${l.action} - ${l.target}`).join("\n")}</pre>
  `);
});

app.post("/unban", async (req, res) => {
  const { id } = req.body;
  const guild = client.guilds.cache.get(GUILD_ID);
  await guild.members.unban(id).catch(() => {});
  bans = bans.filter(b => b.id !== id);
  res.redirect("/");
});

app.post("/addwhitelist", (req, res) => {
  const { id } = req.body;
  if (!whitelist.includes(id)) whitelist.push(id);
  res.redirect("/");
});

client.login(TOKEN);
app.listen(PORT, () => console.log(`Web panel aktif: ${PORT}`));
