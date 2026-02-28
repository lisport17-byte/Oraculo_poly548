import os
import requests
from dotenv import load_dotenv

load_dotenv()

def enviar_telegram(mensaje):
    """Envía una señal directamente a tu dispositivo móvil"""
    token = os.getenv("8728314477:AAGctXnbLibn__otWVXO1eJPNAY7_hQDcj4")
    chat_id = os.getenv("716398713")
    
    # Si no configuraste Telegram, simplemente ignora el envío sin dañar el bot
    if not token or not chat_id:
        return 
        
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": mensaje,
        "parse_mode": "HTML" # Permite usar negritas y formato
    }
    
    try:
        requests.post(url, json=payload, timeout=5)
    except Exception as e:
        print(f"⚠️ Error en la antena de Telegram: {e}")

# --- PRUEBA AISLADA ---
if __name__ == "__main__":
    print("Enviando mensaje de prueba...")
    enviar_telegram("🔌 <b>Conexión a la Matrix establecida.</b> El Oráculo está en línea.")
    print("Revisa tu Telegram.")
