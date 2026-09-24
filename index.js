const { Client, RemoteAuth } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const mongoose = require('mongoose');
const http = require('http');

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WhatsApp Countdown Bot is running!\n');
}).listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

const MONGO_URI = process.env.MONGO_URI;
const TARGET_DATE = new Date('2026-10-07T10:30:00+06:00');
const GROUP_NAME = "Fly to Cox";

mongoose.connect(MONGO_URI).then(() => {
    console.log('Connected to MongoDB Session Store!');
    
    const store = new MongoStore({ mongoose: mongoose });
    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 60000
        }),
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
        console.log('==================================================');
        console.log('OPEN THIS LINK IN YOUR BROWSER TO SCAN QR CODE:');
        console.log(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`);
        console.log('==================================================');
    });

    client.on('ready', async () => {
        console.log('WhatsApp Bot is connected and running!');
        await updateCountdown(client);
        setInterval(() => updateCountdown(client), 3600000); // Every 1 hour
    });

    client.initialize();
}).catch(err => {
    console.error('MongoDB Connection Error:', err);
});

async function updateCountdown(client) {
    try {
        const chats = await client.getChats();
        const groupChats = chats.filter(c => c.isGroup);
        
        console.log('--- FOUND GROUPS IN YOUR ACCOUNT ---');
        groupChats.forEach(g => console.log(`Group Name: "${g.name}"`));
        console.log('------------------------------------');

        const group = groupChats.find(c => c.name.trim().toLowerCase() === GROUP_NAME.trim().toLowerCase());

        if (!group) {
            console.log(`❌ Target group "${GROUP_NAME}" not found in listed groups.`);
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
        console.log(`✅ SUCCESS! Updated description to: ${days} days, ${hours} hours left.`);
    } catch (err) {
        console.error('Error updating group description:', err);
    }
}
