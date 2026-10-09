import os
import requests
from dotenv import load_dotenv

load_dotenv("backend/.env")
API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
headers = {
    "Accept": "audio/mpeg",
    "Content-Type": "application/json",
    "xi-api-key": API_KEY
}
data = {
    "text": "Hello world",
    "model_id": "eleven_flash_v2_5",
    "voice_settings": {
        "stability": 0.5,
        "similarity_boost": 0.5
    }
}
resp = requests.post(url, json=data, headers=headers)
print(resp.status_code)
print(resp.text)
