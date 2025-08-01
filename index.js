import { Client, GatewayIntentBits, Partials, Collection, Events } from "discord.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

// Komutları yükle
const commandsPath = path.join(process.cwd(), "commands");
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = await import(`file://${filePath}`);
    client.commands.set(command.data.name, command);
  }
}

// Log kanalları ve roller
const {
  CLIENT_ID,
  GUILD_ID,
  LOG_GELENGIDEN,
  LOG_KOMUT,
  LOG_MOD,
  ROLE_BOTYETKI,
  ROLE_KAYITSIZ,
  ROLE_UYE,
  TOKEN,
} = process.env;

// Hazır eventler
client.once(Events.ClientReady, () => {
  console.log(`Bot giriş yaptı: ${client.user.tag}`);
  // Komutları Discord API'ye yükleme işlemi utils/registerCommands.js ile yapılacak
});

// InteractionCreate event handler
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "Komut çalıştırılırken hata oluştu!", ephemeral: true });
  }
});

// Selamlaşma sistemi
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const greetings = ["sa", "SA", "slm", "Selam", "selam aleykum", "selamun aleykum"];
  if (greetings.some((g) => message.content.includes(g))) {
    message.channel.send("Aleyküm selam hoş geldin.");
  }
});

// Yeni üye geldiğinde Kayıtsız rolü verme
client.on("guildMemberAdd", async (member) => {
  const kayıtsızRol = member.guild.roles.cache.get(ROLE_KAYITSIZ);
  if (!kayıtsızRol) return;
  await member.roles.add(kayıtsızRol).catch(console.error);
});

client.login(TOKEN);
