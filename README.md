# WhatsApp Sticker Bot

Bot WhatsApp untuk membuat stiker dari gambar/video dan mengubah stiker menjadi gambar, menggunakan Baileys dan wa-sticker-formatter.

## Fitur
- Kirim stiker dari gambar/video dengan reply dan perintah `.s`
- Ubah stiker menjadi gambar dengan reply dan perintah `.toimg`

## Cara Install & Jalankan
1. Clone repo:
   ```bash
   git clone https://github.com/zakkunaw/stiker-wa-bot.git
   cd stiker-wa-bot
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Jalankan bot:
   ```bash
   node sticker_bot_updated.js
   ```
4. Scan QR code di terminal dengan WhatsApp (Linked Devices).

## Alternatif Instalasi Manual
Jika ingin setup dari awal (tanpa package.json):
```bash
npm init -y
npm install @whiskeysockets/baileys wa-sticker-formatter pino qrcode-terminal
node sticker_bot_updated.js
```

## Cara Pakai
- Untuk membuat stiker: reply gambar/video lalu kirim `.s`
- Untuk mengubah stiker ke gambar: reply stiker lalu kirim `.toimg`

## Catatan
- Folder `auth` dan `node_modules` otomatis di-ignore dari repo.
- Jika fitur `.toimg` gagal, pastikan membalas stiker yang baru dikirim.

## Kontribusi
Pull request dan issue dipersilakan!
