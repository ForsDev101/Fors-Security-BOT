import { config } from "dotenv";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const commands = [
  new SlashCommandBuilder().setName("ban").setDescription("Bir kullanıcıyı sunucudan banlar")
    .addUserOption(opt => opt.setName("kullanıcı").setDescription("Banlanacak kişi").setRequired(true))
    .addStringOption(opt => opt.setName("sebep").setDescription("Sebep")),
  
  new SlashCommandBuilder().setName("kick").setDescription("Bir kullanıcıyı sunucudan atar")
    .addUserOption(opt => opt.setName("kullanıcı").setDescription("Atılacak kişi").setRequired(true))
    .addStringOption(opt => opt.setName("sebep").setDescription("Sebep")),

  // Diğer tüm slash komutları aynı şekilde eklenmeli burada,
  // index.js ile aynı komut seti olmalı!
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
