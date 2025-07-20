// index.js
require("dotenv").config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require("discord.js");
const express = require("express");
const app = express();
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildIntegrations,
  ],
  partials: [Partials.Channel]
});

const TOKEN = process.env.TOKEN;
const PORT = process.env.PORT || 3000;
const AUTH_COOKIE = process.env.AUTH_COOKIE;
const OWNER_ID = process.env.OWNER_ID;

let whitelist = [];
let actionLog = [];
let bans = {};

const actionHistory = {}; // userId: { type: [timestamps] }
const LIMIT = 3;
const TIME_FRAME = 1000 * 60 * 30; // 30 dakika

function shouldBan(userId, type) {
  if (whitelist.includes(userId)) return false;
  const now = Date.now();
  if (!actionHistory[userId]) actionHistory[userId] = {};
  if (!actionHistory[userId][type]) actionHistory[userId][type] = [];
  actionHistory[userId][type] = actionHistory[userId][type].filter(ts => now - ts < TIME_FRAME);
  actionHistory[userId][type].push(now);
  return actionHistory[userId][type].length >= LIMIT;
}

function banUser(guild, userId, reason) {
  const member = guild.members.cache.get(userId);
  if (!member) return;
  if (whitelist.includes(userId)) return;
  member.ban({ reason }).catch(() => {});
  const embed = new EmbedBuilder()
    .setTitle("Fors Koruması")
    .setDescription("Forslandın")
    .setColor("Red")
    .setFooter({ text: "TKT forsun koruması altındadır" });
  member.send({ embeds: [embed] }).catch(() => {});
  bans[userId] = { id: userId, tag: member.user.tag, reason, timestamp: Date.now() };
  actionLog.push({ userId, tag: member.user.tag, action: reason, time: new Date() });
}

client.on("guildMemberAdd", member => {
  if (member.user.bot) {
    const entry = member.guild.fetchAuditLogs({ type: 28 }).then(logs => {
      const executor = logs.entries.first()?.executor;
      if (executor && shouldBan(executor.id, "botAdd")) banUser(member.guild, executor.id, "Bot ekleme");
    });
  }
});

client.on("channelDelete", channel => {
  channel.guild.fetchAuditLogs({ type: 12 }).then(logs => {
    const executor = logs.entries.first()?.executor;
    if (executor && shouldBan(executor.id, "channelDelete")) banUser(channel.guild, executor.id, "Kanal silme");
  });
});

client.on("roleDelete", role => {
  role.guild.fetchAuditLogs({ type: 32 }).then(logs => {
    const executor = logs.entries.first()?.executor;
    if (executor && shouldBan(executor.id, "roleDelete")) banUser(role.guild, executor.id, "Rol silme");
  });
});

client.on("guildBanAdd", (ban) => {
  ban.guild.fetchAuditLogs({ type: 22 }).then(logs => {
    const executor = logs.entries.first()?.executor;
    if (executor && shouldBan(executor.id, "memberBan")) banUser(ban.guild, executor.id, "Üye banlama");
  });
});

client.on("guildMemberRemove", member => {
  member.guild.fetchAuditLogs({ type: 20 }).then(logs => {
    const executor = logs.entries.first()?.executor;
    if (executor && shouldBan(executor.id, "memberKick")) banUser(member.guild, executor.id, "Üye kickleme");
  });
});

client.on("messageCreate", msg => {
  if (!msg.content.startsWith("!Tamkontrol") || msg.author.id !== OWNER_ID) return;
  const target = msg.mentions.users.first();
  if (!target) return msg.reply("Kullanıcı etiketle.");
  if (whitelist.includes(target.id)) {
    whitelist = whitelist.filter(id => id !== target.id);
    msg.reply(`${target.tag} artık korunmuyor.`);
  } else {
    whitelist.push(target.id);
    msg.reply(`${target.tag} artık korumalı.`);
  }
});

// Web panel
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  if (req.headers["auth"] !== AUTH_COOKIE) return res.status(401).send("Yetkisiz");
  next();
});

app.get("/", (req, res) => {
  res.send(`<h1>Fors Koruma Paneli</h1>
  <ul>
    <li><a href='/bans'>Banlılar</a></li>
    <li><a href='/whitelist'>Whitelist</a></li>
    <li><a href='/logs'>Loglar</a></li>
  </ul>`);
});

app.get("/bans", (req, res) => {
  res.json(bans);
});

app.post("/unban", (req, res) => {
  const id = req.body.id;
  const guild = client.guilds.cache.first();
  if (guild) guild.members.unban(id).catch(() => {});
  delete bans[id];
  res.send("Ban kaldırıldı.");
});

app.get("/whitelist", (req, res) => {
  res.json(whitelist);
});

app.post("/whitelist", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).send("ID gerekli");
  if (!whitelist.includes(id)) whitelist.push(id);
  res.send("Eklendi");
});

app.get("/logs", (req, res) => {
  res.json(actionLog);
});

app.listen(PORT, () => console.log(`Web panel çalışıyor: ${PORT}`));

client.login(TOKEN);
