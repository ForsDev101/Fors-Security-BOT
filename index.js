import { Client, GatewayIntentBits, Partials, Collection, Events } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import registerCommands from './utils/registerCommands.js';

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
const commandsPath = path.join(process.cwd(), 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = await import(`file://${path.join(folderPath, file)}`);
    client.commands.set(command.data.name, command);
  }
}

// Discord API'ye komutları kaydet
await registerCommands();

client.once(Events.ClientReady, () => {
  console.log(`Bot giriş yaptı: ${client.user.tag}`);
});

// Komut çalıştırma
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Komut çalıştırılırken hata oluştu!', ephemeral: true });
  }
});

// Selam sistemi
client.on('messageCreate', message => {
  if (message.author.bot) return;
  const greetings = ['sa', 'SA', 'slm', 'Selam', 'selam aleykum', 'selamun aleykum'];
  if (greetings.some(g => message.content.includes(g))) {
    message.channel.send('Aleyküm selam hoş geldin.');
  }
});

// Yeni üyeye kayıtsız rolü verme
client.on('guildMemberAdd', member => {
  const roleId = process.env.ROLE_KAYITSIZ;
  if (!roleId) return;
  const role = member.guild.roles.cache.get(roleId);
  if (role) member.roles.add(role).catch(console.error);
});

client.login(process.env.TOKEN);
