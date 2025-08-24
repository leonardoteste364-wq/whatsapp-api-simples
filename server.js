const express = require('express');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

const logger = pino({ level: 'silent' });
let sock = null;
let qrCodeData = null;
let isConnected = false;

// Página inicial
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'WhatsApp API Simples',
        connected: isConnected,
        endpoints: {
            connect: 'GET /connect',
            qr: 'GET /qr',
            send: 'POST /send',
            status: 'GET /status'
        }
    });
});

// Conectar WhatsApp
app.get('/connect', async (req, res) => {
    try {
        if (sock && isConnected) {
            return res.json({ success: true, message: 'Já conectado!' });
        }
        
        await connectWhatsApp();
        res.json({ success: true, message: 'Conectando... Use /qr para ver o QR Code' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Ver QR Code
app.get('/qr', async (req, res) => {
    if (!qrCodeData) {
        return res.json({ success: false, message: 'QR Code não disponível. Use /connect primeiro.' });
    }
    
    try {
        const qrCodeImage = await QRCode.toDataURL(qrCodeData);
        res.send(`
            <h2>📱 Escaneie com WhatsApp</h2>
            <img src="${qrCodeImage}" alt="QR Code" />
            <p>1. Abra WhatsApp</p>
            <p>2. Configurações > Aparelhos conectados</p>
            <p>3. Conectar aparelho</p>
            <p>4. Escaneie o código</p>
        `);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Enviar mensagem
app.post('/send', async (req, res) => {
    const { number, message } = req.body;
    
    if (!sock || !isConnected) {
        return res.status(400).json({ success: false, message: 'WhatsApp não conectado' });
    }
    
    if (!number || !message) {
        return res.status(400).json({ success: false, message: 'Número e mensagem são obrigatórios' });
    }
    
    try {
        const formattedNumber = number.includes('@') ? number : `${number}@s.whatsapp.net`;
        await sock.sendMessage(formattedNumber, { text: message });
        
        res.json({ success: true, message: 'Mensagem enviada!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Status
app.get('/status', (req, res) => {
    res.json({
        connected: isConnected,
        hasQR: !!qrCodeData,
        user: sock?.user || null
    });
});

async function connectWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    sock = makeWASocket({
        auth: state,
        logger: logger,
        browser: ['WhatsApp API', 'Desktop', '1.0.0']
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrCodeData = qr;
            console.log('📱 QR Code gerado! Acesse /qr para visualizar');
        }
        
        if (connection === 'close') {
            isConnected = false;
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect) {
                console.log('🔄 Reconectando...');
                setTimeout(() => connectWhatsApp(), 5000);
            }
        } else if (connection === 'open') {
            isConnected = true;
            qrCodeData = null;
            console.log('✅ WhatsApp conectado!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
    
    // Log de mensagens recebidas
    sock.ev.on('messages.upsert', (messageUpdate) => {
        const message = messageUpdate.messages[0];
        if (!message.key.fromMe) {
            console.log('📩 Mensagem recebida:', message.message?.conversation);
        }
    });
}

app.listen(PORT, () => {
    console.log(`🚀 API rodando na porta ${PORT}`);
    console.log(`🌐 URL: https://sua-url.onrender.com`);
});
