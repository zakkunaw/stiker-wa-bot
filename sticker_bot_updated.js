// sticker_bot_updated.js - WhatsApp sticker bot example using Baileys and wa-sticker-formatter
//
// This script listens for messages that begin with ".s". If the message
// quotes an image or video, it downloads the media, converts it into a sticker,
// and sends the sticker back to the sender. Make sure to install the required
// dependencies before running this script:
//   npm install @whiskeysockets/baileys wa-sticker-formatter pino qrcode-terminal
//
// Usage:
//   node sticker_bot_updated.js
//
// On first run, a QR code will appear in the terminal via the connection.update
// event. Scan it with WhatsApp (Linked Devices) to authenticate the bot. Your
// session data will be stored under the "auth" directory.

const {
  makeWASocket,
  useMultiFileAuthState,
  downloadMediaMessage
} = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const Pino = require('pino');
const qrcode = require('qrcode-terminal');

async function startBot() {
  // Initialize auth state and storage folder
  const { state, saveCreds } = await useMultiFileAuthState('auth');

  // Create a new WhatsApp socket connection
  const sock = makeWASocket({
    logger: Pino({ level: 'fatal' }),
    auth: state // Deprecated printQRInTerminal removed
  });

  // Save credentials when updated
  sock.ev.on('creds.update', saveCreds);

  // Listen for connection updates to display QR code and handle reconnects
  sock.ev.on('connection.update', (update) => {
    const { qr, connection, lastDisconnect } = update;
    if (qr) {
      // Generate and print QR code in the terminal
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      console.log('Bot connected successfully');
    }
    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output?.statusCode) !== 401;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot().catch((err) => console.error(err));
    }
  });

  // Listen for new incoming messages
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      // Ignore system or empty messages
      if (!msg.message) continue;

      const from = msg.key.remoteJid;
      // Extract text from conversation or extended message
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        '';
      const command = text.trim().toLowerCase();

      // Check if the message starts with the .s command
      if (command.startsWith('.s')) {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        // Ensure the command is a reply to a media message (image or video)
        if (quoted && (quoted.imageMessage || quoted.videoMessage)) {
          try {
            // Download the media from the quoted message as a buffer
            const mediaBuffer = await downloadMediaMessage({ message: quoted }, 'buffer');
            // Create a sticker from the buffer
            const sticker = new Sticker(mediaBuffer, {
              pack: 'BotSticker', // Sticker pack name
              author: 'YourName', // Author name
              type: StickerTypes.FULL // Sticker format: FULL ensures the whole image
            });
            const stickerBuffer = await sticker.toBuffer();
            // Send the generated sticker back to the sender
            await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
          } catch (err) {
            console.error('Error processing sticker:', err);
            await sock.sendMessage(
              from,
              { text: 'Gagal membuat stiker. Pastikan balas gambar yang benar.' },
              { quoted: msg }
            );
          }
        } else {
          // Command used without replying to an image
          await sock.sendMessage(
            from,
            { text: 'Gunakan perintah .s dengan membalas pesan bergambar atau video.' },
            { quoted: msg }
          );
        }
      }
        // Fitur .toimg: balas stiker dengan .toimg untuk mengubah ke gambar
        if (command.startsWith('.toimg')) {
          const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
          if (quoted && quoted.stickerMessage) {
            try {
              // Download stiker sebagai buffer
              let mediaBuffer;
              try {
                mediaBuffer = await downloadMediaMessage({ message: quoted }, 'buffer');
              } catch (err) {
                console.error('downloadMediaMessage gagal, mencoba fallback:', err);
                // Fallback: coba ambil dari directPath/url
                const stickerMsg = quoted.stickerMessage;
                const mediaUrl = stickerMsg.url || stickerMsg.directPath;
                if (mediaUrl) {
                  const axios = require('axios');
                  const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
                  mediaBuffer = Buffer.from(response.data);
                } else {
                  throw new Error('Tidak ada url/directPath pada stickerMessage');
                }
              }
              // Kirim buffer sebagai gambar
              await sock.sendMessage(
                from,
                { image: mediaBuffer, caption: 'Berhasil mengubah stiker ke gambar.' },
                { quoted: msg }
              );
            } catch (err) {
              console.error('Error converting sticker to image (fallback):', err);
              await sock.sendMessage(
                from,
                { text: 'Gagal mengubah stiker ke gambar. Pastikan balas stiker yang benar.' },
                { quoted: msg }
              );
            }
          } else {
            await sock.sendMessage(
              from,
              { text: 'Gunakan perintah .toimg dengan membalas pesan stiker.' },
              { quoted: msg }
            );
          }
        }
    }
  });
}

startBot().catch((err) => console.error(err));
