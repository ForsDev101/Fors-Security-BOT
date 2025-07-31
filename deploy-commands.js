import { config } from "dotenv";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const commands = [
  // Moderasyon komutları
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bir kullanıcıyı sunucudan banlar")
    .addUserOption(o => o.setName("kullanıcı").setDescription("Banlanacak kişi").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Sebep")),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Bir kullanıcıyı sunucudan atar")
    .addUserOption(o => o.setName("kullanıcı").setDescription("Atılacak kişi").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Sebep")),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Belirtilen kişiyi geçici olarak susturur")
    .addUserOption(o => o.setName("kullanıcı").setDescription("Susturulacak kişi").setRequired(true))
    .addStringOption(o => o.setName("süre").setDescription("Süre (örn: 10m, 1h)")),

  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Susturmayı kaldırır")
    .addUserOption(o => o.setName("kullanıcı").setDescription("Susturması kaldırılacak kişi").setRequired(true)),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Kullanıcıya uyarı verir")
    .addUserOption(o => o.setName("kullanıcı").setDescription("Uyarılacak kişi").setRequired(true))
    .addStringOption(o => o.setName("sebep").setDescription("Uyarı sebebi").setRequired(true)),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Kullanıcının uyarılarını listeler")
    .addUserOption(o => o.setName("kullanıcı").setDescription("Kullanıcı").setRequired(true)),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Belirtilen kadar mesaj siler")
    .addIntegerOption(o => o.setName("sayı").setDescription("Silinecek mesaj sayısı").setRequired(true)),

  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Kanalı kilitler"),

  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Kanal kilidini açar"),

  new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Kanala yavaş mod ayarlar")
    .addIntegerOption(o => o.setName("saniye").setDescription("Yavaş mod süresi (saniye)").setRequired(true)),

  new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Timeout kaldırır")
    .addUserOption(o => o.setName("kullanıcı").setDescription("Timeout kaldırılacak kişi").setRequired(true)),

  // Koruma komutları
  ...[
    "koruma",
    "antiraid",
    "spam-engel",
    "reklam-engel",
    "capslock-engel",
    "etiket-engel",
    "rol-koruma",
    "kanal-koruma",
    "webhook-koruma",
    "emoji-koruma"
  ].map(name =>
    new SlashCommandBuilder()
      .setName(name)
      .setDescription(`${name} korumasını açar/kapatır`)
      .addStringOption(opt => opt.setName("durum").setDescription("aç veya kapat").setRequired(true))
  ),

  new SlashCommandBuilder()
    .setName("log-ayarla")
    .setDescription("Log kanalı ayarlar")
    .addChannelOption(o => o.setName("kanal").setDescription("Log kanalı").setRequired(true)),

  // Diğer komutlar
  new SlashCommandBuilder()
    .setName("cezalar")
    .setDescription("Kullanıcının aldığı cezaları gösterir")
    .addUserOption(o => o.setName("kullanıcı").setDescription("Kullanıcı").setRequired(true)),

  new SlashCommandBuilder()
    .setName("cezaişlemler")
    .setDescription("Tüm ceza geçmişini listeler"),

  new SlashCommandBuilder()
    .setName("koruma-durum")
    .setDescription("Koruma ayarlarının durumunu gösterir"),

  new SlashCommandBuilder()
    .setName("komutlar")
    .setDescription("Tüm komutları sayfalı gösterir"),
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Komutlar deploy ediliyor...");
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands.map(cmd => cmd.toJSON()) }
    );
    console.log("Komutlar başarıyla deploy edildi.");
  } catch (error) {
    console.error("Komut deploy hatası:", error);
  }
})();
