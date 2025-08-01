const { readJSON } = require('../utils/fileHandler');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    // Örnek: Selamlaşma sistemi
    const greetings = ['sa', 'selam', 'selamün aleyküm', 'aleyküm selam', 'slm', 's.a', 'selamun aleykum'];
    const msgContent = message.content.toLowerCase();

    if (greetings.some(greet => msgContent.includes(greet))) {
      message.channel.send(`Aleyküm selam hoş geldin, ${message.author}!`);
    }

    // Buraya koruma sistemleri, spam, capslock engelleme gibi event tabanlı işlemler eklenebilir.
  }
};
