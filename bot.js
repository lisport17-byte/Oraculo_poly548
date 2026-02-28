const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const axios = require('axios');
const fs = require('fs');

// --- 1. EL PARCHE FANTASMA PARA RENDER ---
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Centinela 548: Frecuencia Activa, Evolucionando...\n');
});
server.listen(PORT, () => console.log(`==> Servidor activo en puerto ${PORT}`));

// --- 2. IDENTIDAD Y CONEXIÓN REFORZADA ---
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.CHAT_ID;
const groqApiKey = process.env.GROQ_API_KEY;

// Hemos amplificado la antena de polling para evitar micro-cortes de Render
const bot = new TelegramBot(token, {
    polling: {
        interval: 2000, // Aumentado a 2s para mayor estabilidad en Render
        autoStart: true,
        params: { timeout: 10 } // Long polling optimizado
    },
    request: {
        agentOptions: {
            keepAlive: true,
            family: 4 // Fuerza IPv4 para evitar errores de red comunes
        }
    }
});

console.log("==> Sistema Centinela 548 activado... Antena amplificada.");

// --- 3. INICIALIZAR MEMORIA DE ERRORES ---
const archivoMemoria = 'memoria_errores.json';
let memoriaErrores = [];

if (fs.existsSync(archivoMemoria)) {
    memoriaErrores = JSON.parse(fs.readFileSync(archivoMemoria, 'utf8'));
    console.log(`==> Memoria cargada: ${memoriaErrores.length} lecciones aprendidas.`);
} else {
    fs.writeFileSync(archivoMemoria, JSON.stringify([]));
    console.log("==> Archivo de Memoria creado. Lienzo en blanco.");
}

// --- 4. COMANDO PARA ENSEÑAR AL BOT ---
bot.onText(/\/fallo (.+) - (.+)/, (msg, match) => {
    const ca = match[1].trim();
    const motivo = match[2].trim();
    
    memoriaErrores.push({ ca, motivo, fecha: new Date().toISOString() });
    fs.writeFileSync(archivoMemoria, JSON.stringify(memoriaErrores, null, 2));
    
    bot.sendMessage(chatId, `🧠 **Lección Aprendida:**\nCA: \`${ca}\`\nMotivo: ${motivo}\n\nLa energía ha sido recalibrada.`, {parse_mode: 'Markdown'});
});

// --- 5. EL CEREBRO DE LA IA (GROQ) CON MEMORIA ---
async function consultarOraculoIA(datosDelToken) {
    try {
        const contextoErrores = memoriaErrores.slice(-5).map(e => `Fallo: ${e.motivo}`).join(" | ");

        const promptSystem = `Eres un trader experto de la élite y auditor de contratos en Solana. No haces scalping. 
        Analiza estos datos del token: ${JSON.stringify(datosDelToken)}.
        Evalúa: 1. Buen volumen. 2. Liquidez. 3. No estafa. 4. Control de ballenas.
        
        ATENCIÓN - ERRORES RECIENTES: [${contextoErrores}]
        Si ves similitudes sospechosas, rechaza.
        
        SI Y SOLO SI el token cumple todo y tiene Mcap 30k-100k, tu ÚNICA respuesta debe ser exactamente: "luz verde dispara, es el momento, aquí la elite está concentrando energía, próximamente se verán los movimientos". 
        Si hay dudas, responde "RECHAZADO" y el motivo.`;

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama3-70b-8192",
            messages: [
                { role: "system", content: promptSystem },
                { role: "user", content: "Analiza esta gema y cruza con memoria." }
            ],
            temperature: 0.1
        }, {
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            }
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
                        nombre: pairData.baseToken.name,
                        simbolo: pairData.baseToken.symbol,
                        mCap_USD: mCap,
                        liquidez_USD: liquidez,
                        volumen_24h: pairData.volume.h24
                    });

                    if (analisisIA.includes("luz verde dispara")) {
                        const mensajeFinal = `🟢 **SEÑAL DE ALTA PRECISIÓN** 🟢\n\n` +
                                             `🏷️ **Nombre:** ${pairData.baseToken.name} (${pairData.baseToken.symbol})\n` +
                                             `📜 **CA:** \`${tokenAddress}\`\n\n` +
                                             `💰 **Market Cap:** $${mCap.toLocaleString()}\n` +
                                             `💧 **Liquidez:** $${liquidez.toLocaleString()}\n\n` +
                                             `🧠 **Oráculo:**\n${analisisIA}\n\n` +
                                             `📊 **Gráfico:** https://dexscreener.com/solana/${tokenAddress}`;
                        
                        bot.sendMessage(chatId, mensajeFinal, {parse_mode: 'Markdown'});
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

// --- DIAGNÓSTICO PROFUNDO ---
bot.on('polling_error', (error) => {
    console.log("🚨 ALERTA CRÍTICA TELEGRAM:", error.code, "-", error.message);
});
