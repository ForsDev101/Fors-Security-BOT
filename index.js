import 'dotenv/config';
import {
  Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField,
  Events, Collection, ChannelType
} from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
});

const TOKEN = process.env.TOKEN;
const ROLE_BOTYETKI = process.env.ROLE_BOTYETKI; // BotYetki rol id
const LOG_KOMUT = process.env.LOG_KOMUT;         // Komut log kanalı id
const LOG_MOD = process.env.LOG_MOD;             // Moderasyon log kanalı id
const LOG_GELEN = process.env.LOG_GELEN;         // Gelen log kanalı id
const LOG_GIDEN = process.env.LOG_GIDEN;         // Giden log kanalı id

// --- Veriler ve durumlar ---
const warns = {}; // { guildId: { userId: [{mod, sebep, tarih}] } }
const cezalar = {}; // { guildId: [{user, mod, sebep, tarih, tür}] }
const protectionSettings = {
  koruma: false,
  antiraid: false,
  spamEngel: false,
  reklamEngel: false,
  capslockEngel: false,
  etiketEngel: false,
  rolKoruma: false,
  kanalKoruma: false,
  webhookKoruma: false,
  emojiKoruma: false,
  logKanal: LOG_MOD
};
const userMessageTimes = new Map(); // spam engel için

// --- Embed helper ---
function createEmbed(title, description, color = '#00b0f4') {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

// --- Log helper ---
async function logToChannel(channelId, embed) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel && channel.isTextBased()) await channel.send({ embeds: [embed] });
  } catch {}
}

// --- Slash komut tanımları ---
const { REST, Routes, SlashCommandBuilder } = await import('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir kullanıcıyı sunucudan banlar.')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Banlanacak kişi').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Sebep')),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Bir kullanıcıyı sunucudan atar.')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Atılacak kişi').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Sebep')),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Bir kullanıcıyı geçici olarak susturur.')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Susturulacak kişi').setRequired(true))
    .addStringOption(opt => opt.setName('süre').setDescription('Süre (örn: 5m, 1h)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Bir kullanıcının susturmasını kaldırır.')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Susturması kaldırılacak kişi').setRequired(true)),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Bir kullanıcıya uyarı verir.')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Uyarılacak kişi').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Sebep').setRequired(true)),

  new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Bir kullanıcının tüm uyarılarını gösterir.')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Belirtilen sayıda mesaj siler.')
    .addIntegerOption(opt => opt.setName('sayı').setDescription('Silinecek mesaj sayısı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Kanalı kilitler.'),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Kanalın kilidini açar.'),

  new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Kanala yavaş mod ekler.')
    .addIntegerOption(opt => opt.setName('saniye').setDescription('Yavaş mod süresi (saniye)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Bir kullanıcının timeoutunu kaldırır.')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Timeout kaldırılacak kişi').setRequired(true)),

  new SlashCommandBuilder()
    .setName('cezalar')
    .setDescription('Bir kullanıcının aldığı cezaları gösterir.')
    .addUserOption(opt => opt.setName('kullanıcı').setDescription('Kullanıcı').setRequired(true)),

  new SlashCommandBuilder()
    .setName('cezaişlemler')
    .setDescription('Tüm ceza geçmişini listeler.'),

  new SlashCommandBuilder()
    .setName('koruma')
    .setDescription('Tüm koruma sistemlerini açar veya kapatır.')
    .addStringOption(opt => opt.setName('durum').setDescription('aç veya kapat').setRequired(true).addChoices(
      { name: 'aç', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Yeni gelen spam botlara karşı koruma aç/kapat.')
    .addStringOption(opt => opt.setName('durum').setDescription('aç veya kapat').setRequired(true).addChoices(
      { name: 'aç', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('spam-engel')
    .setDescription('Aynı mesajı hızlı atanları engeller aç/kapat.')
    .addStringOption(opt => opt.setName('durum').setDescription('aç veya kapat').setRequired(true).addChoices(
      { name: 'aç', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('reklam-engel')
    .setDescription('Link, davet, reklam içeriklerini engeller aç/kapat.')
    .addStringOption(opt => opt.setName('durum').setDescription('aç veya kapat').setRequired(true).addChoices(
      { name: 'aç', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('capslock-engel')
    .setDescription('Tamamen büyük harf yazanları engeller aç/kapat.')
    .addStringOption(opt => opt.setName('durum').setDescription('aç veya kapat').setRequired(true).addChoices(
      { name: 'aç', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('etiket-engel')
    .setDescription('Herkesi etiketleyenleri engeller aç/kapat.')
    .addStringOption(opt => opt.setName('durum').setDescription('aç veya kapat').setRequired(true).addChoices(
      { name: 'aç', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('rol-koruma')
    .setDescription('Yetkisiz rol silme/ekleme işlemlerini engeller aç/kapat.')
    .addStringOption(opt => opt.setName('durum').setDescription('aç veya kapat').setRequired(true).addChoices(
      { name: 'aç', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('kanal-koruma')
    .setDescription('Yetkisiz kanal silme/ekleme işlemlerini engeller aç/kapat.')
    .addStringOption(opt => opt.setName('durum').setDescription('aç veya kapat').setRequired(true).addChoices(
      { name: 'aç', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('webhook-koruma')
    .setDescription('Webhook spamını engeller aç/kapat.')
    .addStringOption(opt => opt.setName('durum').setDescription('aç veya kapat').setRequired(true).addChoices(
      { name: 'aç', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('emoji-koruma')
    .setDescription('Sunucu emojilerini korur aç/kapat.')
    .addStringOption(opt => opt.setName('durum').setDescription('aç veya kapat').setRequired(true).addChoices(
      { name: 'aç', value: 'ac' },
      { name: 'kapat', value: 'kapat' }
    )),

  new SlashCommandBuilder()
    .setName('log-ayarla')
    .setDescription('Tüm ceza ve koruma logları için kanal ayarlar.')
    .addChannelOption(opt => opt.setName('kanal').setDescription('Log kanalı').addChannelTypes(ChannelType.GuildText).setRequired(true)),

  new SlashCommandBuilder()
    .setName('komutlar')
    .setDescription('Tüm komutları 3 sayfa halinde gösterir.')
];

// --- Yardımcı fonksiyon: süre parse ---
function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const val = parseInt(match[1]);
  switch(match[2]) {
    case 's': return val * 1000;
    case 'm': return val * 60 * 1000;
    case 'h': return val * 60 * 60 * 1000;
    case 'd': return val * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

// --- Mesaj spam kontrol için hız sınırı ---
const userSpamData = new Map();

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, guild, member, user } = interaction;
  if (!guild) return interaction.reply({ content: 'Komutlar sadece sunucularda kullanılabilir.', ephemeral: true });
  if (!member.roles.cache.has(ROLE_BOTYETKI)) {
    return interaction.reply({ content: 'Bu komutu kullanmak için BotYetki rolüne sahip olmalısın.', ephemeral: true });
  }

  switch(commandName) {
    case 'ban': {
      const hedef = interaction.options.getUser('kullanıcı');
      const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
      const hedefMember = await guild.members.fetch(hedef.id).catch(() => null);
      if (!hedefMember) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });
      if (!hedefMember.bannable) return interaction.reply({ content: 'Bu kullanıcıyı banlayamam.', ephemeral: true });

      await hedefMember.ban({ reason: sebep });
      try { await hedef.send(`Sunucudan banlandınız. Sebep: ${sebep}`); } catch {}
      interaction.reply({ embeds: [createEmbed('🚫 Banlandı', `${hedef.tag} banlandı.\nSebep: ${sebep}`, '#ff0000')] });
      await logToChannel(LOG_MOD, createEmbed('Ban Logu', `${user.tag} tarafından ${hedef.tag} banlandı.\nSebep: ${sebep}`, '#ff0000'));
      await logToChannel(LOG_KOMUT, createEmbed('Komut Logu', `${user.tag} /ban komutunu kullandı.`));
      break;
    }

    case 'kick': {
      const hedef = interaction.options.getUser('kullanıcı');
      const sebep = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
      const hedefMember = await guild.members.fetch(hedef.id).catch(() => null);
      if (!hedefMember) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });
      if (!hedefMember.kickable) return interaction.reply({ content: 'Bu kullanıcıyı atamam.', ephemeral: true });

      await hedefMember.kick(sebep);
      try { await hedef.send(`Sunucudan atıldınız. Sebep: ${sebep}`); } catch {}
      interaction.reply({ embeds: [createEmbed('👢 Atıldı', `${hedef.tag} sunucudan atıldı.\nSebep: ${sebep}`, '#ff9900')] });
      await logToChannel(LOG_MOD, createEmbed('Kick Logu', `${user.tag} tarafından ${hedef.tag} atıldı.\nSebep: ${sebep}`, '#ff9900'));
      await logToChannel(LOG_KOMUT, createEmbed('Komut Logu', `${user.tag} /kick komutunu kullandı.`));
      break;
    }

    case 'mute': {
      const hedef = interaction.options.getUser('kullanıcı');
      const sureStr = interaction.options.getString('süre');
      const hedefMember = await guild.members.fetch(hedef.id).catch(() => null);
      if (!hedefMember) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });

      const msSure = parseDuration(sureStr);
      if (!msSure) return interaction.reply({ content: 'Geçerli süre girin (örn: 5m, 1h).', ephemeral: true });

      await hedefMember.timeout(msSure, `Mute sebep: komut`);
      try { await hedef.send(`Sunucuda ${sureStr} süresiyle susturuldunuz.`); } catch {}
      interaction.reply({ embeds: [createEmbed('🔇 Susturuldu', `${hedef.tag} ${sureStr} süresiyle susturuldu.`, '#ff5500')] });
      await logToChannel(LOG_MOD, createEmbed('Mute Logu', `${user.tag} tarafından ${hedef.tag} ${sureStr} susturuldu.`, '#ff5500'));
      await logToChannel(LOG_KOMUT, createEmbed('Komut Logu', `${user.tag} /mute komutunu kullandı.`));
      break;
    }

    case 'unmute': {
      const hedef = interaction.options.getUser('kullanıcı');
      const hedefMember = await guild.members.fetch(hedef.id).catch(() => null);
      if (!hedefMember) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });

      await hedefMember.timeout(null);
      interaction.reply({ embeds: [createEmbed('🔊 Susturma Kaldırıldı', `${hedef.tag} üzerindeki susturma kaldırıldı.`, '#00ff00')] });
      await logToChannel(LOG_MOD, createEmbed('Unmute Logu', `${user.tag} tarafından ${hedef.tag} unmute yapıldı.`, '#00ff00'));
      await logToChannel(LOG_KOMUT, createEmbed('Komut Logu', `${user.tag} /unmute komutunu kullandı.`));
      break;
    }

    case 'warn': {
      const hedef = interaction.options.getUser('kullanıcı');
      const sebep = interaction.options.getString('sebep');
      warns[guild.id] ??= {};
      warns[guild.id][hedef.id] ??= [];
      warns[guild.id][hedef.id].push({ mod: user.tag, sebep, tarih: Date.now() });

      try { await hedef.send(`Sunucuda uyarıldınız. Sebep: ${sebep}`); } catch {}
      interaction.reply({ embeds: [createEmbed('⚠️ Uyarı', `${hedef.tag} uyarıldı.\nSebep: ${sebep}`, '#ffaa00')] });
      await logToChannel(LOG_KOMUT, createEmbed('Komut Logu', `${user.tag} /warn komutunu kullandı.`));
      break;
    }

    case 'warnings': {
      const hedef = interaction.options.getUser('kullanıcı');
      const userWarns = warns[guild.id]?.[hedef.id] || [];
      if (userWarns.length === 0) {
        return interaction.reply({ embeds: [createEmbed('Bilgi', `${hedef.tag} hiç uyarı almamış.`)], ephemeral: true });
      }
      let metin = "";
      userWarns.forEach((w, i) => {
        const date = new Date(w.tarih).toLocaleString();
        metin += `${i + 1}. Yetkili: ${w.mod} - Sebep: ${w.sebep} - Tarih: ${date}\n`;
      });
      interaction.reply({ embeds: [createEmbed(`${hedef.tag} Uyarıları`, metin, '#ffaa00')] });
      break;
    }

    case 'clear': {
      const miktar = interaction.options.getInteger('sayı');
      if (miktar < 1 || miktar > 100) return interaction.reply({ embeds: [createEmbed('❌ Hata', '1 ile 100 arasında sayı girin.', '#ff0000')], ephemeral: true });
      const mesajlar = await interaction.channel.messages.fetch({ limit: miktar });
      await interaction.channel.bulkDelete(mesajlar, true);
      interaction.reply({ embeds: [createEmbed('✅ Mesaj Silindi', `${miktar} mesaj silindi.`, '#00ff00')] });
      await logToChannel(LOG_KOMUT, createEmbed('Komut Logu', `${user.tag} /clear komutunu kullandı, ${miktar} mesaj silindi.`));
      break;
    }

    case 'lock': {
      const herkes = guild.roles.everyone;
      await interaction.channel.permissionOverwrites.edit(herkes, {
        SendMessages: false,
        AddReactions: false
      });
      interaction.reply({ embeds: [createEmbed('🔒 Kanal Kilitlendi', `${interaction.channel.name} kanalı kilitlendi.`, '#ff0000')] });
      await logToChannel(LOG_KOMUT, createEmbed('Kanal Kilitlendi', `${user.tag} kanalı kilitledi: ${interaction.channel.name}`, '#ff0000'));
      break;
    }

    case 'unlock': {
      const herkes = guild.roles.everyone;
      await interaction.channel.permissionOverwrites.edit(herkes, {
        SendMessages: true,
        AddReactions: true
      });
      interaction.reply({ embeds: [createEmbed('🔓 Kanal Açıldı', `${interaction.channel.name} kanalı açıldı.`, '#00ff00')] });
      await logToChannel(LOG_KOMUT, createEmbed('Kanal Açıldı', `${user.tag} kanalı açtı: ${interaction.channel.name}`, '#00ff00'));
      break;
    }

    case 'slowmode': {
      const saniye = interaction.options.getInteger('saniye');
      if (saniye < 0 || saniye > 21600) return interaction.reply({ embeds: [createEmbed('❌ Hata', '0-21600 arası saniye girin.', '#ff0000')], ephemeral: true });
      await interaction.channel.setRateLimitPerUser(saniye);
      interaction.reply({ embeds: [createEmbed('🐢 Slowmode Ayarlandı', `${interaction.channel.name} kanalına ${saniye} saniye yavaş mod eklendi.`, '#00aaff')] });
      await logToChannel(LOG_KOMUT, createEmbed('Slowmode Ayarlandı', `${user.tag} ${interaction.channel.name} kanalına ${saniye} saniye slowmode ayarladı.`, '#00aaff'));
      break;
    }

    case 'untimeout': {
      const hedef = interaction.options.getUser('kullanıcı');
      const hedefMember = await guild.members.fetch(hedef.id).catch(() => null);
      if (!hedefMember) return interaction.reply({ content: 'Kullanıcı sunucuda bulunamadı.', ephemeral: true });

      await hedefMember.timeout(null);
      interaction.reply({ embeds: [createEmbed('⌛ Timeout Kaldırıldı', `${hedef.tag} üzerindeki timeout kaldırıldı.`, '#00ff00')] });
      await logToChannel(LOG_MOD, createEmbed('Timeout Kaldırıldı', `${user.tag} tarafından ${hedef.tag} timeout kaldırıldı.`, '#00ff00'));
      await logToChannel(LOG_KOMUT, createEmbed('Komut Logu', `${user.tag} /untimeout komutunu kullandı.`));
      break;
    }

    case 'cezalar': {
      const hedef = interaction.options.getUser('kullanıcı');
      const guildCezalar = cezalar[guild.id] || [];
      const userCezalar = guildCezalar.filter(c => c.user === hedef.id);
      if (userCezalar.length === 0) {
        return interaction.reply({ embeds: [createEmbed('Bilgi', `${hedef.tag} hiç ceza almamış.`)], ephemeral: true });
      }
      let metin = '';
      userCezalar.forEach((c, i) => {
        const tarih = new Date(c.tarih).toLocaleString();
        metin += `${i + 1}. Tür: ${c.tür} - Sebep: ${c.sebep} - Yetkili: ${c.mod} - Tarih: ${tarih}\n`;
      });
      interaction.reply({ embeds: [createEmbed(`${hedef.tag} Cezaları`, metin, '#ffaa00')] });
      break;
    }

    case 'cezaişlemler': {
      const guildCezalar = cezalar[guild.id] || [];
      if (guildCezalar.length === 0) {
        return interaction.reply({ embeds: [createEmbed('Bilgi', 'Hiç ceza işlemi yok.')], ephemeral: true });
      }
      let metin = '';
      guildCezalar.forEach((c, i) => {
        const tarih = new Date(c.tarih).toLocaleString();
        metin += `${i + 1}. Kullanıcı: <@${c.user}> - Tür: ${c.tür} - Sebep: ${c.sebep} - Yetkili: ${c.mod} - Tarih: ${tarih}\n`;
      });
      interaction.reply({ embeds: [createEmbed('Tüm Ceza İşlemleri', metin, '#ffaa00')] });
      break;
    }

    // Koruma ayarları aç/kapat

    case 'koruma': {
      const durum = interaction.options.getString('durum');
      protectionSettings.koruma = (durum === 'ac');
      interaction.reply({ embeds: [createEmbed('Koruma Durumu', `Tüm koruma sistemleri ${durum === 'ac' ? 'açıldı' : 'kapatıldı'}.`, '#00b0f4')] });
      await logToChannel(LOG_KOMUT, createEmbed('Koruma', `${user.tag} tüm koruma sistemlerini ${durum} yaptı.`));
      break;
    }

    case 'antiraid': {
      const durum = interaction.options.getString('durum');
      protectionSettings.antiraid = (durum === 'ac');
      interaction.reply({ embeds: [createEmbed('Antiraid', `Antiraid sistemi ${durum === 'ac' ? 'açıldı' : 'kapatıldı'}.`, '#00b0f4')] });
      await logToChannel(LOG_KOMUT, createEmbed('Antiraid', `${user.tag} antiraid sistemini ${durum} yaptı.`));
      break;
    }

    case 'spam-engel': {
      const durum = interaction.options.getString('durum');
      protectionSettings.spamEngel = (durum === 'ac');
      interaction.reply({ embeds: [createEmbed('Spam Engel', `Spam engel sistemi ${durum === 'ac' ? 'açıldı' : 'kapatıldı'}.`, '#00b0f4')] });
      await logToChannel(LOG_KOMUT, createEmbed('Spam Engel', `${user.tag} spam engel sistemini ${durum} yaptı.`));
      break;
    }

    case 'reklam-engel': {
      const durum = interaction.options.getString('durum');
      protectionSettings.reklamEngel = (durum === 'ac');
      interaction.reply({ embeds: [createEmbed('Reklam Engel', `Reklam engel sistemi ${durum === 'ac' ? 'açıldı' : 'kapatıldı'}.`, '#00b0f4')] });
      await logToChannel(LOG_KOMUT, createEmbed('Reklam Engel', `${user.tag} reklam engel sistemini ${durum} yaptı.`));
      break;
    }

    case 'capslock-engel': {
      const durum = interaction.options.getString('durum');
      protectionSettings.capslockEngel = (durum === 'ac');
      interaction.reply({ embeds: [createEmbed('Capslock Engel', `Capslock engel sistemi ${durum === 'ac' ? 'açıldı' : 'kapatıldı'}.`, '#00b0f4')] });
      await logToChannel(LOG_KOMUT, createEmbed('Capslock Engel', `${user.tag} capslock engel sistemini ${durum} yaptı.`));
      break;
    }

    case 'etiket-engel': {
      const durum = interaction.options.getString('durum');
      protectionSettings.etiketEngel = (durum === 'ac');
      interaction.reply({ embeds: [createEmbed('Etiket Engel', `Etiket engel sistemi ${durum === 'ac' ? 'açıldı' : 'kapatıldı'}.`, '#00b0f4')] });
      await logToChannel(LOG_KOMUT, createEmbed('Etiket Engel', `${user.tag} etiket engel sistemini ${durum} yaptı.`));
      break;
    }

    case 'rol-koruma': {
      const durum = interaction.options.getString('durum');
      protectionSettings.rolKoruma = (durum === 'ac');
      interaction.reply({ embeds: [createEmbed('Rol Koruma', `Rol koruma sistemi ${durum === 'ac' ? 'açıldı' : 'kapatıldı'}.`, '#00b0f4')] });
      await logToChannel(LOG_KOMUT, createEmbed('Rol Koruma', `${user.tag} rol koruma sistemini ${durum} yaptı.`));
      break;
    }

    case 'kanal-koruma': {
      const durum = interaction.options.getString('durum');
      protectionSettings.kanalKoruma = (durum === 'ac');
      interaction.reply({ embeds: [createEmbed('Kanal Koruma', `Kanal koruma sistemi ${durum === 'ac' ? 'açıldı' : 'kapatıldı'}.`, '#00b0f4')] });
      await logToChannel(LOG_KOMUT, createEmbed('Kanal Koruma', `${user.tag} kanal koruma sistemini ${durum} yaptı.`));
      break;
    }

    case 'webhook-koruma': {
      const durum = interaction.options.getString('durum');
      protectionSettings.webhookKoruma = (durum === 'ac');
      interaction.reply({ embeds: [createEmbed('Webhook Koruma', `Webhook koruma sistemi ${durum === 'ac' ? 'açıldı' : 'kapatıldı'}.`, '#00b0f4')] });
      await logToChannel(LOG_KOMUT, createEmbed('Webhook Koruma', `${user.tag} webhook koruma sistemini ${durum} yaptı.`));
      break;
    }

    case 'emoji-koruma': {
      const durum = interaction.options.getString('durum');
      protectionSettings.emojiKoruma = (durum === 'ac');
      interaction.reply({ embeds: [createEmbed('Emoji Koruma', `Emoji koruma sistemi ${durum === 'ac' ? 'açıldı' : 'kapatıldı'}.`, '#00b0f4')] });
      await logToChannel(LOG_KOMUT, createEmbed('Emoji Koruma', `${user.tag} emoji koruma sistemini ${durum} yaptı.`));
      break;
    }

    case 'log-ayarla': {
      const kanal = interaction.options.getChannel('kanal');
      protectionSettings.logKanal = kanal.id;
      interaction.reply({ embeds: [createEmbed('Log Kanalı Ayarlandı', `Log kanalı ${kanal} olarak ayarlandı.`, '#00b0f4')] });
      break;
    }

    case 'komutlar': {
      // 3 sayfalık embed ve emoji ile sayfa değiştirme için:
      // Basit yapalım: ilk sayfa gönder, emoji bekle
      const sayfa1 = new EmbedBuilder()
        .setTitle('Moderasyon ve Koruma Komutları - Sayfa 1/3')
        .setColor('#00b0f4')
        .setDescription(`
**Ban, Kick, Mute, Unmute, Warn, Warnings, Clear, Lock, Unlock, Slowmode, Untimeout**

- /ban @kullanıcı [sebep] : Kullanıcıyı sunucudan banlar.
- /kick @kullanıcı [sebep] : Kullanıcıyı sunucudan atar.
- /mute @kullanıcı [süre] : Belirtilen kişiyi geçici olarak susturur.
- /unmute @kullanıcı : Susturmayı kaldırır.
- /warn @kullanıcı [sebep] : Kullanıcıya uyarı verir.
- /warnings @kullanıcı : Kullanıcının aldığı tüm uyarıları listeler.
- /clear [sayı] : Belirtilen kadar mesajı siler.
- /lock : Kanalı kilitler.
- /unlock : Kanalın kilidini açar.
- /slowmode [saniye] : Kanala yavaş mod ekler.
- /untimeout @kullanıcı : Timeout kaldırır.
`);

      const sayfa2 = new EmbedBuilder()
        .setTitle('Koruma Komutları - Sayfa 2/3')
        .setColor('#00b0f4')
        .setDescription(`
**Koruma, Antiraid, Spam-Engel, Reklam-Engel, Capslock-Engel, Etiket-Engel**

- /koruma aç/kapat : Tüm koruma sistemlerini aktif eder/devre dışı bırakır.
- /antiraid aç/kapat : Yeni gelen spam botlara karşı koruma sağlar.
- /spam-engel aç/kapat : Aynı mesajı hızlıca atanları engeller.
- /reklam-engel aç/kapat : Link, davet, reklam içeriklerini engeller.
- /capslock-engel aç/kapat : Tamamen büyük harf yazanları engeller.
- /etiket-engel aç/kapat : Herkesi etiketleyenleri engeller.
`);

      const sayfa3 = new EmbedBuilder()
        .setTitle('Koruma Devam ve Diğer Komutlar - Sayfa 3/3')
        .setColor('#00b0f4')
        .setDescription(`
**Rol-Koruma, Kanal-Koruma, Webhook-Koruma, Emoji-Koruma, Log-Ayarla, Cezalar, Cezaİşlemler**

- /rol-koruma aç/kapat : Yetkisiz rol silme/ekleme işlemlerini engeller.
- /kanal-koruma aç/kapat : Yetkisiz kanal silme/ekleme işlemlerini engeller.
- /webhook-koruma aç/kapat : Webhook spamını engeller.
- /emoji-koruma aç/kapat : Sunucu emojilerini korur.
- /log-ayarla #kanal : Tüm ceza ve koruma logları için kanal ayarı.
- /cezalar @kullanıcı : Kullanıcının aldığı cezaları gösterir.
- /cezaişlemler : Tüm ceza geçmişini listeler.
`);

      // Mesajı gönder ve emoji ekle
      const mesaj = await interaction.reply({ embeds: [sayfa1], fetchReply: true });

      // Emoji reactionlar (◀️ ve ▶️)
      const emojis = ['◀️', '▶️'];
      for (const e of emojis) await mesaj.react(e);

      let currentPage = 1;
      const filter = (reaction, usr) => emojis.includes(reaction.emoji.name) && usr.id === interaction.user.id;

      const collector = mesaj.createReactionCollector({ filter, time: 60000 });

      collector.on('collect', async (reaction, usr) => {
        try {
          if (reaction.emoji.name === '▶️' && currentPage < 3) {
            currentPage++;
            if (currentPage === 2) await mesaj.edit({ embeds: [sayfa2] });
            if (currentPage === 3) await mesaj.edit({ embeds: [sayfa3] });
          } else if (reaction.emoji.name === '◀️' && currentPage > 1) {
            currentPage--;
            if (currentPage === 1) await mesaj.edit({ embeds: [sayfa1] });
            if (currentPage === 2) await mesaj.edit({ embeds: [sayfa2] });
          }
          await reaction.users.remove(usr.id);
        } catch {}
      });

      collector.on('end', () => {
        mesaj.reactions.removeAll().catch(() => {});
      });

      break;
    }

    default:
      interaction.reply({ content: 'Bilinmeyen komut.', ephemeral: true });
  }
});

// --- Otomatik koruma örnekleri (spam, reklam, capslock vs) ---

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;
  if (!message.guild) return;

  // Koruma açık değilse işleme
  if (!protectionSettings.koruma) return;

  // Spam engel örneği
  if (protectionSettings.spamEngel) {
    const userData = userSpamData.get(message.author.id) || { lastMsg: '', count: 0, lastTime: 0 };
    const now = Date.now();

    if (now - userData.lastTime < 3000 && message.content === userData.lastMsg) {
      userData.count++;
    } else {
      userData.count = 1;
    }

    userData.lastMsg = message.content;
    userData.lastTime = now;
    userSpamData.set(message.author.id, userData);

    if (userData.count >= 5) {
      // Spam yapan kullanıcıyı mute at
      const member = message.member;
      if (member.moderatable) {
        await member.timeout(10 * 60 * 1000, 'Spam nedeniyle mute atıldı.');
        await message.channel.send({ content: `${member} spam yaptığı için 10 dakika susturuldu.` });
        await logToChannel(LOG_MOD, createEmbed('Spam Mute', `${member.user.tag} spam yaptığı için 10 dakika mute atıldı.`, '#ff5500'));
      }
    }
  }

  // Reklam engel
  if (protectionSettings.reklamEngel) {
    const reklamRegex = /(discord\.gg|discordapp\.com\/invite|http[s]?:\/\/[^\s]+)/gi;
    if (reklamRegex.test(message.content)) {
      await message.delete().catch(() => {});
      await message.channel.send({ content: `${message.author} reklam/reklam linki engellendi.` }).then(msg => setTimeout(() => msg.delete(), 5000));
      await logToChannel(LOG_MOD, createEmbed('Reklam Engellendi', `${message.author.tag} reklam gönderdi ve mesaj silindi.`, '#ffaa00'));
    }
  }

  // Capslock engel
  if (protectionSettings.capslockEngel) {
    const caps = message.content.replace(/[^A-Za-z]/g, '').length;
    const upper = message.content.replace(/[^A-Z]/g, '').length;
    if (caps > 5 && upper / caps > 0.7) {
      await message.delete().catch(() => {});
      await message.channel.send({ content: `${message.author} capslock engellendi.` }).then(msg => setTimeout(() => msg.delete(), 5000));
      await logToChannel(LOG_MOD, createEmbed('Capslock Engellendi', `${message.author.tag} capslock kullandı ve mesaj silindi.`, '#ffaa00'));
    }
  }

  // Etiket engel (herkesi etiketleme)
  if (protectionSettings.etiketEngel) {
    if (message.mentions.users.size > 5) {
      await message.delete().catch(() => {});
      await message.channel.send({ content: `${message.author} herkesi etiketlemek yasak.` }).then(msg => setTimeout(() => msg.delete(), 5000));
      await logToChannel(LOG_MOD, createEmbed('Etiket Engellendi', `${message.author.tag} çok fazla etiketledi ve mesaj silindi.`, '#ffaa00'));
    }
  }

  // Diğer koruma örneklerini benzer şekilde ekleyebilirsin

});

// --- Bot giriş ---
client.once(Events.ClientReady, () => {
  console.log(`Bot giriş yaptı: ${client.user.tag}`);
});

// --- Slash komutları register et ---
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Slash komutlar yükleniyor...');
    await rest.put(
      Routes.applicationCommands(client.user?.id || '0'),
      { body: commands.map(cmd => cmd.toJSON()) }
    );
    console.log('Slash komutlar yüklendi.');
  } catch (error) {
    console.error(error);
  }
})();

client.login(TOKEN);
