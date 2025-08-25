// Página de teste integrada
app.get('/test', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>WhatsApp API - Teste</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 600px; 
                margin: 50px auto; 
                padding: 20px; 
                background: linear-gradient(135deg, #25D366, #128C7E);
                min-height: 100vh;
            }
            .container { 
                background: white; 
                padding: 30px; 
                border-radius: 15px; 
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                color: #25D366;
            }
            input, textarea, button { 
                width: 100%; 
                padding: 12px; 
                margin: 10px 0; 
                border: 2px solid #ddd; 
                border-radius: 8px; 
                font-size: 16px;
                box-sizing: border-box;
            }
            button { 
                background: #25D366; 
                color: white; 
                cursor: pointer; 
                font-weight: bold;
                transition: all 0.3s;
                border: none;
            }
            button:hover { 
                background: #128C7E; 
                transform: translateY(-1px);
            }
            .status { 
                padding: 15px; 
                margin: 15px 0; 
                border-radius: 8px; 
                font-weight: bold;
            }
            .success { background: #d4edda; color: #155724; border-left: 4px solid #28a745; }
            .error { background: #f8d7da; color: #721c24; border-left: 4px solid #dc3545; }
            .info { background: #cce7ff; color: #0c5499; border-left: 4px solid #007bff; }
            .warning { background: #fff3cd; color: #856404; border-left: 4px solid #ffc107; }
            
            .action-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin: 20px 0;
            }
            
            .form-group {
                margin: 15px 0;
            }
            
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
                color: #333;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 WhatsApp API</h1>
                <p>Teste sua API de WhatsApp</p>
            </div>
            
            <div class="status info">
                <h3>📊 Status da Conexão:</h3>
                <p id="status">🔄 Verificando...</p>
                <button onclick="checkStatus()" style="width: auto; padding: 8px 16px;">🔄 Atualizar</button>
            </div>
            
            <div class="action-buttons">
                <button onclick="connectWhatsApp()">📱 Conectar WhatsApp</button>
                <button onclick="showQR()">📋 Ver QR Code</button>
                <button onclick="restartConnection()">🔄 Reiniciar</button>
                <button onclick="checkStatus()">📊 Status</button>
            </div>
            
            <div class="form-group">
                <h3>📤 Enviar Mensagem de Teste:</h3>
                <label for="number">Número (com DDI):</label>
                <input type="text" id="number" placeholder="Exemplo: 5511999999999" value="5511999999999">
                
                <label for="message">Mensagem:</label>
                <textarea id="message" rows="3" placeholder="Digite sua mensagem...">🤖 Olá! Este é um teste da API WhatsApp funcionando perfeitamente! ✅</textarea>
                
                <button onclick="sendMessage()">🚀 Enviar Mensagem</button>
            </div>
            
            <div id="result"></div>
            
            <div class="status warning" style="margin-top: 30px;">
                <h4>💡 Como usar:</h4>
                <ol>
                    <li><strong>Conectar:</strong> Clique em "📱 Conectar WhatsApp"</li>
                    <li><strong>QR Code:</strong> Aguarde 10s e clique "📋 Ver QR Code"</li>
                    <li><strong>Escanear:</strong> Use o WhatsApp do celular para escanear</li>
                    <li><strong>Testar:</strong> Coloque seu número e teste o envio</li>
                </ol>
            </div>
        </div>
        
        <script>
            // Função para mostrar resultados
            function showResult(message, type = 'info') {
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = '<div class="status ' + type + '">' + message + '</div>';
                
                // Auto-limpar após 8 segundos
                setTimeout(() => {
                    if (resultDiv.innerHTML.includes(message)) {
                        resultDiv.innerHTML = '';
                    }
                }, 8000);
            }
            
            // Verificar status
            async function checkStatus() {
                try {
                    showResult('🔄 Verificando status...', 'info');
                    
                    const response = await fetch('/status');
                    const data = await response.json();
                    
                    let statusText = '';
                    let statusClass = 'info';
                    
                    if (data.connected) {
                        statusText = '✅ <strong>CONECTADO</strong><br>';
                        statusText += '👤 Usuário: ' + (data.user?.name || 'Nome não disponível') + '<br>';
                        statusText += '📱 Número: ' + (data.user?.id?.split(':')[0] || 'Número não disponível');
                        statusClass = 'success';
                    } else if (data.connecting) {
                        statusText = '🔄 <strong>CONECTANDO...</strong><br>Aguarde ou use "Ver QR Code"';
                        statusClass = 'warning';
                    } else {
                        statusText = '❌ <strong>DESCONECTADO</strong><br>Use "Conectar WhatsApp"';
                        statusClass = 'error';
                    }
                    
                    statusText += '<br><small>📅 ' + new Date(data.timestamp).toLocaleString('pt-BR') + '</small>';
                    
                    document.getElementById('status').innerHTML = statusText;
                    document.getElementById('status').className = statusClass;
                    
                    showResult('✅ Status atualizado!', 'success');
                    
                } catch (error) {
                    document.getElementById('status').innerHTML = '❌ <strong>ERRO</strong><br>Não foi possível verificar o status';
                    showResult('❌ Erro ao verificar status: ' + error.message, 'error');
                }
            }
            
            // Conectar WhatsApp
            async function connectWhatsApp() {
                try {
                    showResult('🔄 Iniciando conexão com WhatsApp...', 'info');
                    
                    const response = await fetch('/connect');
                    const data = await response.json();
                    
                    if (data.success) {
                        showResult('✅ ' + data.message + '<br>💡 Aguarde alguns segundos e clique em "Ver QR Code"', 'success');
                        
                        // Auto-verificar status após 3 segundos
                        setTimeout(checkStatus, 3000);
                    } else {
                        showResult('❌ Erro: ' + data.message, 'error');
                    }
                } catch (error) {
                    showResult('❌ Erro de conexão: ' + error.message, 'error');
                }
            }
            
            // Mostrar QR Code
            function showQR() {
                showResult('📱 Abrindo QR Code em nova aba...', 'info');
                window.open('/qr', '_blank', 'width=500,height=600');
            }
            
            // Reiniciar conexão
            async function restartConnection() {
                try {
                    showResult('🔄 Reiniciando conexão...', 'warning');
                    
                    const response = await fetch('/restart', { method: 'POST' });
                    const data = await response.json();
                    
                    if (data.success) {
                        showResult('✅ ' + data.message + '<br>💡 Agora você pode usar "Conectar WhatsApp" novamente', 'success');
                        setTimeout(checkStatus, 2000);
                    } else {
                        showResult('❌ Erro ao reiniciar: ' + data.message, 'error');
                    }
                } catch (error) {
                    showResult('❌ Erro: ' + error.message, 'error');
                }
            }
            
            // Enviar mensagem
            async function sendMessage() {
                const number = document.getElementById('number').value.trim();
                const message = document.getElementById('message').value.trim();
                
                if (!number || !message) {
                    showResult('❌ Preencha o número e a mensagem!', 'error');
                    return;
                }
                
                if (number.length < 10) {
                    showResult('❌ Número inválido! Use formato: 5511999999999', 'error');
                    return;
                }
                
                try {
                    showResult('📤 Enviando mensagem para ' + number + '...', 'info');
                    
                    const response = await fetch('/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ number, message })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showResult('✅ <strong>Mensagem enviada com sucesso!</strong><br>📱 Para: ' + number + '<br>💬 Texto: ' + message.substring(0, 100) + '...', 'success');
                    } else {
                        showResult('❌ Falha no envio: ' + data.message, 'error');
                    }
                } catch (error) {
                    showResult('❌ Erro no envio: ' + error.message, 'error');
                }
            }
            
            // Verificar status ao carregar
            checkStatus();
            
            // Auto-atualizar status a cada 15 segundos
            setInterval(checkStatus, 15000);
        </script>
    </body>
    </html>
    `);
});
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
