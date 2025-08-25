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
let isConnecting = false;

// Página inicial
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'WhatsApp API Simples v2',
        connected: isConnected,
        connecting: isConnecting,
        endpoints: {
            connect: 'GET /connect',
            qr: 'GET /qr',
            send: 'POST /send',
            status: 'GET /status',
            restart: 'POST /restart'
        }
    });
});

// Conectar WhatsApp
app.get('/connect', async (req, res) => {
    try {
        if (sock && isConnected) {
            return res.json({ 
                success: true, 
                message: 'WhatsApp já está conectado!',
                user: sock.user 
            });
        }
        
        if (isConnecting) {
            return res.json({ 
                success: true, 
                message: 'Já está tentando conectar... Aguarde ou use /qr' 
            });
        }
        
        console.log('🚀 Iniciando conexão WhatsApp...');
        await connectWhatsApp();
        res.json({ 
            success: true, 
            message: 'Conectando... Aguarde 10 segundos e use /qr para ver o código' 
        });
    } catch (error) {
        console.error('❌ Erro ao conectar:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Ver QR Code
app.get('/qr', async (req, res) => {
    if (!qrCodeData) {
        return res.json({ 
            success: false, 
            message: 'QR Code não disponível. Status: ' + (isConnected ? 'Conectado' : isConnecting ? 'Conectando...' : 'Desconectado'),
            tip: 'Use /connect primeiro e aguarde alguns segundos'
        });
    }
    
    try {
        const qrCodeImage = await QRCode.toDataURL(qrCodeData);
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>WhatsApp QR Code</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f0f0f0; }
                    .container { background: white; padding: 30px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .qr-code { margin: 20px 0; }
                    .steps { text-align: left; max-width: 300px; margin: 20px auto; }
                    .step { margin: 10px 0; padding: 8px; background: #e8f5e8; border-radius: 5px; }
                </style>
                <script>
                    // Auto-refresh a cada 30 segundos para verificar se conectou
                    setTimeout(() => {
                        window.location.href = '/status';
                    }, 30000);
                </script>
            </head>
            <body>
                <div class="container">
                    <h2>📱 Escaneie com seu WhatsApp</h2>
                    <div class="qr-code">
                        <img src="${qrCodeImage}" alt="QR Code" style="border: 2px solid #25D366; border-radius: 8px;" />
                    </div>
                    <div class="steps">
                        <div class="step">1️⃣ Abra o WhatsApp no celular</div>
                        <div class="step">2️⃣ Vá em Configurações ⚙️</div>
                        <div class="step">3️⃣ Toque em "Aparelhos conectados"</div>
                        <div class="step">4️⃣ Toque em "Conectar um aparelho"</div>
                        <div class="step">5️⃣ Escaneie o código acima</div>
                    </div>
                    <p style="color: #666; font-size: 12px;">
                        ⏰ Código expira em ~20 segundos<br>
                        🔄 Página será redirecionada automaticamente
                    </p>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reiniciar conexão
app.post('/restart', async (req, res) => {
    try {
        console.log('🔄 Reiniciando conexão...');
        
        // Parar conexão atual
        if (sock) {
            sock.end();
            sock = null;
        }
        
        isConnected = false;
        isConnecting = false;
        qrCodeData = null;
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        res.json({ success: true, message: 'Conexão reiniciada! Use /connect novamente.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Enviar mensagem
app.post('/send', async (req, res) => {
    const { number, message } = req.body;
    
    if (!sock || !isConnected) {
        return res.status(400).json({ 
            success: false, 
            message: 'WhatsApp não conectado. Use /connect primeiro.',
            connected: isConnected
        });
    }
    
    if (!number || !message) {
        return res.status(400).json({ 
            success: false, 
            message: 'Parâmetros obrigatórios: number e message' 
        });
    }
    
    try {
        const formattedNumber = number.includes('@') ? number : `${number}@s.whatsapp.net`;
        
        // Verificar se o número existe no WhatsApp
        const [exists] = await sock.onWhatsApp(formattedNumber);
        
        if (!exists?.exists) {
            return res.status(400).json({
                success: false,
                message: 'Número não encontrado no WhatsApp: ' + number
            });
        }
        
        await sock.sendMessage(formattedNumber, { text: message });
        
        console.log(`✅ Mensagem enviada para ${number}: ${message.substring(0, 50)}...`);
        
        res.json({ 
            success: true, 
            message: 'Mensagem enviada com sucesso!',
            to: number,
            text: message.substring(0, 100) + (message.length > 100 ? '...' : '')
        });
    } catch (error) {
        console.error('❌ Erro ao enviar:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Status
app.get('/status', (req, res) => {
    res.json({
        connected: isConnected,
        connecting: isConnecting,
        hasQR: !!qrCodeData,
        user: sock?.user || null,
        timestamp: new Date().toISOString()
    });
});

async function connectWhatsApp() {
    if (isConnecting) {
        console.log('⚠️ Já está conectando...');
        return;
    }
    
    isConnecting = true;
    
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');
        
        sock = makeWASocket({
            auth: state,
            logger: logger,
            browser: ['WhatsApp API', 'Chrome', '1.0.0'],
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 10000,
            getMessage: async (key) => {
                return { conversation: '' };
            }
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr, isNewLogin } = update;
            
            if (qr) {
                qrCodeData = qr;
                console.log('📱 QR Code gerado! Acesse /qr para visualizar');
            }
            
            if (connection === 'close') {
                isConnected = false;
                isConnecting = false;
                
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                console.log('❌ Conexão fechada. Código:', statusCode);
                
                // Não reconectar automaticamente, deixar o usuário decidir
                if (statusCode !== DisconnectReason.loggedOut) {
                    console.log('💡 Use /restart e depois /connect para tentar novamente');
                } else {
                    console.log('🚪 Deslogado do WhatsApp. Use /restart para limpar sessão');
                    qrCodeData = null;
                }
                
            } else if (connection === 'open') {
                isConnected = true;
                isConnecting = false;
                qrCodeData = null;
                console.log('✅ WhatsApp conectado com sucesso!');
                console.log('👤 Usuário:', sock.user?.name);
                console.log('📱 Número:', sock.user?.id);
            }
        });

        sock.ev.on('creds.update', saveCreds);
        
        // Log de mensagens recebidas
        sock.ev.on('messages.upsert', (messageUpdate) => {
            const message = messageUpdate.messages[0];
            if (!message.key.fromMe && messageUpdate.type === 'notify') {
                const phoneNumber = message.key.remoteJid.split('@')[0];
                const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '[mídia]';
                console.log(`📩 Mensagem de ${phoneNumber}: ${text.substring(0, 100)}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
        isConnecting = false;
        throw error;
    }
}

app.listen(PORT, () => {
    console.log(`🚀 WhatsApp API rodando na porta ${PORT}`);
    console.log(`🌐 Acesse: https://sua-url.onrender.com`);
    console.log(`📋 Endpoints disponíveis:`);
    console.log(`   GET  /         - Status da API`);
    console.log(`   GET  /connect  - Conectar WhatsApp`);
    console.log(`   GET  /qr       - Ver QR Code`);
    console.log(`   POST /send     - Enviar mensagem`);
    console.log(`   GET  /status   - Status da conexão`);
    console.log(`   POST /restart  - Reiniciar conexão`);
});
