const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const axios = require('axios');

// --- 1. EL PARCHE FANTASMA PARA RENDER ---
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Centinela 548: Frecuencia Activa, Buscando Gemas...\n');
});
server.listen(PORT, () => {
  console.log(`==> Servidor activo en puerto ${PORT}`);
});

// --- 2. IDENTIDAD Y CONEXIÓN ---
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.CHAT_ID;
const groqApiKey = process.env.GROQ_API_KEY;
// Evitamos el error 409 reiniciando la conexión limpiamente
const bot = new TelegramBot(token, {polling: true});

console.log("==> Sistema Centinela 548 activado... Protocolo Autónomo Iniciado.");

// --- 3. EL CEREBRO DE LA IA (GROQ) ---
async function consultarOraculoIA(datosDelToken) {
    try {
        const promptSystem = `Eres un trader experto de la élite y auditor de contratos en Solana. No haces scalping. 
        Analiza estos datos del token: ${JSON.stringify(datosDelToken)}.
        Evalúa estrictamente: 
        1. Que el dinero se esté moviendo ahí (buen volumen). 
        2. Que tenga liquidez suficiente para cobrar profit. 
        3. Que no sea estafa. 
        4. Que no haya suficientes ballenas para manipular el precio.
        
        SI Y SOLO SI el token cumple con todo esto y tiene un Market Cap entre 30k y 100k, tu ÚNICA respuesta debe ser exactamente esta frase: "luz verde dispara, es el momento, aquí la elite está concentrando energía, próximamente se verán los movimientos". 
        Si el token tiene fallas o no convence, responde "RECHAZADO" y el motivo breve.`;

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama3-70b-8192",
            messages: [
                { role: "system", content: promptSystem },
                { role: "user", content: "Analiza esta gema recién graduada." }
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
        console.error("Error en la IA:", error.message);
        return "ERROR_IA";
    }
}

// --- 4. EL CAZADOR AUTOMÁTICO (LOS OJOS DEL BOT) ---
// Usamos un Set para la "Memoria de Errores" y no analizar el mismo token dos veces
const tokensAnalizados = new Set();

async function cazarGemas() {
    try {
        console.log("🔍 Escaneando la blockchain en busca de gemas graduándose...");
        
        // Obtenemos los últimos tokens listados (API de DexScreener)
        const response = await axios.get('https://api.dexscreener.com/token-profiles/latest/v1');
        const ultimosTokens = response.data;

        // Filtramos solo los de Solana
        const tokensSolana = ultimosTokens.filter(t => t.chainId === 'solana');

        for (const tokenData of tokensSolana) {
            const tokenAddress = tokenData.tokenAddress;

            // Memoria: Si ya lo vimos, lo saltamos
            if (tokensAnalizados.has(tokenAddress)) continue;
            tokensAnalizados.add(tokenAddress);

            // Buscamos sus datos financieros reales (Liquidez, Mcap, Volumen)
            const dexUrl = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
            const dexResponse = await axios.get(dexUrl);

            if (dexResponse.data.pairs && dexResponse.data.pairs.length > 0) {
                const pairData = dexResponse.data.pairs[0];
                const mCap = pairData.fdv || 0;
                const liquidez = pairData.liquidity ? pairData.liquidity.usd : 0;

                // FILTRO DE ENERGÍA: Solo pasamos a la IA los que están en el rango 30k - 100k
                if (mCap >= 30000 && mCap <= 100000 && liquidez > 5000) {
                    console.log(`🔥 Gema potencial encontrada: ${pairData.baseToken.symbol} | Mcap: $${mCap}`);
                    
                    const analisisIA = await consultarOraculoIA({
                        simbolo: pairData.baseToken.symbol,
                        mCap_USD: mCap,
                        liquidez_USD: liquidez,
                        volumen_24h: pairData.volume.h24,
                        cambio_precio: pairData.priceChange.h24
                    });

                    // SI LA IA DA LA LUZ VERDE, TE AVISA INMEDIATAMENTE
                    if (analisisIA.includes("luz verde dispara")) {
                        const mensajeFinal = `🟢 **SEÑAL DE ALTA PRECISIÓN** 🟢\n\n` +
                                             `**Token:** ${pairData.baseToken.symbol}\n` +
                                             `**Contrato:** \`${tokenAddress}\`\n` +
                                             `**Market Cap:** $${mCap}\n` +
                                             `**Liquidez:** $${liquidez}\n\n` +
                                             `🧠 **Mensaje del Oráculo:**\n${analisisIA}\n\n` +
                                             `📊 **Revisar:** https://dexscreener.com/solana/${tokenAddress}`;
                        
                        bot.sendMessage(chatId, mensajeFinal, {parse_mode: 'Markdown'});
                    } else {
                        console.log(`❌ Descartado por la IA: ${pairData.baseToken.symbol} - ${analisisIA}`);
                    }
                }
            }
            // Esperamos 2 segundos entre cada análisis para no saturar las APIs
            await new Promise(resolve => setTimeout(resolve, 2000)); 
        }
    } catch (error) {
        console.error("Interferencia en el rastreo:", error.message);
    }
}

// Ejecutar el cazador cada 5 minutos automáticamente
setInterval(cazarGemas, 5 * 60 * 1000);
cazarGemas(); // Ejecutar la primera vez al encender

// Manejo de errores de Telegram
bot.on('polling_error', (error) => {
    if (error.code !== 'ETELEGRAM') {
        console.log("Error de conexión:", error.code);
    }
});
