// sticker_bot.js - WhatsApp sticker bot example using Baileys and wa-sticker-formatter
//
// This script listens for messages that begin with ".s". If the message
// quotes an image or video, it downloads the media, converts it into a sticker,
// and sends the sticker back to the sender. Make sure to install the required
// dependencies before running this script:
//   npm install @whiskeysockets/baileys wa-sticker-formatter pino
//
// Usage:
//   node sticker_bot.js
//
// On first run, a QR code will appear in the terminal. Scan it with WhatsApp
// (Linked Devices) to authenticate the bot. Your session data will be stored
// under the "auth" directory.

const {
  makeWASocket,
  useMultiFileAuthState,
  downloadMediaMessage, 
  fetchLatestBaileysVersion,
  jidNormalizedUser
} = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const Pino = require('pino');
const fs = require('fs');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version, isLatest } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: Pino({ level: 'fatal' }),
    printQRInTerminal: true,
    auth: state
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || !msg.key.remoteJid) return;

    // Cek jika pesan diawali dengan .s
    const textMsg = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (textMsg && textMsg.startsWith('.s')) {
      // Cek apakah pesan meng-quote media
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (quoted && (quoted.imageMessage || quoted.videoMessage)) {
        try {
          // Download media
          const mediaType = quoted.imageMessage ? 'imageMessage' : 'videoMessage';
          const mediaBuffer = await downloadMediaMessage(
            { message: quoted },
            'buffer',
            {},
            { logger: Pino({ level: 'fatal' }) }
          );

          // Convert ke sticker
          const sticker = new Sticker(mediaBuffer, {
            type: StickerTypes.FULL,
            pack: 'StickerWA',
            author: 'Bot'
          });
          const stickerBuffer = await sticker.toBuffer();

          // Kirim sticker ke pengirim
          await sock.sendMessage(msg.key.remoteJid, {
            sticker: stickerBuffer
          }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(msg.key.remoteJid, { text: 'Gagal membuat sticker.' }, { quoted: msg });
        }
      } else {
        await sock.sendMessage(msg.key.remoteJid, { text: 'Reply gambar/video dengan .s untuk membuat sticker.' }, { quoted: msg });
      }
    }
  });
}

startBot();
