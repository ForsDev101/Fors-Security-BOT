// ============ GEREKLİ MODÜLLER ============
const { Client, GatewayIntentBits, AuditLogEvent, EmbedBuilder, Partials } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');

// ============ CONFIG ============
const TOKEN = process.env.DISCORD_TOKEN;
const OWNER_ID = process.env.OWNER_ID;
const PANEL_PASSWORD = process.env.PANEL_PASSWORD || '1234';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildIntegrations
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ============ DEĞİŞKENLER ============
const actionLogs = new Map();
const bannedUsers = new Map();
const allowlist = new Set();
const BAN_THRESHOLD = {
  CHANNEL_DELETE: 3,
  ROLE_DELETE: 3,
  MEMBER_BAN_ADD: 4,
  MEMBER_KICK: 4
};
const TIME_WINDOW = 30 * 60 * 1000; // 30 dakika

// ============ FONKSİYONLAR ============
function logAction(userId, actionType) {
  const key = `${userId}_${actionType}`;
  if (!actionLogs.has(key)) actionLogs.set(key, []);
  actionLogs.get(key).push(Date.now());
  actionLogs.set(key, actionLogs.get(key).filter(t => Date.now() - t <= TIME_WINDOW));
  return actionLogs.get(key).length;
}

function banUser(guild, userId, reason) {
  if (allowlist.has(userId)) return;
  const member = guild.members.cache.get(userId);
  if (!member) return;
  member.ban({ reason }).catch(() => {});
  bannedUsers.set(userId, { reason, time: new Date().toISOString() });
  member.send({
    embeds: [
      new EmbedBuilder()
        .setTitle('TKT Koruması')
        .setDescription('TKT Forsun koruması altındadır.')
        .setColor('Red')
    ]
  }).catch(() => {});
}

// ============ EVENTLER ============
client.on('ready', () => {
  console.log(`Bot aktif: ${client.user.tag}`);
});

client.on('guildAuditLogEntryCreate', async (entry) => {
  const { action, executorId, targetId, guild } = entry;
  if (executorId === client.user.id || allowlist.has(executorId)) return;

  let actionType;
  if (action === AuditLogEvent.BotAdd) {
    const addedBot = await guild.members.fetch(targetId);
    if (addedBot.user.bot) {
      banUser(guild, executorId, 'Sunucuya bot ekleme');
      banUser(guild, targetId, 'İzinsiz bot eklendi');
    }
    return;
  }
  if (action === AuditLogEvent.ChannelDelete) actionType = 'CHANNEL_DELETE';
  if (action === AuditLogEvent.RoleDelete) actionType = 'ROLE_DELETE';
  if (action === AuditLogEvent.MemberBanAdd) actionType = 'MEMBER_BAN_ADD';
  if (action === AuditLogEvent.MemberKick) actionType = 'MEMBER_KICK';

  if (!actionType) return;

  const count = logAction(executorId, actionType);
  if (count >= BAN_THRESHOLD[actionType]) {
    banUser(guild, executorId, `Fazla ${actionType.toLowerCase()} işlemi`);
  }
});

client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;
  if (!message.content.startsWith('!Tamkontrol')) return;
  if (message.author.id !== OWNER_ID) return;

  const mention = message.mentions.users.first();
  if (!mention) return message.reply('Kimi whitelist yapmak istiyorsun?');

  allowlist.add(mention.id);
  message.reply(`${mention.tag} whitelist'e eklendi.`);
});

// ============ EXPRESS PANEL ============
const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

app.use((req, res, next) => {
  if (req.headers.authorization !== PANEL_PASSWORD) {
    return res.status(403).json({ error: 'Yetkisiz' });
  }
  next();
});

app.get('/api/banned', (req, res) => {
  const list = [...bannedUsers.entries()].map(([id, data]) => ({ id, ...data }));
  res.json(list);
});

app.post('/api/unban', async (req, res) => {
  const { guilds } = client;
  const { id } = req.body;
  bannedUsers.delete(id);
  for (const guild of guilds.cache.values()) {
    try {
      await guild.bans.remove(id);
    } catch {}
  }
  res.json({ success: true });
});

app.post('/api/allowlist', (req, res) => {
  const { id } = req.body;
  allowlist.add(id);
  res.json({ success: true });
});

app.listen(3000, () => console.log('Web panel 3000 portunda çalışıyor.'));

client.login(TOKEN);
