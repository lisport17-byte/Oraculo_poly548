const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Configuración desde variables de entorno (Render)
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.CHAT_ID;
const bot = new TelegramBot(token, {polling: true});

console.log("Sistema Centinela 548 activado... Vigilando la luz.");

// Función para analizar tokens (Simulación de filtro 30k-100k Mcap)
async function scanRaydium() {
    try {
        // Aquí conectamos con Helius y DexScreener
        // Si detecta volumen y Mcap correcto:
        const mensaje = "🚀 LUZ VERDE DISPARA, ES EL MOMENTO. La elite está concentrando energía. Próximamente se verán los movimientos.";
        bot.sendMessage(chatId, mensaje);
    } catch (error) {
        console.error("Error en el escaneo:", error);
    }
}

// Ejecutar escaneo cada 15 minutos (al cierre de vela)
setInterval(scanRaydium, 15 * 60 * 1000);

bot.onText(/\/status/, (msg) => {
    bot.sendMessage(chatId, "El bot está operando en la frecuencia correcta. Esperando confluencia de energía.");
});
