const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const axios = require('axios');
const fs = require('fs');

// --- 1. PARCHE FANTASMA ---
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => { res.writeHead(200); res.end('Centinela 548 Activo'); }).listen(PORT);

// --- 2. IDENTIDAD ---
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.CHAT_ID;
const groqApiKey = process.env.GROQ_API_KEY;

console.log("==> Iniciando Secuencia de Arranque Centinela 548...");

// --- 3. TU ANTENA DIRECTA (TRADUCIDA A JAVASCRIPT) ---
async function enviarTelegramDirecto(mensaje) {
    if (!token || !chatId) {
        console.log("Faltan credenciales de Telegram.");
        return;
    }
    
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
        chat_id: chatId,
        text: mensaje,
        parse_mode: "HTML", // Usaremos HTML como pediste para la prueba
        disable_web_page_preview: true
    };
    
    try {
        await axios.post(url, payload, { timeout: 5000 });
        console.log("==> Señal enviada a Telegram con éxito.");
    } catch (error) {
        console.error("⚠️ Error en la antena directa:", error.response ? error.response.data : error.message);
    }
}

// EJECUTAMOS TU PRUEBA AISLADA AL ARRANCAR
enviarTelegramDirecto("🔌 <b>Conexión a la Matrix establecida.</b> El Oráculo está en línea. Protocolo 548 activo.");

// --- 4. RECEPTOR DE COMANDOS (MODO SILENCIOSO) ---
// Mantenemos esto SOLO para escuchar comandos como /fallo, pero silenciamos sus errores de red
const bot = new TelegramBot(token, { polling: true });
bot.on('polling_error', () => { /* Silencio absoluto, ignoramos la interferencia de Render */ });

const archivoMemoria = 'memoria_errores.json';
let memoriaErrores = [];
if (fs.existsSync(archivoMemoria)) memoriaErrores = JSON.parse(fs.readFileSync(archivoMemoria, 'utf8'));

bot.onText(/\/fallo (.+) - (.+)/, (msg, match) => {
    const ca = match[1].trim();
    const motivo = match[2].trim();
    memoriaErrores.push({ ca, motivo, fecha: new Date().toISOString() });
    fs.writeFileSync(archivoMemoria, JSON.stringify(memoriaErrores, null, 2));
    
    // Usamos la antena directa para responder
    enviarTelegramDirecto(`🧠 <b>Lección Aprendida:</b>\nCA: <code>${ca}</code>\nMotivo: ${motivo}\n\nLa energía ha sido recalibrada.`);
});

// --- 5. EL CEREBRO DE LA IA (GROQ) ---
async function consultarOraculoIA(datosDelToken) {
    try {
        const contextoErrores = memoriaErrores.slice(-5).map(e => `Fallo: ${e.motivo}`).join(" | ");
        const promptSystem = `Eres un trader experto de la élite y auditor de contratos en Solana. No haces scalping. 
        Analiza: ${JSON.stringify(datosDelToken)}. Evalúa: 1. Volumen. 2. Liquidez. 3. No estafa. 4. Control ballenas.
        ERRORES RECIENTES: [${contextoErrores}]. Si hay similitudes, rechaza.
        
        SI Y SOLO SI cumple todo y Mcap 30k-100k, tu ÚNICA respuesta debe ser: "luz verde dispara, es el momento, aquí la elite está concentrando energía, próximamente se verán los movimientos". 
        Si hay dudas, responde "RECHAZADO" y el motivo.`;

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama3-70b-8192",
            messages: [
                { role: "system", content: promptSystem },
                { role: "user", content: "Analiza y cruza con memoria." }
            ],
            temperature: 0.1
        }, {
            headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        return "ERROR_IA";
    }
}

// --- 6. EL CAZADOR AUTOMÁTICO ---
const tokensAnalizados = new Set();

async function cazarGemas() {
    try {
        console.log("🔍 Escaneando radar 30k-100k...");
        const response = await axios.get('https://api.dexscreener.com/token-profiles/latest/v1');
        const tokensSolana = response.data.filter(t => t.chainId === 'solana');

        for (const tokenData of tokensSolana) {
            const tokenAddress = tokenData.tokenAddress;

            if (memoriaErrores.some(e => e.ca === tokenAddress)) continue;
            if (tokensAnalizados.has(tokenAddress)) continue;
            tokensAnalizados.add(tokenAddress);

            const dexUrl = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
            const dexResponse = await axios.get(dexUrl);

            if (dexResponse.data.pairs && dexResponse.data.pairs.length > 0) {
                const pairData = dexResponse.data.pairs[0];
                const mCap = pairData.fdv || 0;
                const liquidez = pairData.liquidity ? pairData.liquidity.usd : 0;

                if (mCap >= 30000 && mCap <= 100000 && liquidez > 5000) {
                    const analisisIA = await consultarOraculoIA({
                        nombre: pairData.baseToken.name, simbolo: pairData.baseToken.symbol,
                        mCap_USD: mCap, liquidez_USD: liquidez, volumen_24h: pairData.volume.h24
                    });

                    if (analisisIA.includes("luz verde dispara")) {
                        // Adaptado al formato HTML de tu nueva antena
                        const mensajeFinal = `🟢 <b>SEÑAL DE ALTA PRECISIÓN</b> 🟢\n\n` +
                                             `🏷️ <b>Nombre:</b> ${pairData.baseToken.name} (${pairData.baseToken.symbol})\n` +
                                             `📜 <b>CA:</b> <code>${tokenAddress}</code>\n\n` +
                                             `💰 <b>Market Cap:</b> $${mCap.toLocaleString()}\n` +
                                             `💧 <b>Liquidez:</b> $${liquidez.toLocaleString()}\n\n` +
                                             `🧠 <b>Oráculo:</b>\n${analisisIA}\n\n` +
                                             `📊 <a href="https://dexscreener.com/solana/${tokenAddress}">Ver Gráfico en DexScreener</a>`;
                        
                        enviarTelegramDirecto(mensajeFinal);
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 2000)); 
        }
    } catch (error) {
        console.error("Interferencia de rastreo:", error.message);
    }
}

setInterval(cazarGemas, 5 * 60 * 1000);
cazarGemas();
