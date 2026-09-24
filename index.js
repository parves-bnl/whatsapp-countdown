const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const http = require('http');
const path = require('path');

// Web server for Render health check
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsApp Countdown Bot is running!\n');
}).listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

const TARGET_DATE = new Date('2026-10-07T10:30:00+06:00');
const GROUP_NAME = "Fly to Cox";

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './session' }),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('--- SCAN QR CODE BELOW WITH WHATSAPP ---');
    qrcode.generate(qr, { small: false });
});

client.on('ready', () => {
    console.log('WhatsApp Bot is connected and running!');
    updateCountdown();
    setInterval(updateCountdown, 3600000); // Update every 1 hour
});

async function updateCountdown() {
    try {
        const chats = await client.getChats();
        const group = chats.find(c => c.isGroup && c.name === GROUP_NAME);

        if (!group) {
            console.log(`Group "${GROUP_NAME}" not found! Check name spelling.`);
            return;
        }

        const now = new Date();
        const diff = TARGET_DATE - now;

        if (diff <= 0) {
            await group.setDescription("✈️ Flight Has Taken Off! Enjoy Cox's Bazar! 🌊🌴");
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

        const countdownText = `🏖️ COX'S BAZAR TOUR 🌊\n✈️ Flight: Oct 07 @ 10:30 AM\n\n⏳ TIME REMAINING:\n👉 ${days} Days, ${hours} Hours left!\n\n_Auto-updated live countdown_`;

        await group.setDescription(countdownText);
        console.log(`Updated countdown: ${days} days, ${hours} hours left.`);
    } catch (err) {
        console.error('Error updating group description:', err);
    }
}

client.initialize();
