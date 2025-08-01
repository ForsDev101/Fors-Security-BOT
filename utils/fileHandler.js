const fs = require('fs');

function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '{}');
  } catch (error) {
    console.error('JSON okuma hatası:', error);
    return {};
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('JSON yazma hatası:', error);
  }
}

module.exports = { readJSON, writeJSON };
