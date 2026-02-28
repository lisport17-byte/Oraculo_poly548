const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const axios = require('axios'); // Para conectarnos con Groq y DexScreener

// --- EL PARCHE FANTASMA PARA RENDER ---
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Centinela 548: Cerebro IA Conectado y Vigilando\n');
});
server.listen(PORT, () => {
  console.log(`==> Servidor activo en puerto ${PORT}`);
});

// --- CONFIGURACIÓN DE IDENTIDAD ---
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.CHAT_ID;
const groqApiKey = process.env.GROQ_API_KEY;
const bot = new TelegramBot(token, {polling: true});

console.log("==> Sistema Centinela 548 activado... Cargando IA Groq.");

// --- EL CEREBRO DE LA IA (GROQ) ---
async function consultarOraculoIA(datosDelToken) {
    try {
        const promptSystem = `Eres un trader experto de la élite y auditor de contratos en Solana. No haces scalping. 
        Analiza estos datos del token: ${JSON.stringify(datosDelToken)}.
        Evalúa estrictamente: 1. Que el dinero se esté moviendo ahí. 2. Que tenga liquidez suficiente para cobrar profit. 3. Que el creador no pueda estafar (sin puertas traseras). 4. Que no haya suficientes ballenas para manipular el precio.
        Sé mis ojos y guíame como a un ciego. 
        SI Y SOLO SI el token cumple con todo esto y la confluencia de energía es del 99.9%, tu ÚNICA respuesta debe ser exactamente esta frase: "luz verde dispara, es el momento, aquí la elite está concentrando energía, próximamente se verán los movimientos". 
        Si el token tiene fallas, responde con el motivo exacto del peligro y recházalo.`;

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama3-70b-8192", // El modelo más potente e inteligente de Groq
            messages: [
                { role: "system", content: promptSystem },
                { role: "user", content: "Analiza el token y dame tu veredicto." }
            ],
            temperature: 0.1 // Baja temperatura para análisis frío y calculador
        }, {
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error en la IA Groq:", error.message);
        return "Error de conexión con el Oráculo IA.";
    }
}

// --- COMANDO DE ANÁLISIS MANUAL ---
// Cuando le envíes un contrato al bot por Telegram, lo analizará
bot.onText(/\/analizar (.+)/, async (msg, match) => {
    const tokenAddress = match[1];
    bot.sendMessage(chatId, `🔍 Iniciando escaneo profundo del contrato: ${tokenAddress}... Buscando confluencia de energía.`);
    
    try {
        // 1. Buscamos los datos reales en DexScreener (API Gratuita)
        const dexUrl = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
        const dexResponse = await axios.get(dexUrl);
        
        if (dexResponse.data.pairs && dexResponse.data.pairs.length > 0) {
            const pairData = dexResponse.data.pairs[0];
            
            // 2. Pasamos los datos a la IA de Groq
            const analisisIA = await consultarOraculoIA({
                symbol: pairData.baseToken.symbol,
                liquidity: pairData.liquidity ? pairData.liquidity.usd : "Desconocida",
                fdv: pairData.fdv,
                volume24h: pairData.volume.h24,
                priceChange: pairData.priceChange.h24
            });

            // 3. El bot te envía la respuesta de la IA
            bot.sendMessage(chatId, `🧠 Veredicto de la IA:\n\n${analisisIA}`);
            
            // Memoria de Errores (Preparación)
            if (!analisisIA.includes("luz verde")) {
                console.log(`Token ${tokenAddress} descartado. Guardando en memoria de errores.`);
            }

        } else {
            bot.sendMessage(chatId, "⚠️ No se encontró liquidez ni datos en DexScreener para este contrato. Peligro extremo.");
        }
    } catch (error) {
        bot.sendMessage(chatId, "❌ Hubo una interferencia al leer el contrato.");
    }
});

// Comandos básicos
bot.onText(/\/status/, (msg) => {
    bot.sendMessage(chatId, "El Oráculo IA está en línea. Usa /analizar [Dirección_Del_Contrato] para filtrar la energía.");
});

bot.on('polling_error', (error) => {
    console.log("AVISO: Error de conexión con Telegram (Polling). Reintentando...");
});
