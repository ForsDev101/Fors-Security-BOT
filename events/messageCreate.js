module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    const greetings = ['sa', 'selam', 'selamün aleyküm', 'aleyküm selam', 'slm', 's.a'];
    const msg = message.content.toLowerCase();

    if (greetings.some(greet => msg.includes(greet))) {
      message.reply('Aleyküm selam, hoş geldin! 😎');
    }
  }
};
