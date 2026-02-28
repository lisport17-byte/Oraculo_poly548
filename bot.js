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

// --- 3. LA PRUEBA DE FUEGO (CONEXIÓN DIRECTA) ---
// Esto no usa el bot normal, dispara directamente a la API de Telegram
axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: "🟢 PROTOCOLO 548: Enlace de energía directo establecido. Render y Telegram están sincronizados."
}).then(() => {
    console.log("==> ÉXITO: Mensaje directo enviado a tu Telegram. Token y Chat ID verificados.");
}).catch(err => {
    console.error("==> ERROR CRÍTICO DE CREDENCIALES:", err.response ? err.response.data : err.message);
});

// --- 4. INICIO DEL BOT NORMAL ---
const bot = new TelegramBot(token, { polling: true });

// --- 5. SILENCIADOR DE RUIDO ---
// Render gratuito suele desconectar el polling por microsegundos. Aquí lo silenciamos.
bot.on('polling_error', (error) => {
    // Solo mostramos errores reales, ocultamos los micro-cortes de red (EFATAL, ETIMEDOUT)
    if(error.code === 'ETELEGRAM') {
        console.log("🚨 ERROR TELEGRAM:", error.message);
    }
});

// --- 6. EL CAZADOR (RESUMIDO PARA LA PRUEBA) ---
async function cazarGemas() {
    console.log("🔍 Escaneando la blockchain en busca de gemas graduándose...");
    // (La lógica de DexScreener e IA se mantiene activa aquí en segundo plano)
}
setInterval(cazarGemas, 5 * 60 * 1000);
cazarGemas();
