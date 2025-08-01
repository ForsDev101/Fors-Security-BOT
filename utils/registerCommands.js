import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const {
  CLIENT_ID,
  GUILD_ID,
  TOKEN,
} = process.env;

export default async function registerCommands() {
  const commands = [];
  const commandsPath = path.join(process.cwd(), "commands");
  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = await import(`file://${filePath}`);
      commands.push(command.data.toJSON());
    }
  }

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    console.log("Komutlar Discord API'ye yükleniyor...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("Komutlar başarıyla yüklendi.");
  } catch (error) {
    console.error(error);
  }
}
