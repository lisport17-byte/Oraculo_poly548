const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const axios = require('axios');
const fs = require('fs'); // Librería para crear la Memoria de Errores

// --- 1. EL PARCHE FANTASMA PARA RENDER ---
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Centinela 548: Frecuencia Activa, Evolucionando...\n');
});
server.listen(PORT, () => console.log(`==> Servidor activo en puerto ${PORT}`));

// --- 2. IDENTIDAD Y CONEXIÓN ---
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.CHAT_ID;
const groqApiKey = process.env.GROQ_API_KEY;
const bot = new TelegramBot(token, {polling: true});

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
// Uso en Telegram: /fallo [CA] - [Motivo]
bot.onText(/\/fallo (.+) - (.+)/, (msg, match) => {
    const ca = match[1].trim();
    const motivo = match[2].trim();
    
    memoriaErrores.push({ ca, motivo, fecha: new Date().toISOString() });
    fs.writeFileSync(archivoMemoria, JSON.stringify(memoriaErrores, null, 2));
    
    bot.sendMessage(chatId, `🧠 **Lección Aprendida:**\nCA: \`${ca}\`\nMotivo: ${motivo}\n\nLa energía ha sido recalibrada. La IA no repetirá este patrón.`, {parse_mode: 'Markdown'});
});

// --- 5. EL CEREBRO DE LA IA (GROQ) CON MEMORIA ---
async function consultarOraculoIA(datosDelToken) {
    try {
        // Le pasamos los últimos 5 errores a la IA para que aprenda del contexto
        const contextoErrores = memoriaErrores.slice(-5).map(e => `Fallo previo por: ${e.motivo}`).join(" | ");

        const promptSystem = `Eres un trader experto de la élite y auditor de contratos en Solana. No haces scalping. 
        Analiza estos datos del token: ${JSON.stringify(datosDelToken)}.
        Evalúa estrictamente: 1. Buen volumen. 2. Liquidez para cobrar profit. 3. No estafa. 4. Control de ballenas.
        
        ATENCIÓN - HISTORIAL DE ERRORES RECIENTES: [${contextoErrores}]
        Aprende de estos errores. Si los datos actuales muestran similitudes sospechosas con nuestros fallos pasados, rechaza el token inmediatamente.
        
        SI Y SOLO SI el token cumple con todo, tiene Mcap 30k-100k y no se parece a las trampas pasadas, tu ÚNICA respuesta debe ser exactamente: "luz verde dispara, es el momento, aquí la elite está concentrando energía, próximamente se verán los movimientos". 
        Si hay dudas, responde "RECHAZADO" y el motivo.`;

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama3-70b-8192",
            messages: [
                { role: "system", content: promptSystem },
                { role: "user", content: "Analiza esta gema y cruza los datos con la memoria de errores." }
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
        const response = await axios.get('https://api.dexscreener.com/token-profiles/latest/v1');
        const tokensSolana = response.data.filter(t => t.chainId === 'solana');

        for (const tokenData of tokensSolana) {
            const tokenAddress = tokenData.tokenAddress;

            // Evitar analizar tokens ya reportados en la memoria de errores
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
        console.error("Interferencia:", error.message);
    }
}

setInterval(cazarGemas, 5 * 60 * 1000);
cazarGemas(); 

bot.on('polling_error', (error) => {
    console.log("🚨 REPORTE DE ERROR EXACTO TELEGRAM:", error.code, error.message);
});
